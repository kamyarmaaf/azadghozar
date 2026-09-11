import hashlib
import hmac
import logging
import re
import secrets
from datetime import timedelta
from math import ceil
from typing import Any, cast

from django.conf import settings
from django.core.cache import cache
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import APIException, ValidationError

from apps.accounts.models import OtpChallenge


logger = logging.getLogger(__name__)

SIGNUP_PURPOSE = "signup"
LOGIN_PURPOSE = "login"
PASSWORD_RESET_PURPOSE = "password_reset"  # nosec B105

SUPPORTED_PURPOSES = {
    SIGNUP_PURPOSE,
    LOGIN_PURPOSE,
    PASSWORD_RESET_PURPOSE,
}

DIGIT_TRANSLATION_TABLE = str.maketrans(
    "۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩",
    "01234567890123456789",
)


class OtpDeliveryUnavailable(APIException):
    status_code = 503
    default_detail = "سرویس ارسال کد موقتاً در دسترس نیست. دوباره تلاش کنید."
    default_code = "otp_delivery_unavailable"


def normalize_phone_number(value: str) -> str:
    """Convert common Iranian phone-number formats to E.164."""

    if not value:
        raise ValidationError(
            {"phone_number": "Phone number is required."}
        )

    normalized_value = str(value).translate(
        DIGIT_TRANSLATION_TABLE
    )
    digits = re.sub(r"\D", "", normalized_value)

    if digits.startswith("0098"):
        digits = digits[4:]
    elif digits.startswith("98"):
        digits = digits[2:]
    elif digits.startswith("0"):
        digits = digits[1:]

    if len(digits) != 10 or not digits.startswith("9"):
        raise ValidationError(
            {
                "phone_number": (
                    "Enter a valid Iranian mobile number."
                )
            }
        )

    return f"+98{digits}"


def _payload_key(purpose: str, phone_number: str) -> str:
    return f"otp:{purpose}:{phone_number}:payload"


def _cooldown_key(purpose: str, phone_number: str) -> str:
    return f"otp:{purpose}:{phone_number}:cooldown"


def _request_counter_key(
    purpose: str,
    phone_number: str,
) -> str:
    return f"otp:{purpose}:{phone_number}:hourly-requests"


def _hash_otp(
    purpose: str,
    phone_number: str,
    code: str,
) -> str:
    message = f"{purpose}:{phone_number}:{code}".encode()
    return hmac.new(
        key=settings.SECRET_KEY.encode(),
        msg=message,
        digestmod=hashlib.sha256,
    ).hexdigest()


def _safe_cache_get(key: str) -> Any | None:
    try:
        return cache.get(key)
    except Exception:
        logger.warning(
            "OTP Redis read failed; PostgreSQL fallback is active.",
            exc_info=True,
        )
        return None


def _safe_cache_set(key: str, value: Any, timeout: int) -> None:
    try:
        cache.set(key, value, timeout=timeout)
    except Exception:
        logger.warning(
            "OTP Redis write failed; PostgreSQL fallback is active.",
            exc_info=True,
        )


def _safe_cache_delete(key: str) -> None:
    try:
        cache.delete(key)
    except Exception:
        logger.warning(
            "OTP Redis delete failed; PostgreSQL remains authoritative.",
            exc_info=True,
        )


