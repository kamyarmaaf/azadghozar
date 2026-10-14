import pytest
from django.urls import reverse


@pytest.mark.e2e
@pytest.mark.django_db
def test_complete_signup_me_refresh_and_login_journey(
    api_client,
    otp_outbox,
) -> None:
    phone = "09124445566"

    signup_request = api_client.post(
        reverse("accounts:signup-request-otp"),
        {
            "phone_number": phone,
            "role": "seller",
        },
        format="json",
    )
    assert signup_request.status_code == 202

    signup_verify = api_client.post(
        reverse("accounts:signup-verify-otp"),
        {
            "phone_number": phone,
            "otp": otp_outbox.latest_code("signup"),
        },
        format="json",
    )
    assert signup_verify.status_code == 201
    assert signup_verify.data["user"]["role"] == "seller"

    access_token = signup_verify.data["access"]
    refresh_token = signup_verify.data["refresh"]

    api_client.credentials(
        HTTP_AUTHORIZATION=f"Bearer {access_token}"
    )
    me_response = api_client.get(reverse("accounts:me"))
    assert me_response.status_code == 200
    assert me_response.data["phone_number"] == "+989124445566"

    api_client.credentials()
    refresh_response = api_client.post(
        reverse("accounts:token-refresh"),
        {"refresh": refresh_token},
        format="json",
    )
    assert refresh_response.status_code == 200
    assert refresh_response.data["access"]

    login_request = api_client.post(
        reverse("accounts:login-request-otp"),
        {"phone_number": phone},
        format="json",
    )
    assert login_request.status_code == 202

    login_verify = api_client.post(
        reverse("accounts:login-verify-otp"),
        {
            "phone_number": phone,
            "otp": otp_outbox.latest_code("login"),
        },
        format="json",
    )
    assert login_verify.status_code == 200
    assert login_verify.data["user"]["role"] == "seller"
