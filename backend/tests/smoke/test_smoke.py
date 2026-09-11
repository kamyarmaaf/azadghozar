import pytest
from django.core.management import call_command
from django.urls import resolve, reverse


@pytest.mark.smoke
def test_django_system_check_passes() -> None:
    call_command("check")


@pytest.mark.smoke
@pytest.mark.django_db
def test_health_endpoint_is_available(api_client) -> None:
    response = api_client.get("/api/health/")

    assert response.status_code == 200
    assert response.data["status"] == "ok"


@pytest.mark.smoke
def test_auth_urls_are_registered() -> None:
    for route_name in (
        "accounts:signup-request-otp",
        "accounts:signup-verify-otp",
        "accounts:login-request-otp",
        "accounts:login-verify-otp",
        "accounts:token-refresh",
        "accounts:me",
    ):
        url = reverse(route_name)
        assert resolve(url)
