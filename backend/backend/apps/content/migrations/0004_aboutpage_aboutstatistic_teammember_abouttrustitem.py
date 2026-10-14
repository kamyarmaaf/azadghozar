import apps.content.models
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [("content", "0003_article")]

    operations = [
        migrations.CreateModel(
            name="AboutPage",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("site_key", models.CharField(default="main", editable=False, max_length=32, unique=True)),
                ("hero_title", models.CharField(default="درباره آزاد گذر", max_length=180, verbose_name="عنوان اصلی")),
                ("intro", models.TextField(verbose_name="متن معرفی")),
                ("hero_image", models.ImageField(blank=True, help_text="اختیاری؛ تصویر افقی پیشنهادی: 1920 در 800 پیکسل", upload_to=apps.content.models.about_hero_upload_to, verbose_name="تصویر بنر")),
                ("why_title", models.CharField(default="چرا آزاد گذر؟", max_length=180, verbose_name="عنوان بخش مأموریت")),
                ("mission_title", models.CharField(default="مأموریت ما", max_length=120, verbose_name="عنوان مأموریت")),
                ("mission_text", models.TextField(verbose_name="متن مأموریت")),
                ("vision_title", models.CharField(default="چشم‌انداز ما", max_length=120, verbose_name="عنوان چشم‌انداز")),
                ("vision_text", models.TextField(verbose_name="متن چشم‌انداز")),
                ("values_title", models.CharField(default="ارزش‌های ما", max_length=120, verbose_name="عنوان ارزش‌ها")),
                ("values_text", models.TextField(verbose_name="متن ارزش‌ها")),
                ("team_title", models.CharField(default="تیم ما", max_length=120, verbose_name="عنوان بخش تیم")),
                ("trust_title", models.CharField(default="مزیت‌های آزاد گذر", max_length=120, verbose_name="عنوان بخش اعتماد")),
                ("show_statistics", models.BooleanField(default=True, verbose_name="نمایش آمار")),
                ("show_team", models.BooleanField(default=True, verbose_name="نمایش اعضای تیم")),
                ("show_trust_items", models.BooleanField(default=True, verbose_name="نمایش مزیت‌ها")),
                ("meta_title", models.CharField(blank=True, max_length=250, verbose_name="عنوان SEO")),
                ("meta_description", models.CharField(blank=True, max_length=320, verbose_name="توضیحات SEO")),
                ("is_published", models.BooleanField(default=False, verbose_name="منتشر شده")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={"verbose_name": "صفحه درباره ما", "verbose_name_plural": "صفحه درباره ما"},
        ),
        migrations.CreateModel(
            name="AboutStatistic",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("label", models.CharField(max_length=100, verbose_name="عنوان")),
                ("value", models.PositiveBigIntegerField(verbose_name="مقدار")),
                ("suffix", models.CharField(blank=True, default="+", max_length=12, verbose_name="پسوند")),
                ("icon", models.CharField(choices=[("listing", "آگهی"), ("agency", "نمایندگی"), ("gallery", "نمایشگاه"), ("users", "کاربران")], default="listing", max_length=20, verbose_name="آیکن")),
                ("sort_order", models.PositiveIntegerField(default=0, verbose_name="ترتیب نمایش")),
                ("about_page", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="statistics", to="content.aboutpage")),
            ],
            options={"verbose_name": "آمار درباره ما", "verbose_name_plural": "آمارهای درباره ما", "ordering": ("sort_order", "id")},
        ),
        migrations.CreateModel(
            name="TeamMember",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=120, verbose_name="نام و نام خانوادگی")),
                ("role", models.CharField(max_length=160, verbose_name="سمت")),
                ("photo", models.ImageField(blank=True, help_text="تصویر مربعی پیشنهادی: حداقل 600 در 600 پیکسل", upload_to=apps.content.models.team_member_photo_upload_to, verbose_name="تصویر عضو تیم")),
                ("description", models.TextField(blank=True, verbose_name="توضیح کوتاه")),
                ("is_active", models.BooleanField(default=True, verbose_name="نمایش داده شود")),
                ("sort_order", models.PositiveIntegerField(default=0, verbose_name="ترتیب نمایش")),
                ("about_page", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="team_members", to="content.aboutpage")),
            ],
            options={"verbose_name": "عضو تیم", "verbose_name_plural": "اعضای تیم", "ordering": ("sort_order", "id")},
        ),
        migrations.CreateModel(
            name="AboutTrustItem",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=120, verbose_name="عنوان")),
                ("description", models.CharField(max_length=300, verbose_name="توضیح")),
                ("icon", models.CharField(choices=[("verified", "تأیید رسمی"), ("support", "پشتیبانی"), ("guarantee", "ضمانت"), ("inspection", "کارشناسی")], default="verified", max_length=20, verbose_name="آیکن")),
                ("is_active", models.BooleanField(default=True, verbose_name="نمایش داده شود")),
                ("sort_order", models.PositiveIntegerField(default=0, verbose_name="ترتیب نمایش")),
                ("about_page", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="trust_items", to="content.aboutpage")),
            ],
            options={"verbose_name": "مزیت درباره ما", "verbose_name_plural": "مزیت‌های درباره ما", "ordering": ("sort_order", "id")},
        ),
    ]
