import pytest
from django.urls import reverse
from rest_framework.exceptions import ValidationError

from apps.accounts.models import User
from apps.accounts.services.otp import (
    SIGNUP_PURPOSE,
    request_otp,
    verify_otp,
)


@pytest.mark.regression
@pytest.mark.django_db
def test_role_is_taken_from_original_otp_request_not_verify_body(
    api_client,
    otp_outbox,
) -> None:
    api_client.post(
        reverse("accounts:signup-request-otp"),
        {
            "phone_number": "09125556677",
            "role": "buyer",
        },
        format="json",
    )

    response = api_client.post(
        reverse("accounts:signup-verify-otp"),
        {
            "phone_number": "09125556677",
            "otp": otp_outbox.latest_code("signup"),
            "role": "seller",
        },
        format="json",
    )

    assert response.status_code == 201
    assert response.data["user"]["role"] == "buyer"


@pytest.mark.regression
@pytest.mark.django_db
def test_existing_phone_cannot_register_again(
    api_client,
    buyer_user,
) -> None:
    response = api_client.post(
        reverse("accounts:signup-request-otp"),
        {
            "phone_number": buyer_user.phone_number,
            "role": "seller",
        },
        format="json",
    )

    assert response.status_code == 400
    assert "phone_number" in response.data


@pytest.mark.regression
@pytest.mark.django_db
def test_resend_cooldown_is_enforced(
    otp_outbox,
) -> None:
    phone = "+989126667777"

    request_otp(
        phone_number=phone,
        purpose=SIGNUP_PURPOSE,
    )

    with pytest.raises(ValidationError) as error:
        request_otp(
            phone_number=phone,
            purpose=SIGNUP_PURPOSE,
        )

    assert "retry_after" in error.value.detail


@pytest.mark.regression
@pytest.mark.django_db
def test_wrong_code_does_not_consume_correct_code_immediately(
    otp_outbox,
) -> None:
    phone = "+989127778888"

    request_otp(
        phone_number=phone,
        purpose=SIGNUP_PURPOSE,
    )
    correct_code = otp_outbox.latest_code("signup")

    with pytest.raises(ValidationError):
        verify_otp(
            phone_number=phone,
            purpose=SIGNUP_PURPOSE,
            code="000000" if correct_code != "000000" else "999999",
        )

    verify_otp(
        phone_number=phone,
        purpose=SIGNUP_PURPOSE,
        code=correct_code,
    )
