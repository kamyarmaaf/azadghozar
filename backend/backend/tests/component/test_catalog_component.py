import pytest

from apps.catalog.models import Brand, VehicleModel, VehicleTrim
from apps.catalog.serializers import (
    BrandSerializer,
    VehicleModelSerializer,
    VehicleTrimSerializer,
    ensure_catalog_brand,
)


@pytest.mark.component
@pytest.mark.django_db
def test_existing_persian_brand_name_does_not_create_duplicate() -> None:
    Brand.objects.create(name="BMW", name_fa="بی‌ام‌و", slug="bmw")
    ensure_catalog_brand("بی‌ام‌و")
    assert Brand.objects.count() == 1


@pytest.mark.component
@pytest.mark.django_db
def test_brand_serializer_rejects_case_insensitive_duplicate() -> None:
    Brand.objects.create(name="BMW", slug="bmw")

    serializer = BrandSerializer(
        data={
            "name": " bmw ",
            "slug": "bmw-duplicate",
        }
    )

    assert serializer.is_valid() is False
    assert "name" in serializer.errors


@pytest.mark.component
@pytest.mark.django_db
def test_vehicle_model_serializer_rejects_duplicate_within_brand() -> None:
    brand = Brand.objects.create(name="BMW", slug="bmw")
    VehicleModel.objects.create(
        brand=brand,
        name="X4",
        slug="bmw-x4",
    )

    serializer = VehicleModelSerializer(
        data={
            "brand": brand.pk,
            "name": "x4",
            "slug": "bmw-x4-copy",
        }
    )

    assert serializer.is_valid() is False
    assert "name" in serializer.errors


@pytest.mark.component
@pytest.mark.django_db
def test_vehicle_trim_serializer_rejects_reversed_year_range() -> None:
    brand = Brand.objects.create(name="BMW", slug="bmw")
    vehicle_model = VehicleModel.objects.create(
        brand=brand,
        name="X4",
        slug="bmw-x4",
    )

    serializer = VehicleTrimSerializer(
        data={
            "vehicle_model": vehicle_model.pk,
            "name": "xDrive30i",
            "slug": "bmw-x4-xdrive30i",
            "production_start_year": 2025,
            "production_end_year": 2020,
        }
    )

    assert serializer.is_valid() is False
    assert "production_end_year" in serializer.errors


@pytest.mark.component
@pytest.mark.django_db
def test_vehicle_trim_serializer_exposes_parent_identity() -> None:
    brand = Brand.objects.create(name="BMW", slug="bmw")
    vehicle_model = VehicleModel.objects.create(
        brand=brand,
        name="X4",
        slug="bmw-x4",
    )
    trim = VehicleTrim.objects.create(
        vehicle_model=vehicle_model,
        name="xDrive30i",
        slug="bmw-x4-xdrive30i",
    )

    data = VehicleTrimSerializer(trim).data

    assert data["brand_slug"] == "bmw"
    assert data["model_slug"] == "bmw-x4"


@pytest.mark.component
@pytest.mark.django_db
def test_vehicle_trim_serializer_rejects_duplicate_within_model() -> None:
    brand = Brand.objects.create(name="BMW", slug="bmw")
    vehicle_model = VehicleModel.objects.create(
        brand=brand,
        name="X4",
        slug="bmw-x4",
    )
    VehicleTrim.objects.create(
        vehicle_model=vehicle_model,
        name="xDrive30i",
        slug="bmw-x4-xdrive30i",
    )

    serializer = VehicleTrimSerializer(
        data={
            "vehicle_model": vehicle_model.pk,
            "name": "XDRIVE30I",
            "slug": "bmw-x4-xdrive30i-copy",
        }
    )

    assert serializer.is_valid() is False
    assert "name" in serializer.errors
