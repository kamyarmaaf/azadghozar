from django.db import migrations, models

import apps.accounts.models


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0007_user_contact_and_business_profile"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="business_cover",
            field=models.ImageField(
                blank=True,
                upload_to=apps.accounts.models.business_cover_upload_to,
                verbose_name="تصویر کاور کسب‌وکار",
            ),
        ),
        migrations.AddField(
            model_name="user",
            name="business_logo",
            field=models.ImageField(
                blank=True,
                upload_to=apps.accounts.models.business_logo_upload_to,
                verbose_name="لوگوی کسب‌وکار",
            ),
        ),
    ]
