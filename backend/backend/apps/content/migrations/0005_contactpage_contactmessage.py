import uuid

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("content", "0004_aboutpage_aboutstatistic_teammember_abouttrustitem")]

    operations = [
        migrations.CreateModel(
            name="ContactPage",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("site_key", models.CharField(default="main", editable=False, max_length=32, unique=True)),
                ("title", models.CharField(default="تماس با ما", max_length=180, verbose_name="عنوان صفحه")),
                ("subtitle", models.CharField(blank=True, max_length=300, verbose_name="توضیح کوتاه")),
                ("form_title", models.CharField(default="ارسال پیام", max_length=120, verbose_name="عنوان فرم")),
                ("information_title", models.CharField(default="اطلاعات تماس", max_length=120, verbose_name="عنوان اطلاعات تماس")),
                ("address", models.TextField(blank=True, verbose_name="آدرس")),
                ("phone", models.CharField(blank=True, max_length=30, verbose_name="تلفن")),
                ("email", models.EmailField(blank=True, max_length=254, verbose_name="ایمیل")),
                ("working_hours", models.TextField(blank=True, verbose_name="ساعات کاری")),
                ("social_title", models.CharField(default="شبکه‌های اجتماعی", max_length=120, verbose_name="عنوان شبکه‌های اجتماعی")),
                ("instagram_url", models.URLField(blank=True, verbose_name="لینک اینستاگرام")),
                ("whatsapp_url", models.URLField(blank=True, verbose_name="لینک واتساپ")),
                ("map_embed_url", models.URLField(blank=True, help_text="لینک امن HTTPS برای نمایش نقشه؛ در صورت خالی بودن، آدرس متنی نمایش داده می‌شود.", max_length=600, verbose_name="لینک Embed نقشه")),
                ("map_link", models.URLField(blank=True, max_length=600, verbose_name="لینک بازکردن نقشه")),
                ("meta_title", models.CharField(blank=True, max_length=250, verbose_name="عنوان SEO")),
                ("meta_description", models.CharField(blank=True, max_length=320, verbose_name="توضیحات SEO")),
                ("is_published", models.BooleanField(default=False, verbose_name="منتشر شده")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={"verbose_name": "تنظیمات تماس با ما", "verbose_name_plural": "تنظیمات تماس با ما"},
        ),
        migrations.CreateModel(
            name="ContactMessage",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("public_id", models.UUIDField(default=uuid.uuid4, editable=False, unique=True, verbose_name="شناسه پیگیری")),
                ("name", models.CharField(max_length=120, verbose_name="نام و نام خانوادگی")),
                ("email", models.EmailField(max_length=254, verbose_name="ایمیل")),
                ("phone", models.CharField(blank=True, max_length=16, verbose_name="شماره تماس")),
                ("subject", models.CharField(choices=[("services", "سؤال درباره خدمات"), ("technical", "پشتیبانی فنی"), ("cooperation", "پیشنهاد همکاری"), ("feedback", "شکایات و پیشنهادات"), ("other", "سایر")], max_length=24, verbose_name="موضوع")),
                ("message", models.TextField(max_length=4000, verbose_name="متن پیام")),
                ("status", models.CharField(choices=[("new", "جدید"), ("in_review", "در حال بررسی"), ("replied", "پاسخ داده شده"), ("closed", "بسته شده")], db_index=True, default="new", max_length=20, verbose_name="وضعیت رسیدگی")),
                ("admin_note", models.TextField(blank=True, verbose_name="یادداشت داخلی ادمین")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={"verbose_name": "پیام تماس", "verbose_name_plural": "پیام‌های تماس", "ordering": ("-created_at", "-id")},
        ),
        migrations.AddIndex(
            model_name="contactmessage",
            index=models.Index(fields=["status", "-created_at"], name="content_contact_status_idx"),
        ),
        migrations.AddIndex(
            model_name="contactmessage",
            index=models.Index(fields=["email"], name="content_contact_email_idx"),
        ),
    ]
