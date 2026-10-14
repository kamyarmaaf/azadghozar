import apps.content.models
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("content", "0002_frequentlyaskedquestion"),
    ]

    operations = [
        migrations.CreateModel(
            name="Article",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=250, verbose_name="عنوان")),
                ("slug", models.SlugField(max_length=270, unique=True, verbose_name="نامک")),
                ("summary", models.TextField(max_length=700, verbose_name="خلاصه")),
                ("content", models.TextField(help_text="عنوان بخش‌ها را با ## و موارد فهرست را با - شروع کنید.", verbose_name="متن مقاله")),
                ("category", models.CharField(choices=[("buying_guide", "راهنمای خرید"), ("comparison", "مقایسه خودرو"), ("import_rules", "قوانین واردات"), ("review", "نقد و بررسی خودرو"), ("free_zone", "قوانین منطقه آزاد"), ("news", "اخبار خودرو")], db_index=True, max_length=32, verbose_name="دسته‌بندی")),
                ("author", models.CharField(default="تیم تحریریه آزادگذر", max_length=120, verbose_name="نویسنده")),
                ("read_time", models.CharField(blank=True, help_text="مثال: ۸ دقیقه", max_length=30, verbose_name="زمان مطالعه")),
                ("cover_image", models.ImageField(help_text="تصویر افقی پیشنهادی: 1600 در 900 پیکسل", upload_to=apps.content.models.article_cover_upload_to, verbose_name="تصویر شاخص")),
                ("meta_title", models.CharField(blank=True, max_length=250, verbose_name="عنوان SEO")),
                ("meta_description", models.CharField(blank=True, max_length=320, verbose_name="توضیحات SEO")),
                ("is_published", models.BooleanField(default=False, verbose_name="منتشر شده")),
                ("published_at", models.DateTimeField(blank=True, null=True, verbose_name="زمان انتشار")),
                ("view_count", models.PositiveBigIntegerField(default=0, editable=False)),
                ("sort_order", models.PositiveIntegerField(default=0, verbose_name="ترتیب نمایش")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "مقاله مجله خودرو",
                "verbose_name_plural": "مقالات مجله خودرو",
                "ordering": ("sort_order", "-published_at", "-id"),
            },
        ),
        migrations.AddIndex(
            model_name="article",
            index=models.Index(fields=["is_published", "sort_order", "-published_at"], name="content_article_public_idx"),
        ),
    ]
