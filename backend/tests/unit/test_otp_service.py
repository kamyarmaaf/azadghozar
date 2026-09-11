import pytest
from django.core.cache import cache
from rest_framework.exceptions import ValidationError

from apps.accounts.models import OtpChallenge
from apps.accounts.services import otp as otp_service
from apps.accounts.services.otp import (
    SIGNUP_PURPOSE,
    normalize_phone_number,
    request_otp,
    verify_otp,
)


@pytest.mark.unit
@pytest.mark.parametrize(
    ("raw_phone", "expected"),
    [
        ("09121234567", "+989121234567"),
        ("989121234567", "+989121234567"),
        ("+989121234567", "+989121234567"),
        ("00989121234567", "+989121234567"),
        ("۰۹۱۲۱۲۳۴۵۶۷", "+989121234567"),
        ("٠٩١٢١٢٣٤٥٦٧", "+989121234567"),
    ],
)
def test_normalize_phone_number_accepts_supported_formats(
    raw_phone: str,
    expected: str,
) -> None:
    assert normalize_phone_number(raw_phone) == expected


@pytest.mark.unit
@pytest.mark.parametrize(
    "raw_phone",
    [
        "",
        "02112345678",
        "0912123456",
        "091212345678",
        "not-a-phone",
    ],
)
def test_normalize_phone_number_rejects_invalid_values(
    raw_phone: str,
) -> None:
    with pytest.raises(ValidationError):
        normalize_phone_number(raw_phone)


@pytest.mark.unit
@pytest.mark.django_db
def test_request_and_verify_otp_returns_metadata(
    otp_outbox,
) -> None:
    phone_number = "+989121234567"

    result = request_otp(
        phone_number=phone_number,
        purpose=SIGNUP_PURPOSE,
        metadata={"role": "buyer"},
    )

    assert result["expires_in"] > 0
    assert result["resend_in"] >= 0
    assert otp_outbox.latest("signup")["phone_number"] == phone_number

    metadata = verify_otp(
        phone_number=phone_number,
        purpose=SIGNUP_PURPOSE,
        code=otp_outbox.latest_code("signup"),
    )

    assert metadata == {"role": "buyer"}


@pytest.mark.unit
@pytest.mark.django_db
def test_otp_is_single_use(otp_outbox) -> None:
    phone_number = "+989121234567"

    request_otp(
        phone_number=phone_number,
        purpose=SIGNUP_PURPOSE,
    )
    code = otp_outbox.latest_code("signup")

    verify_otp(
        phone_number=phone_number,
        purpose=SIGNUP_PURPOSE,
        code=code,
    )

    with pytest.raises(ValidationError):
        verify_otp(
            phone_number=phone_number,
            purpose=SIGNUP_PURPOSE,
            code=code,
        )


@pytest.mark.unit
@pytest.mark.django_db
def test_request_otp_can_skip_sms_dispatch(otp_outbox) -> None:
    result = request_otp(
        phone_number="+989121234568",
        purpose=SIGNUP_PURPOSE,
        dispatch_sms=False,
    )

    assert result["expires_in"] > 0
    assert otp_outbox.messages == []


@pytest.mark.unit
@pytest.mark.django_db
def test_postgresql_fallback_works_when_redis_is_unavailable(
    monkeypatch,
    otp_outbox,
) -> None:
    def fail_cache(*args, **kwargs):
        del args, kwargs
        raise ConnectionError("Redis is unavailable")

    monkeypatch.setattr(cache, "get", fail_cache)
    monkeypatch.setattr(cache, "set", fail_cache)
    monkeypatch.setattr(cache, "delete", fail_cache)
    phone_number = "+989121234569"

    request_otp(
        phone_number=phone_number,
        purpose=SIGNUP_PURPOSE,
        metadata={"role": "buyer"},
    )
    metadata = verify_otp(
        phone_number=phone_number,
        purpose=SIGNUP_PURPOSE,
        code=otp_outbox.latest_code("signup"),
    )

    challenge = OtpChallenge.objects.get(
        phone_number=phone_number,
        purpose=SIGNUP_PURPOSE,
    )
    assert metadata == {"role": "buyer"}
    assert challenge.consumed_at is not None


@pytest.mark.unit
@pytest.mark.django_db
def test_direct_delivery_is_used_when_celery_worker_is_down(
    monkeypatch,
    settings,
) -> None:
    delivered: list[dict[str, str]] = []

    def fail_cache(*args, **kwargs):
        del args, kwargs
        raise ConnectionError("Redis is unavailable")

    def fake_direct_delivery(**kwargs: str) -> None:
        delivered.append(kwargs)

    settings.CELERY_TASK_ALWAYS_EAGER = False
    monkeypatch.setattr(cache, "get", fail_cache)
    monkeypatch.setattr(cache, "set", fail_cache)
    monkeypatch.setattr(cache, "delete", fail_cache)
    monkeypatch.setattr(
        otp_service,
        "_celery_worker_is_available",
        lambda: False,
    )
    monkeypatch.setattr(
        "apps.accounts.tasks.send_otp_sms_now",
        fake_direct_delivery,
    )

    result = request_otp(
        phone_number="+989121234570",
        purpose=SIGNUP_PURPOSE,
    )

    assert result["expires_in"] > 0
    assert delivered[0]["purpose"] == SIGNUP_PURPOSE
    assert len(delivered[0]["code"]) == 6
    assert verify_otp(
        phone_number="+989121234570",
        purpose=SIGNUP_PURPOSE,
        code=delivered[0]["code"],
    ) == {}
