from django.db import migrations, models


def seed_body_types(apps, schema_editor):
    BodyType = apps.get_model("catalog", "BodyType")
    names = (
        "سدان", "هاچ‌بک", "شاسی‌بلند", "کراس‌اوور", "کوپه",
        "کابریوله", "پیکاپ", "وانت", "اسپرت", "کلاسیک",
    )
    for order, name in enumerate(names):
        BodyType.objects.get_or_create(name=name, defaults={"sort_order": order})


class Migration(migrations.Migration):
    dependencies = [("catalog", "0012_brand_banner")]

    operations = [
        migrations.CreateModel(
            name="BodyType",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("name", models.CharField(max_length=40, unique=True)),
                ("is_active", models.BooleanField(default=True)),
                ("sort_order", models.PositiveIntegerField(default=0)),
            ],
            options={"ordering": ("sort_order", "id")},
        ),
        migrations.RunPython(seed_body_types, migrations.RunPython.noop),
    ]
