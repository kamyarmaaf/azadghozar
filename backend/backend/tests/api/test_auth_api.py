import pytest
from django.urls import reverse


@pytest.mark.api
@pytest.mark.django_db
def test_signup_request_returns_json_contract(
    api_client,
    otp_outbox,
) -> None:
    response = api_client.post(
        reverse("accounts:signup-request-otp"),
        {
            "phone_number": "09128889900",
            "role": "buyer",
        },
        format="json",
    )

    assert response.status_code == 202
    assert response["Content-Type"].startswith("application/json")
    assert set(response.data) == {
        "detail",
        "phone_number",
        "expires_in",
        "resend_in",
    }


@pytest.mark.api
@pytest.mark.django_db
def test_invalid_role_returns_400(api_client) -> None:
    response = api_client.post(
        reverse("accounts:signup-request-otp"),
        {
            "phone_number": "09128889901",
            "role": "admin",
        },
        format="json",
    )

    assert response.status_code == 400
    assert "role" in response.data


@pytest.mark.api
@pytest.mark.django_db
def test_post_only_endpoint_rejects_get(api_client) -> None:
    response = api_client.get(
        reverse("accounts:signup-request-otp")
    )

    assert response.status_code == 405


@pytest.mark.api
@pytest.mark.django_db
def test_me_requires_access_token(api_client) -> None:
    response = api_client.get(reverse("accounts:me"))

    assert response.status_code == 401


@pytest.mark.api
@pytest.mark.django_db
def test_invalid_refresh_token_is_rejected(api_client) -> None:
    response = api_client.post(
        reverse("accounts:token-refresh"),
        {"refresh": "invalid-token"},
        format="json",
    )

    assert response.status_code == 401
