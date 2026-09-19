from pathlib import Path
from uuid import uuid4

from django.db import models
from django.utils import timezone


def educational_video_upload_to(instance, filename: str) -> str:
    suffix = Path(filename).suffix.lower()
    return f"content/videos/{uuid4().hex}{suffix}"


def educational_video_thumbnail_upload_to(instance, filename: str) -> str:
    suffix = Path(filename).suffix.lower()
    return f"content/video-thumbnails/{uuid4().hex}{suffix}"


class EducationalVideo(models.Model):
    class Category(models.TextChoices):
        RULES = "rules", "قوانین"
        EDUCATION = "education", "آموزش"
        COMPARISON = "comparison", "مقایسه"
        GUIDE = "guide", "راهنما"
        REVIEW = "review", "نقد و بررسی"

    title = models.CharField(max_length=220, verbose_name="عنوان")
    slug = models.SlugField(max_length=240, unique=True, verbose_name="نامک")
    category = models.CharField(
        max_length=24,
        choices=Category.choices,
        db_index=True,
        verbose_name="دسته‌بندی",
    )
    description = models.TextField(blank=True, verbose_name="توضیح کوتاه")
    content = models.TextField(
        blank=True,
        verbose_name="متن و سرفصل‌های ویدیو",
        help_text="برای ساخت فصل‌ها، عنوان هر بخش را با ## شروع کنید.",
    )
    author = models.CharField(
        max_length=120,
        default="تیم تحریریه آزادگذر",
        verbose_name="تهیه‌کننده",
    )
    duration = models.CharField(
        max_length=12,
        blank=True,
        verbose_name="مدت زمان",
        help_text="مثال: 18:30",
    )
    thumbnail = models.ImageField(
        upload_to=educational_video_thumbnail_upload_to,
        verbose_name="تصویر کاور",
        help_text="تصویر افقی پیشنهادی: 1280 در 720 پیکسل",
    )
    video = models.FileField(
        upload_to=educational_video_upload_to,
        verbose_name="فایل ویدیو",
    )
    is_published = models.BooleanField(default=False, verbose_name="منتشر شده")
    published_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="زمان انتشار",
    )
    view_count = models.PositiveBigIntegerField(default=0, editable=False)
    sort_order = models.PositiveIntegerField(default=0, verbose_name="ترتیب نمایش")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("sort_order", "-published_at", "-id")
        indexes = [
            models.Index(
                fields=("is_published", "sort_order", "-published_at"),
                name="content_video_public_idx",
            ),
        ]
        verbose_name = "ویدیوی آموزشی"
        verbose_name_plural = "ویدیوهای آموزشی"

    def save(self, *args, **kwargs) -> None:
        if self.is_published and self.published_at is None:
            self.published_at = timezone.now()
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.title
