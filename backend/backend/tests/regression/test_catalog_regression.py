import pytest
from django.urls import reverse

from apps.catalog.models import Brand, VehicleModel, VehicleTrim


@pytest.mark.regression
@pytest.mark.django_db
def test_inactive_parent_hides_active_children_from_public(api_client) -> None:
    brand = Brand.objects.create(
        name="BMW",
        slug="bmw",
        is_active=False,
    )
    vehicle_model = VehicleModel.objects.create(
        brand=brand,
        name="X4",
        slug="bmw-x4",
        is_active=True,
    )
    VehicleTrim.objects.create(
        vehicle_model=vehicle_model,
        name="xDrive30i",
        slug="bmw-x4-xdrive30i",
        is_active=True,
    )

    models_response = api_client.get(
        reverse("catalog:vehicle-model-list")
    )
    trims_response = api_client.get(
        reverse("catalog:vehicle-trim-list")
    )

    assert models_response.data["count"] == 0
    assert trims_response.data["count"] == 0


@pytest.mark.regression
@pytest.mark.django_db
def test_catalog_routes_do_not_break_auth_routes(api_client) -> None:
    health_response = api_client.get("/api/health/")
    me_response = api_client.get(reverse("accounts:me"))

    assert health_response.status_code == 200
    assert me_response.status_code == 401