def _persist_challenge(
    *,
    purpose: str,
    phone_number: str,
    code_hash: str,
    metadata: dict[str, Any],
) -> OtpChallenge:
    now = timezone.now()
    expires_at = now + timedelta(
        seconds=settings.OTP_EXPIRATION_SECONDS
    )
    cooldown_until = now + timedelta(
        seconds=settings.OTP_RESEND_COOLDOWN_SECONDS
    )
    one_hour_ago = now - timedelta(hours=1)

    with transaction.atomic():
        challenge, created = (
            OtpChallenge.objects.select_for_update().get_or_create(
                phone_number=phone_number,
                purpose=purpose,
                defaults={
                    "code_hash": code_hash,
                    "metadata": metadata,
                    "attempts": 0,
                    "expires_at": expires_at,
                    "cooldown_until": cooldown_until,
                    "request_window_started_at": now,
                    "request_count": 1,
                    "consumed_at": None,
                },
            )
        )

        if created:
            if settings.OTP_MAX_REQUESTS_PER_HOUR < 1:
                challenge.delete()
                raise ValidationError(
                    {"phone_number": "Too many OTP requests. Try again later."}
                )
            return challenge

        if challenge.cooldown_until > now:
            retry_after = max(
                1,
                ceil(
                    (challenge.cooldown_until - now).total_seconds()
                ),
            )
            raise ValidationError(
                cast(
                    Any,
                    {
                        "phone_number": (
                            "OTP was recently requested. "
                            f"Try again in {retry_after} seconds."
                        ),
                        "retry_after": retry_after,
                    },
                )
            )

        if challenge.request_window_started_at <= one_hour_ago:
            challenge.request_window_started_at = now
            challenge.request_count = 0

        challenge.request_count += 1
        if challenge.request_count > settings.OTP_MAX_REQUESTS_PER_HOUR:
            raise ValidationError(
                {
                    "phone_number": (
                        "Too many OTP requests. Try again later."
                    )
                }
            )

        challenge.code_hash = code_hash
        challenge.metadata = metadata
        challenge.attempts = 0
        challenge.expires_at = expires_at
        challenge.cooldown_until = cooldown_until
        challenge.consumed_at = None
        challenge.save(
            update_fields=[
                "code_hash",
                "metadata",
                "attempts",
                "expires_at",
                "cooldown_until",
                "request_window_started_at",
                "request_count",
                "consumed_at",
                "updated_at",
            ]
        )
        return challenge


def _sync_challenge_to_cache(challenge: OtpChallenge) -> None:
    now = timezone.now()
    expiration_seconds = max(
        1,
        ceil((challenge.expires_at - now).total_seconds()),
    )
    cooldown_seconds = max(
        1,
        ceil((challenge.cooldown_until - now).total_seconds()),
    )
    request_window_seconds = max(
        1,
        ceil(
            (
                challenge.request_window_started_at
                + timedelta(hours=1)
                - now
            ).total_seconds()
        ),
    )

    _safe_cache_set(
        _payload_key(challenge.purpose, challenge.phone_number),
        {
            "code_hash": challenge.code_hash,
            "attempts": challenge.attempts,
            "expires_at": int(challenge.expires_at.timestamp()),
            "metadata": challenge.metadata,
            "version": challenge.updated_at.isoformat(),
        },
        timeout=expiration_seconds,
    )
    _safe_cache_set(
        _cooldown_key(challenge.purpose, challenge.phone_number),
        challenge.cooldown_until.timestamp(),
        timeout=cooldown_seconds,
    )
    _safe_cache_set(
        _request_counter_key(challenge.purpose, challenge.phone_number),
        challenge.request_count,
        timeout=request_window_seconds,
    )


def _celery_worker_is_available() -> bool:
    if getattr(settings, "CELERY_TASK_ALWAYS_EAGER", False):
        return True

    try:
        from config.celery import app as celery_app

        responses = celery_app.control.ping(
            timeout=settings.OTP_CELERY_HEALTH_TIMEOUT_SECONDS
        )
        return bool(responses)
    except Exception:
        logger.warning(
            "Celery health check failed; direct OTP delivery is active.",
            exc_info=True,
        )
        return False


def _dispatch_otp(
    *,
    phone_number: str,
    code: str,
    purpose: str,
) -> None:
    from apps.accounts.tasks import send_otp_sms, send_otp_sms_now

    if _celery_worker_is_available():
        try:
            send_otp_sms.apply_async(
                kwargs={
                    "phone_number": phone_number,
                    "code": code,
                    "purpose": purpose,
                },
                expires=settings.OTP_EXPIRATION_SECONDS,
            )
            return
        except Exception:
            logger.warning(
                "Celery enqueue failed; sending OTP directly.",
                exc_info=True,
            )

    try:
        send_otp_sms_now(
            phone_number=phone_number,
            code=code,
            purpose=purpose,
        )
    except Exception as exc:
        logger.exception("Both queued and direct OTP delivery failed.")
        raise OtpDeliveryUnavailable() from exc


