import pytest
from django.db import IntegrityError, connection, transaction
from django.db.models.deletion import ProtectedError

from apps.catalog.models import Brand, VehicleModel, VehicleTrim


@pytest.mark.integration
@pytest.mark.django_db
def test_catalog_hierarchy_round_trip_uses_postgresql() -> None:
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
        transmission=VehicleTrim.Transmission.AUTOMATIC,
        fuel_type=VehicleTrim.FuelType.GASOLINE,
        drivetrain=VehicleTrim.Drivetrain.AWD,
    )

    loaded = VehicleTrim.objects.select_related(
        "vehicle_model__brand"
    ).get(pk=trim.pk)

    assert loaded.vehicle_model.brand.name == "BMW"
    assert connection.vendor == "postgresql"


@pytest.mark.integration
@pytest.mark.django_db
def test_database_protects_catalog_parent_relations() -> None:
    brand = Brand.objects.create(name="BMW", slug="bmw")
    VehicleModel.objects.create(brand=brand, name="X4", slug="bmw-x4")

    with pytest.raises(ProtectedError):
        brand.delete()


@pytest.mark.integration
@pytest.mark.django_db
def test_database_rejects_invalid_trim_year_range() -> None:
    brand = Brand.objects.create(name="BMW", slug="bmw")
    vehicle_model = VehicleModel.objects.create(
        brand=brand,
        name="X4",
        slug="bmw-x4",
    )

    with pytest.raises(IntegrityError):
        with transaction.atomic():
            VehicleTrim.objects.create(
                vehicle_model=vehicle_model,
                name="Invalid years",
                slug="bmw-x4-invalid-years",
                production_start_year=2025,
                production_end_year=2020,
            )
