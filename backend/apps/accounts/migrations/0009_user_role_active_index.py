from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0008_user_business_media"),
    ]

    operations = [
        migrations.AddIndex(
            model_name="user",
            index=models.Index(
                fields=("role", "is_active", "id"),
                name="account_role_active_idx",
            ),
        ),
    ]

