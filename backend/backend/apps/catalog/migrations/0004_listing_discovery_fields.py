from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("catalog", "0003_vehicle_listing"),
    ]

    operations = [
        migrations.AddField(
            model_name="vehiclelisting",
            name="is_inspected",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="vehiclelisting",
            name="is_instant_sale",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="vehiclelisting",
            name="is_special_sale",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="vehiclelisting",
            name="view_count",
            field=models.PositiveIntegerField(default=0),
        ),
    ]
