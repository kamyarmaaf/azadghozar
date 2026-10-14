from django.db import migrations, models


INDEX_NAMES = (
    "listing_active_instant_idx",
    "listing_active_special_idx",
)


def _campaign_indexes() -> tuple[models.Index, models.Index]:
    return (
        models.Index(
            fields=("-created_at", "-id"),
            condition=models.Q(status="active", is_instant_sale=True),
            name="listing_active_instant_idx",
        ),
        models.Index(
            fields=("-created_at", "-id"),
            condition=models.Q(status="active", is_special_sale=True),
            name="listing_active_special_idx",
        ),
    )


def create_campaign_indexes(apps, schema_editor) -> None:
    if schema_editor.connection.vendor == "postgresql":
        statements = (
            (
                "CREATE INDEX CONCURRENTLY IF NOT EXISTS "
                "listing_active_instant_idx ON catalog_vehiclelisting "
                "(created_at DESC, id DESC) "
                "WHERE status = 'active' AND is_instant_sale"
            ),
            (
                "CREATE INDEX CONCURRENTLY IF NOT EXISTS "
                "listing_active_special_idx ON catalog_vehiclelisting "
                "(created_at DESC, id DESC) "
                "WHERE status = 'active' AND is_special_sale"
            ),
        )
        for statement in statements:
            schema_editor.execute(statement)
        return

    VehicleListing = apps.get_model("catalog", "VehicleListing")
    for index in _campaign_indexes():
        schema_editor.add_index(VehicleListing, index)


def remove_campaign_indexes(apps, schema_editor) -> None:
    if schema_editor.connection.vendor == "postgresql":
        for name in INDEX_NAMES:
            schema_editor.execute(
                f'DROP INDEX CONCURRENTLY IF EXISTS "{name}"'
            )
        return

    VehicleListing = apps.get_model("catalog", "VehicleListing")
    for index in _campaign_indexes():
        schema_editor.remove_index(VehicleListing, index)


class Migration(migrations.Migration):
    atomic = False

    dependencies = [
        ("catalog", "0007_listing_business"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunPython(
                    create_campaign_indexes,
                    remove_campaign_indexes,
                ),
            ],
            state_operations=[
                migrations.AddIndex(
                    model_name="vehiclelisting",
                    index=models.Index(
                        fields=("-created_at", "-id"),
                        condition=models.Q(
                            status="active",
                            is_instant_sale=True,
                        ),
                        name="listing_active_instant_idx",
                    ),
                ),
                migrations.AddIndex(
                    model_name="vehiclelisting",
                    index=models.Index(
                        fields=("-created_at", "-id"),
                        condition=models.Q(
                            status="active",
                            is_special_sale=True,
                        ),
                        name="listing_active_special_idx",
                    ),
                ),
            ],
        ),
    ]
