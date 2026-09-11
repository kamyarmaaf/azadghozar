import pytest
from django.core.cache import cache
from django.urls import reverse
from rest_framework.exceptions import ValidationError

from apps.accounts.models import OtpChallenge, User
from apps.accounts.services.otp import (
    SIGNUP_PURPOSE,
    request_otp,
    verify_otp,
)


@pytest.mark.security
@pytest.mark.django_db
def test_raw_otp_is_not_stored_in_cache(otp_outbox) -> None:
    phone = "+989129990000"

    request_otp(
        phone_number=phone,
        purpose=SIGNUP_PURPOSE,
    )
    raw_code = otp_outbox.latest_code("signup")

    payload = cache.get(
        f"otp:{SIGNUP_PURPOSE}:{phone}:payload"
    )

    assert payload is not None
    assert "code_hash" in payload
    assert raw_code not in repr(payload)
    challenge = OtpChallenge.objects.get(
        phone_number=phone,
        purpose=SIGNUP_PURPOSE,
    )
    assert challenge.code_hash != raw_code
    assert len(challenge.code_hash) == 64


@pytest.mark.security
@pytest.mark.django_db
def test_maximum_failed_attempts_invalidates_otp(
    otp_outbox,
    settings,
) -> None:
    settings.OTP_MAX_VERIFY_ATTEMPTS = 3
    phone = "+989129990001"

    request_otp(
        phone_number=phone,
        purpose=SIGNUP_PURPOSE,
    )
    correct_code = otp_outbox.latest_code("signup")
    wrong_code = "000000" if correct_code != "000000" else "999999"

    for _ in range(3):
        with pytest.raises(ValidationError):
            verify_otp(
                phone_number=phone,
                purpose=SIGNUP_PURPOSE,
                code=wrong_code,
            )

    with pytest.raises(ValidationError):
        verify_otp(
            phone_number=phone,
            purpose=SIGNUP_PURPOSE,
            code=correct_code,
        )


@pytest.mark.security
@pytest.mark.django_db
def test_inactive_user_gets_generic_login_response_without_sms(
    api_client,
    inactive_user,
    otp_outbox,
) -> None:
    response = api_client.post(
        reverse("accounts:login-request-otp"),
        {"phone_number": inactive_user.phone_number},
        format="json",
    )

    assert response.status_code == 202
    assert response.data["detail"] == "OTP has been queued."
    assert otp_outbox.messages == []


@pytest.mark.security
@pytest.mark.django_db
def test_injection_style_phone_input_is_rejected(
    api_client,
) -> None:
    response = api_client.post(
        reverse("accounts:login-request-otp"),
        {
            "phone_number": (
                "0912'; DROP TABLE accounts_user; --"
            )
        },
        format="json",
    )

    assert response.status_code == 400
    assert User.objects.count() == 0


@pytest.mark.security
@pytest.mark.django_db
def test_hourly_request_limit_is_enforced(
    otp_outbox,
    settings,
) -> None:
    settings.OTP_RESEND_COOLDOWN_SECONDS = 0
    settings.OTP_MAX_REQUESTS_PER_HOUR = 2
    phone = "+989129990002"

    request_otp(
        phone_number=phone,
        purpose=SIGNUP_PURPOSE,
    )
    request_otp(
        phone_number=phone,
        purpose=SIGNUP_PURPOSE,
    )

    with pytest.raises(ValidationError):
        request_otp(
            phone_number=phone,
            purpose=SIGNUP_PURPOSE,
        )


@pytest.mark.security
@pytest.mark.django_db
def test_login_request_does_not_enable_account_enumeration(
    api_client,
    otp_outbox,
    buyer_user,
) -> None:
    existing_response = api_client.post(
        reverse("accounts:login-request-otp"),
        {"phone_number": buyer_user.phone_number},
        format="json",
    )

    cache.clear()

    missing_response = api_client.post(
        reverse("accounts:login-request-otp"),
        {"phone_number": "09129999999"},
        format="json",
    )

    assert existing_response.status_code == missing_response.status_code == 202
    assert existing_response.data["detail"] == missing_response.data["detail"]
    assert existing_response.data["expires_in"] == missing_response.data["expires_in"]
    assert existing_response.data["resend_in"] == missing_response.data["resend_in"]
    assert len(otp_outbox.messages) == 1
