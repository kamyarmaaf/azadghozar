import pytest
from django.urls import resolve, reverse


@pytest.mark.smoke
def test_catalog_urls_are_registered() -> None:
    for route_name in (
        "catalog:brand-list",
        "catalog:vehicle-model-list",
        "catalog:vehicle-trim-list",
    ):
        url = reverse(route_name)
        assert resolve(url)


@pytest.mark.smoke
@pytest.mark.django_db
def test_catalog_public_endpoint_is_available(api_client) -> None:
    response = api_client.get(reverse("catalog:brand-list"))

    assert response.status_code == 200
    assert response.data["count"] == 0
