import django.db.models.deletion
from django.db import migrations, models
from django.db.models import OuterRef, Subquery


def link_existing_business_listings(apps, schema_editor) -> None:
    BusinessProfile = apps.get_model("businesses", "BusinessProfile")
    VehicleListing = apps.get_model("catalog", "VehicleListing")
    if schema_editor.connection.vendor == "postgresql":
        with schema_editor.connection.cursor() as cursor:
            while True:
                cursor.execute(
                    """
                    WITH batch AS (
                        SELECT listing.id, profile.id AS business_id
                        FROM catalog_vehiclelisting AS listing
                        INNER JOIN businesses_businessprofile AS profile
                            ON profile.owner_id = listing.owner_id
                        WHERE listing.business_id IS NULL
                        ORDER BY listing.id
                        LIMIT 20000
                    )
                    UPDATE catalog_vehiclelisting AS listing
                    SET business_id = batch.business_id
                    FROM batch
                    WHERE listing.id = batch.id
                    """
                )
                if cursor.rowcount < 20000:
                    return

    business_id = BusinessProfile.objects.filter(
        owner_id=OuterRef("owner_id")
    ).values("id")[:1]
    business_owners = BusinessProfile.objects.values("owner_id")
    VehicleListing.objects.filter(
        business_id__isnull=True,
        owner_id__in=business_owners,
    ).update(business_id=Subquery(business_id))


def create_business_feed_index(apps, schema_editor) -> None:
    if schema_editor.connection.vendor == "postgresql":
        schema_editor.execute(
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS "
            "listing_business_feed_idx ON catalog_vehiclelisting "
            "(business_id, status, created_at DESC, id DESC)"
        )
        return
    VehicleListing = apps.get_model("catalog", "VehicleListing")
    schema_editor.add_index(
        VehicleListing,
        models.Index(
            fields=("business", "status", "-created_at", "-id"),
            name="listing_business_feed_idx",
        ),
    )


def remove_business_feed_index(apps, schema_editor) -> None:
    if schema_editor.connection.vendor == "postgresql":
        schema_editor.execute(
            "DROP INDEX CONCURRENTLY IF EXISTS listing_business_feed_idx"
        )
        return
    VehicleListing = apps.get_model("catalog", "VehicleListing")
    schema_editor.remove_index(
        VehicleListing,
        models.Index(
            fields=("business", "status", "-created_at", "-id"),
            name="listing_business_feed_idx",
        ),
    )


class Migration(migrations.Migration):
    atomic = False

    dependencies = [
        ("businesses", "0001_initial"),
        ("catalog", "0006_listing_scale_indexes"),
    ]

    operations = [
        migrations.AddField(
            model_name="vehiclelisting",
            name="business",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="listings",
                to="businesses.businessprofile",
            ),
        ),
        migrations.RunPython(link_existing_business_listings, migrations.RunPython.noop),
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunPython(
                    create_business_feed_index,
                    remove_business_feed_index,
                ),
            ],
            state_operations=[
                migrations.AddIndex(
                    model_name="vehiclelisting",
                    index=models.Index(
                        fields=["business", "status", "-created_at", "-id"],
                        name="listing_business_feed_idx",
                    ),
                ),
            ],
        ),
    ]
