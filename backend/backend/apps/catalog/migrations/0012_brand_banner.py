from django.db import migrations, models

import apps.catalog.models


class Migration(migrations.Migration):
    dependencies = [
        ("catalog", "0011_brand_logo_upload"),
    ]

    operations = [
        migrations.AddField(
            model_name="brand",
            name="banner",
            field=models.ImageField(
                blank=True,
                help_text="تصویر افقی پیشنهادی: 1600 در 500 پیکسل",
                upload_to=apps.catalog.models.brand_banner_upload_to,
                verbose_name="بنر برند",
            ),
        ),
    ]
