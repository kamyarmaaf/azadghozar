import pytest

from apps.catalog.models import Brand, VehicleListing, VehicleModel, VehicleTrim


@pytest.mark.unit
def test_catalog_string_representations_are_human_readable() -> None:
    brand = Brand(name="BMW", name_fa="بی ام و", slug="bmw")
    vehicle_model = VehicleModel(
        brand=brand,
        name="X4",
        slug="bmw-x4",
    )
    trim = VehicleTrim(
        vehicle_model=vehicle_model,
        name="xDrive30i",
        slug="bmw-x4-xdrive30i",
    )

    assert str(brand) == "بی ام و"
    assert str(vehicle_model) == "BMW X4"
    assert str(trim) == "BMW X4 xDrive30i"


@pytest.mark.unit
def test_catalog_choice_values_are_stable() -> None:
    assert VehicleModel.BodyType.SUV == "suv"
    assert VehicleTrim.Transmission.AUTOMATIC == "automatic"
    assert VehicleTrim.FuelType.ELECTRIC == "electric"
    assert VehicleTrim.Drivetrain.AWD == "awd"


@pytest.mark.unit
def test_listing_scale_indexes_are_declared() -> None:
    index_names = {index.name for index in VehicleListing._meta.indexes}

    assert {
        "listing_active_feed_idx",
        "listing_active_price_idx",
        "listing_active_mileage_idx",
        "listing_active_year_idx",
        "listing_active_brand_idx",
        "listing_brand_trgm_idx",
        "listing_model_trgm_idx",
        "listing_trim_trgm_idx",
        "listing_city_trgm_idx",
    }.issubset(index_names)
