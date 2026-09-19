from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("content", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="FrequentlyAskedQuestion",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("question", models.CharField(max_length=300, verbose_name="سؤال")),
                ("answer", models.TextField(verbose_name="پاسخ")),
                ("category", models.CharField(choices=[("general", "عمومی"), ("buying", "خرید خودرو"), ("selling", "فروش خودرو"), ("free_zone", "مناطق آزاد و قوانین"), ("account", "حساب کاربری"), ("services", "خدمات")], db_index=True, default="general", max_length=24, verbose_name="دسته‌بندی")),
                ("is_published", models.BooleanField(default=False, verbose_name="منتشر شده")),
                ("sort_order", models.PositiveIntegerField(default=0, verbose_name="ترتیب نمایش")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "سؤال متداول",
                "verbose_name_plural": "سؤالات متداول",
                "ordering": ("sort_order", "id"),
            },
        ),
        migrations.AddIndex(
            model_name="frequentlyaskedquestion",
            index=models.Index(fields=["is_published", "sort_order", "id"], name="content_faq_public_idx"),
        ),
    ]
