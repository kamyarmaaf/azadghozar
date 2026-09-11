import pytest
from django.urls import reverse

from apps.accounts.models import User


@pytest.mark.component
@pytest.mark.django_db
def test_signup_component_creates_verified_user_and_tokens(
    api_client,
    otp_outbox,
) -> None:
    request_response = api_client.post(
        reverse("accounts:signup-request-otp"),
        {
            "phone_number": "09120000001",
            "role": "buyer",
        },
        format="json",
    )

    assert request_response.status_code == 202

    verify_response = api_client.post(
        reverse("accounts:signup-verify-otp"),
        {
            "phone_number": "09120000001",
            "otp": otp_outbox.latest_code("signup"),
        },
        format="json",
    )

    assert verify_response.status_code == 201
    assert set(verify_response.data) == {"access", "refresh", "user"}
    assert verify_response.data["user"]["role"] == "buyer"

    user = User.objects.get(phone_number="+989120000001")
    assert user.is_phone_verified is True
    assert user.has_usable_password() is False


@pytest.mark.component
@pytest.mark.django_db
def test_login_component_returns_tokens(
    api_client,
    otp_outbox,
    buyer_user,
) -> None:
    request_response = api_client.post(
        reverse("accounts:login-request-otp"),
        {"phone_number": buyer_user.phone_number},
        format="json",
    )

    assert request_response.status_code == 202

    verify_response = api_client.post(
        reverse("accounts:login-verify-otp"),
        {
            "phone_number": buyer_user.phone_number,
            "otp": otp_outbox.latest_code("login"),
        },
        format="json",
    )

    assert verify_response.status_code == 200
    assert verify_response.data["user"]["id"] == buyer_user.id
    assert verify_response.data["access"]
    assert verify_response.data["refresh"]
