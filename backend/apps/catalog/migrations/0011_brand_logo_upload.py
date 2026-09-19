from django.db import migrations, models

import apps.catalog.models


class Migration(migrations.Migration):
    dependencies = [
        ("catalog", "0010_seed_vehicle_brands"),
    ]

    operations = [
        migrations.AddField(
            model_name="brand",
            name="logo",
            field=models.ImageField(
                blank=True,
                upload_to=apps.catalog.models.brand_logo_upload_to,
                verbose_name="لوگوی برند",
            ),
        ),
    ]
