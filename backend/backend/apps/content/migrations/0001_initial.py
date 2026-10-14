import apps.content.models
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="EducationalVideo",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=220, verbose_name="عنوان")),
                ("slug", models.SlugField(max_length=240, unique=True, verbose_name="نامک")),
                ("category", models.CharField(choices=[("rules", "قوانین"), ("education", "آموزش"), ("comparison", "مقایسه"), ("guide", "راهنما"), ("review", "نقد و بررسی")], db_index=True, max_length=24, verbose_name="دسته‌بندی")),
                ("description", models.TextField(blank=True, verbose_name="توضیح کوتاه")),
                ("content", models.TextField(blank=True, help_text="برای ساخت فصل‌ها، عنوان هر بخش را با ## شروع کنید.", verbose_name="متن و سرفصل‌های ویدیو")),
                ("author", models.CharField(default="تیم تحریریه آزادگذر", max_length=120, verbose_name="تهیه‌کننده")),
                ("duration", models.CharField(blank=True, help_text="مثال: 18:30", max_length=12, verbose_name="مدت زمان")),
                ("thumbnail", models.ImageField(help_text="تصویر افقی پیشنهادی: 1280 در 720 پیکسل", upload_to=apps.content.models.educational_video_thumbnail_upload_to, verbose_name="تصویر کاور")),
                ("video", models.FileField(upload_to=apps.content.models.educational_video_upload_to, verbose_name="فایل ویدیو")),
                ("is_published", models.BooleanField(default=False, verbose_name="منتشر شده")),
                ("published_at", models.DateTimeField(blank=True, null=True, verbose_name="زمان انتشار")),
                ("view_count", models.PositiveBigIntegerField(default=0, editable=False)),
                ("sort_order", models.PositiveIntegerField(default=0, verbose_name="ترتیب نمایش")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "ویدیوی آموزشی",
                "verbose_name_plural": "ویدیوهای آموزشی",
                "ordering": ("sort_order", "-published_at", "-id"),
            },
        ),
        migrations.AddIndex(
            model_name="educationalvideo",
            index=models.Index(fields=["is_published", "sort_order", "-published_at"], name="content_video_public_idx"),
        ),
    ]
