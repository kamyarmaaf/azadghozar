import pytest
from django.db import IntegrityError, connection, transaction
from django.db.migrations.executor import MigrationExecutor


TARGET_MIGRATION = ("catalog", "0001_initial")


@pytest.mark.migration
@pytest.mark.django_db(transaction=True)
def test_initial_catalog_migration_builds_hierarchy_and_constraints(
    django_db_blocker,
) -> None:
    with django_db_blocker.unblock():
        executor = MigrationExecutor(connection)
        executor.migrate([("catalog", None)])

        executor = MigrationExecutor(connection)
        executor.migrate([TARGET_MIGRATION])

        apps = executor.loader.project_state([TARGET_MIGRATION]).apps
        Brand = apps.get_model("catalog", "Brand")
        VehicleModel = apps.get_model("catalog", "VehicleModel")
        VehicleTrim = apps.get_model("catalog", "VehicleTrim")

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

        assert trim.vehicle_model_id == vehicle_model.pk

        with pytest.raises(IntegrityError):
            with transaction.atomic():
                Brand.objects.create(name="bmw", slug="bmw-copy")

        executor = MigrationExecutor(connection)
        executor.migrate(executor.loader.graph.leaf_nodes())
