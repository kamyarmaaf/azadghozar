from django.db import migrations, models


ROLE_CHOICES = [
    ("buyer", "خریدار"),
    ("seller", "فروشنده شخصی"),
    ("gallery", "نمایشگاه‌دار"),
    ("agency", "نمایندگی"),
    ("expert", "کارشناس خودرو"),
    ("admin", "مدیر سامانه"),
    ("org", "مدیریت سازمان منطقه آزاد"),
    ("free_zone_supervisor", "پنل نظارت منطقه آزاد"),
    ("smart_id_operator", "اپراتور شناسنامه هوشمند"),
]


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0009_user_role_active_index"),
    ]

    operations = [
        migrations.AlterField(
            model_name="user",
            name="role",
            field=models.CharField(
                blank=True,
                choices=ROLE_CHOICES,
                max_length=32,
                null=True,
                verbose_name="نقش",
            ),
        ),
        migrations.AlterField(
            model_name="rolechangerequest",
            name="from_role",
            field=models.CharField(
                choices=ROLE_CHOICES,
                max_length=32,
                verbose_name="نقش فعلی",
            ),
        ),
        migrations.AlterField(
            model_name="rolechangerequest",
            name="to_role",
            field=models.CharField(
                choices=ROLE_CHOICES,
                max_length=32,
                verbose_name="نقش درخواستی",
            ),
        ),
    ]