def _release_failed_delivery(challenge: OtpChallenge) -> None:
    now = timezone.now()
    OtpChallenge.objects.filter(pk=challenge.pk).update(
        consumed_at=now,
        cooldown_until=now,
    )
    _safe_cache_delete(
        _payload_key(challenge.purpose, challenge.phone_number)
    )
    _safe_cache_delete(
        _cooldown_key(challenge.purpose, challenge.phone_number)
    )


def request_otp(
    *,
    phone_number: str,
    purpose: str,
    metadata: dict[str, Any] | None = None,
    dispatch_sms: bool = True,
) -> dict[str, int]:
    if purpose not in SUPPORTED_PURPOSES:
        raise ValueError("Unsupported OTP purpose.")

    otp_code = str(secrets.randbelow(1_000_000)).zfill(6)
    challenge = _persist_challenge(
        purpose=purpose,
        phone_number=phone_number,
        code_hash=_hash_otp(purpose, phone_number, otp_code),
        metadata=metadata or {},
    )
    _sync_challenge_to_cache(challenge)

    if dispatch_sms:
        try:
            _dispatch_otp(
                phone_number=phone_number,
                code=otp_code,
                purpose=purpose,
            )
        except OtpDeliveryUnavailable:
            _release_failed_delivery(challenge)
            raise

    return {
        "expires_in": settings.OTP_EXPIRATION_SECONDS,
        "resend_in": settings.OTP_RESEND_COOLDOWN_SECONDS,
    }


def verify_otp(
    *,
    phone_number: str,
    purpose: str,
    code: str,
) -> dict[str, Any]:
    payload_key = _payload_key(purpose, phone_number)
    cached_payload = _safe_cache_get(payload_key)
    received_hash = _hash_otp(purpose, phone_number, code)
    error: dict[str, Any] | None = None
    metadata: dict[str, Any] = {}
    active_challenge: OtpChallenge | None = None

    with transaction.atomic():
        challenge = (
            OtpChallenge.objects.select_for_update()
            .filter(phone_number=phone_number, purpose=purpose)
            .first()
        )
        now = timezone.now()

        if challenge is None or challenge.consumed_at is not None:
            error = {"otp": "OTP is invalid or has expired."}
        elif challenge.expires_at <= now:
            challenge.consumed_at = now
            challenge.save(update_fields=["consumed_at", "updated_at"])
            error = {"otp": "OTP is invalid or has expired."}
        elif challenge.attempts >= settings.OTP_MAX_VERIFY_ATTEMPTS:
            challenge.consumed_at = now
            challenge.save(update_fields=["consumed_at", "updated_at"])
            error = {
                "otp": "Maximum verification attempts exceeded."
            }
        else:
            expected_hash = challenge.code_hash
            if (
                isinstance(cached_payload, dict)
                and cached_payload.get("version")
                == challenge.updated_at.isoformat()
            ):
                expected_hash = str(
                    cached_payload.get("code_hash", expected_hash)
                )

            if not hmac.compare_digest(expected_hash, received_hash):
                challenge.attempts += 1
                if (
                    challenge.attempts
                    >= settings.OTP_MAX_VERIFY_ATTEMPTS
                ):
                    challenge.consumed_at = now
                    error = {
                        "otp": (
                            "Maximum verification attempts exceeded."
                        )
                    }
                else:
                    active_challenge = challenge
                    error = cast(
                        Any,
                        {
                            "otp": "OTP is incorrect.",
                            "remaining_attempts": (
                                settings.OTP_MAX_VERIFY_ATTEMPTS
                                - challenge.attempts
                            ),
                        },
                    )
                challenge.save(
                    update_fields=[
                        "attempts",
                        "consumed_at",
                        "updated_at",
                    ]
                )
            else:
                metadata = dict(challenge.metadata)
                challenge.consumed_at = now
                challenge.save(
                    update_fields=["consumed_at", "updated_at"]
                )

    if error is not None:
        if active_challenge is None:
            _safe_cache_delete(payload_key)
        else:
            _sync_challenge_to_cache(active_challenge)
        raise ValidationError(cast(Any, error))

    _safe_cache_delete(payload_key)
    return metadata
