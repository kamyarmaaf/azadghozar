from django.contrib.postgres.indexes import GinIndex
from django.db import migrations, models


INDEX_NAMES = (
    "listing_active_feed_idx",
    "listing_active_price_idx",
    "listing_active_mileage_idx",
    "listing_active_year_idx",
    "listing_active_brand_idx",
    "listing_brand_trgm_idx",
    "listing_model_trgm_idx",
    "listing_trim_trgm_idx",
    "listing_city_trgm_idx",
)


def create_scale_indexes(apps, schema_editor) -> None:
    if schema_editor.connection.vendor != "postgresql":
        VehicleListing = apps.get_model("catalog", "VehicleListing")
        indexes = (
            models.Index(
                fields=("-created_at", "-id"),
                condition=models.Q(status="active"),
                name="listing_active_feed_idx",
            ),
            models.Index(
                fields=("price", "-created_at"),
                condition=models.Q(status="active"),
                name="listing_active_price_idx",
            ),
            models.Index(
                fields=("mileage", "-created_at"),
                condition=models.Q(status="active"),
                name="listing_active_mileage_idx",
            ),
            models.Index(
                fields=("production_year", "-created_at"),
                condition=models.Q(status="active"),
                name="listing_active_year_idx",
            ),
            models.Index(
                fields=("brand_name", "-created_at"),
                condition=models.Q(status="active"),
                name="listing_active_brand_idx",
            ),
        )
        for index in indexes:
            schema_editor.add_index(VehicleListing, index)
        return

    statements = (
        "CREATE EXTENSION IF NOT EXISTS pg_trgm",
        (
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS listing_active_feed_idx "
            "ON catalog_vehiclelisting (created_at DESC, id DESC) "
            "WHERE status = 'active'"
        ),
        (
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS listing_active_price_idx "
            "ON catalog_vehiclelisting (price, created_at DESC) "
            "WHERE status = 'active'"
        ),
        (
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS listing_active_mileage_idx "
            "ON catalog_vehiclelisting (mileage, created_at DESC) "
            "WHERE status = 'active'"
        ),
        (
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS listing_active_year_idx "
            "ON catalog_vehiclelisting (production_year, created_at DESC) "
            "WHERE status = 'active'"
        ),
        (
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS listing_active_brand_idx "
            "ON catalog_vehiclelisting (brand_name, created_at DESC) "
            "WHERE status = 'active'"
        ),
        (
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS listing_brand_trgm_idx "
            "ON catalog_vehiclelisting USING gin (brand_name gin_trgm_ops)"
        ),
        (
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS listing_model_trgm_idx "
            "ON catalog_vehiclelisting USING gin (model_name gin_trgm_ops)"
        ),
        (
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS listing_trim_trgm_idx "
            "ON catalog_vehiclelisting USING gin (trim_name gin_trgm_ops)"
        ),
        (
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS listing_city_trgm_idx "
            "ON catalog_vehiclelisting USING gin (city gin_trgm_ops)"
        ),
    )
    for statement in statements:
        schema_editor.execute(statement)


def remove_scale_indexes(apps, schema_editor) -> None:
    if schema_editor.connection.vendor != "postgresql":
        VehicleListing = apps.get_model("catalog", "VehicleListing")
        indexes = (
            models.Index(
                fields=("-created_at", "-id"),
                condition=models.Q(status="active"),
                name="listing_active_feed_idx",
            ),
            models.Index(
                fields=("price", "-created_at"),
                condition=models.Q(status="active"),
                name="listing_active_price_idx",
            ),
            models.Index(
                fields=("mileage", "-created_at"),
                condition=models.Q(status="active"),
                name="listing_active_mileage_idx",
            ),
            models.Index(
                fields=("production_year", "-created_at"),
                condition=models.Q(status="active"),
                name="listing_active_year_idx",
            ),
            models.Index(
                fields=("brand_name", "-created_at"),
                condition=models.Q(status="active"),
                name="listing_active_brand_idx",
            ),
        )
        for index in indexes:
            schema_editor.remove_index(VehicleListing, index)
        return

    for name in INDEX_NAMES:
        schema_editor.execute(f'DROP INDEX CONCURRENTLY IF EXISTS "{name}"')


class Migration(migrations.Migration):
    atomic = False

    dependencies = [
        ("catalog", "0005_listingfavorite"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunPython(
                    create_scale_indexes,
                    remove_scale_indexes,
                ),
            ],
            state_operations=[
                migrations.AddIndex(
                    model_name="vehiclelisting",
                    index=models.Index(
                        fields=("-created_at", "-id"),
                        condition=models.Q(status="active"),
                        name="listing_active_feed_idx",
                    ),
                ),
                migrations.AddIndex(
                    model_name="vehiclelisting",
                    index=models.Index(
                        fields=("price", "-created_at"),
                        condition=models.Q(status="active"),
                        name="listing_active_price_idx",
                    ),
                ),
                migrations.AddIndex(
                    model_name="vehiclelisting",
                    index=models.Index(
                        fields=("mileage", "-created_at"),
                        condition=models.Q(status="active"),
                        name="listing_active_mileage_idx",
                    ),
                ),
                migrations.AddIndex(
                    model_name="vehiclelisting",
                    index=models.Index(
                        fields=("production_year", "-created_at"),
                        condition=models.Q(status="active"),
                        name="listing_active_year_idx",
                    ),
                ),
                migrations.AddIndex(
                    model_name="vehiclelisting",
                    index=models.Index(
                        fields=("brand_name", "-created_at"),
                        condition=models.Q(status="active"),
                        name="listing_active_brand_idx",
                    ),
                ),
                migrations.AddIndex(
                    model_name="vehiclelisting",
                    index=GinIndex(
                        fields=("brand_name",),
                        name="listing_brand_trgm_idx",
                        opclasses=("gin_trgm_ops",),
                    ),
                ),
                migrations.AddIndex(
                    model_name="vehiclelisting",
                    index=GinIndex(
                        fields=("model_name",),
                        name="listing_model_trgm_idx",
                        opclasses=("gin_trgm_ops",),
                    ),
                ),
                migrations.AddIndex(
                    model_name="vehiclelisting",
                    index=GinIndex(
                        fields=("trim_name",),
                        name="listing_trim_trgm_idx",
                        opclasses=("gin_trgm_ops",),
                    ),
                ),
                migrations.AddIndex(
                    model_name="vehiclelisting",
                    index=GinIndex(
                        fields=("city",),
                        name="listing_city_trgm_idx",
                        opclasses=("gin_trgm_ops",),
                    ),
                ),
            ],
        ),
    ]
