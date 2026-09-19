from django.db import migrations
from django.utils.text import slugify


def populate_brands_from_listings(apps, schema_editor) -> None:
    Brand = apps.get_model("catalog", "Brand")
    VehicleListing = apps.get_model("catalog", "VehicleListing")
    known_names = {
        name.casefold()
        for name in Brand.objects.values_list("name", flat=True)
    }
    used_slugs = set(Brand.objects.values_list("slug", flat=True))
    listing_names = (
        VehicleListing.objects.exclude(brand_name="")
        .order_by("brand_name")
        .values_list("brand_name", flat=True)
        .distinct()
    )
    for raw_name in listing_names.iterator(chunk_size=500):
        name = raw_name.strip()
        if not name or name.casefold() in known_names:
            continue
        base_slug = slugify(name, allow_unicode=True)[:100] or "brand"
        slug = base_slug
        suffix = 2
        while slug in used_slugs:
            slug = f"{base_slug[:110 - len(str(suffix))]}-{suffix}"
            suffix += 1
        Brand.objects.create(
            name=name,
            name_fa=(
                name
                if any("\u0600" <= char <= "\u06ff" for char in name)
                else ""
            ),
            slug=slug,
        )
        known_names.add(name.casefold())
        used_slugs.add(slug)


class Migration(migrations.Migration):
    dependencies = [("catalog", "0008_listing_campaign_indexes")]

    operations = [
        migrations.RunPython(
            populate_brands_from_listings,
            migrations.RunPython.noop,
        ),
    ]
