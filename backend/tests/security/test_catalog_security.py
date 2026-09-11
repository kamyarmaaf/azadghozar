import pytest
from django.urls import reverse

from apps.catalog.models import Brand, VehicleModel


@pytest.mark.security
@pytest.mark.django_db
def test_anonymous_user_cannot_create_brand(api_client) -> None:
    response = api_client.post(
        reverse("catalog:brand-list"),
        {"name": "BMW", "slug": "bmw"},
        format="json",
    )

    assert response.status_code == 401
    assert Brand.objects.count() == 0


@pytest.mark.security
@pytest.mark.django_db
def test_authenticated_non_staff_user_cannot_modify_catalog(
    api_client,
    buyer_user,
) -> None:
    api_client.force_authenticate(user=buyer_user)

    response = api_client.post(
        reverse("catalog:brand-list"),
        {"name": "BMW", "slug": "bmw"},
        format="json",
    )

    assert response.status_code == 403
    assert Brand.objects.count() == 0


@pytest.mark.security
@pytest.mark.django_db
def test_staff_user_can_create_catalog_record(api_client, staff_user) -> None:
    api_client.force_authenticate(user=staff_user)

    response = api_client.post(
        reverse("catalog:brand-list"),
        {"name": "BMW", "slug": "bmw"},
        format="json",
    )

    assert response.status_code == 201
    assert Brand.objects.filter(slug="bmw").exists()


@pytest.mark.security
@pytest.mark.django_db
def test_inactive_records_are_hidden_from_public_but_visible_to_staff(
    api_client,
    staff_user,
) -> None:
    Brand.objects.create(name="Hidden", slug="hidden", is_active=False)

    public_response = api_client.get(reverse("catalog:brand-list"))
    assert public_response.data["count"] == 0

    api_client.force_authenticate(user=staff_user)
    staff_response = api_client.get(reverse("catalog:brand-list"))
    assert staff_response.data["count"] == 1


@pytest.mark.security
@pytest.mark.django_db
def test_parent_with_children_cannot_be_hard_deleted(
    api_client,
    staff_user,
) -> None:
    brand = Brand.objects.create(name="BMW", slug="bmw")
    VehicleModel.objects.create(brand=brand, name="X4", slug="bmw-x4")
    api_client.force_authenticate(user=staff_user)

    response = api_client.delete(
        reverse("catalog:brand-detail", kwargs={"slug": brand.slug})
    )

    assert response.status_code == 400
    assert Brand.objects.filter(pk=brand.pk).exists()


@pytest.mark.security
@pytest.mark.django_db
def test_read_only_fields_cannot_be_mass_assigned(api_client, staff_user) -> None:
    api_client.force_authenticate(user=staff_user)

    response = api_client.post(
        reverse("catalog:brand-list"),
        {
            "id": 999999,
            "name": "BMW",
            "slug": "bmw",
            "created_at": "2000-01-01T00:00:00Z",
        },
        format="json",
    )

    assert response.status_code == 201
    assert response.data["id"] != 999999
    assert not response.data["created_at"].startswith("2000-01-01")
