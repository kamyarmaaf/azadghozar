import pytest
from django.urls import reverse


@pytest.mark.e2e
@pytest.mark.django_db
def test_staff_can_build_catalog_hierarchy_and_public_can_read_it(
    api_client,
    staff_user,
) -> None:
    api_client.force_authenticate(user=staff_user)

    brand_response = api_client.post(
        reverse("catalog:brand-list"),
        {
            "name": "BMW",
            "name_fa": "بی ام و",
            "slug": "bmw",
            "country": "Germany",
        },
        format="json",
    )
    assert brand_response.status_code == 201

    model_response = api_client.post(
        reverse("catalog:vehicle-model-list"),
        {
            "brand": brand_response.data["id"],
            "name": "X4",
            "slug": "bmw-x4",
            "body_type": "crossover",
        },
        format="json",
    )
    assert model_response.status_code == 201

    trim_response = api_client.post(
        reverse("catalog:vehicle-trim-list"),
        {
            "vehicle_model": model_response.data["id"],
            "name": "xDrive30i M Sport",
            "slug": "bmw-x4-xdrive30i-m-sport",
            "production_start_year": 2024,
            "engine_displacement_cc": 1998,
            "power_hp": 255,
            "torque_nm": 400,
            "transmission": "automatic",
            "fuel_type": "gasoline",
            "drivetrain": "awd",
        },
        format="json",
    )
    assert trim_response.status_code == 201

    api_client.force_authenticate(user=None)
    public_response = api_client.get(
        reverse("catalog:vehicle-trim-list"),
        {"model": "bmw-x4"},
    )

    assert public_response.status_code == 200
    assert public_response.data["count"] == 1
    item = public_response.data["results"][0]
    assert item["brand_slug"] == "bmw"
    assert item["model_slug"] == "bmw-x4"
    assert item["power_hp"] == 255

    api_client.force_authenticate(user=staff_user)
    detail_url = reverse(
        "catalog:vehicle-trim-detail",
        kwargs={"slug": "bmw-x4-xdrive30i-m-sport"},
    )
    update_response = api_client.patch(
        detail_url,
        {"power_hp": 260},
        format="json",
    )
    assert update_response.status_code == 200
    assert update_response.data["power_hp"] == 260

    delete_response = api_client.delete(detail_url)
    assert delete_response.status_code == 204
