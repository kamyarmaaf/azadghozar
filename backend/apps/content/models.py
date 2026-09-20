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


class FrequentlyAskedQuestion(models.Model):
    class Category(models.TextChoices):
        GENERAL = "general", "عمومی"
        BUYING = "buying", "خرید خودرو"
        SELLING = "selling", "فروش خودرو"
        FREE_ZONE = "free_zone", "مناطق آزاد و قوانین"
        ACCOUNT = "account", "حساب کاربری"
        SERVICES = "services", "خدمات"

    question = models.CharField(max_length=300, verbose_name="سؤال")
    answer = models.TextField(verbose_name="پاسخ")
    category = models.CharField(
        max_length=24,
        choices=Category.choices,
        default=Category.GENERAL,
        db_index=True,
        verbose_name="دسته‌بندی",
    )
    is_published = models.BooleanField(default=False, verbose_name="منتشر شده")
    sort_order = models.PositiveIntegerField(default=0, verbose_name="ترتیب نمایش")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("sort_order", "id")
        indexes = [
            models.Index(
                fields=("is_published", "sort_order", "id"),
                name="content_faq_public_idx",
            ),
        ]
        verbose_name = "سؤال متداول"
        verbose_name_plural = "سؤالات متداول"

    def __str__(self) -> str:
        return self.question


def article_cover_upload_to(instance, filename: str) -> str:
    suffix = Path(filename).suffix.lower()
    return f"content/article-covers/{uuid4().hex}{suffix}"


def about_hero_upload_to(instance, filename: str) -> str:
    suffix = Path(filename).suffix.lower()
    return f"content/about/hero/{uuid4().hex}{suffix}"


def team_member_photo_upload_to(instance, filename: str) -> str:
    suffix = Path(filename).suffix.lower()
    return f"content/about/team/{uuid4().hex}{suffix}"


class Article(models.Model):
    class Category(models.TextChoices):
        BUYING_GUIDE = "buying_guide", "راهنمای خرید"
        COMPARISON = "comparison", "مقایسه خودرو"
        IMPORT_RULES = "import_rules", "قوانین واردات"
        REVIEW = "review", "نقد و بررسی خودرو"
        FREE_ZONE = "free_zone", "قوانین منطقه آزاد"
        NEWS = "news", "اخبار خودرو"

    title = models.CharField(max_length=250, verbose_name="عنوان")
    slug = models.SlugField(max_length=270, unique=True, verbose_name="نامک")
    summary = models.TextField(max_length=700, verbose_name="خلاصه")
    content = models.TextField(
        verbose_name="متن مقاله",
        help_text="عنوان بخش‌ها را با ## و موارد فهرست را با - شروع کنید.",
    )
    category = models.CharField(
        max_length=32,
        choices=Category.choices,
        db_index=True,
        verbose_name="دسته‌بندی",
    )
    author = models.CharField(
        max_length=120,
        default="تیم تحریریه آزادگذر",
        verbose_name="نویسنده",
    )
    read_time = models.CharField(
        max_length=30,
        blank=True,
        verbose_name="زمان مطالعه",
        help_text="مثال: ۸ دقیقه",
    )
    cover_image = models.ImageField(
        upload_to=article_cover_upload_to,
        verbose_name="تصویر شاخص",
        help_text="تصویر افقی پیشنهادی: 1600 در 900 پیکسل",
    )
    meta_title = models.CharField(
        max_length=250,
        blank=True,
        verbose_name="عنوان SEO",
    )
    meta_description = models.CharField(
        max_length=320,
        blank=True,
        verbose_name="توضیحات SEO",
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
                name="content_article_public_idx",
            ),
        ]
        verbose_name = "مقاله مجله خودرو"
        verbose_name_plural = "مقالات مجله خودرو"

    def save(self, *args, **kwargs) -> None:
        if self.is_published and self.published_at is None:
            self.published_at = timezone.now()
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.title


class AboutPage(models.Model):
    site_key = models.CharField(max_length=32, unique=True, default="main", editable=False)
    hero_title = models.CharField(
        max_length=180,
        default="درباره آزاد گذر",
        verbose_name="عنوان اصلی",
    )
    intro = models.TextField(verbose_name="متن معرفی")
    hero_image = models.ImageField(
        upload_to=about_hero_upload_to,
        blank=True,
        verbose_name="تصویر بنر",
        help_text="اختیاری؛ تصویر افقی پیشنهادی: 1920 در 800 پیکسل",
    )
    why_title = models.CharField(
        max_length=180,
        default="چرا آزاد گذر؟",
        verbose_name="عنوان بخش مأموریت",
    )
    mission_title = models.CharField(max_length=120, default="مأموریت ما", verbose_name="عنوان مأموریت")
    mission_text = models.TextField(verbose_name="متن مأموریت")
    vision_title = models.CharField(max_length=120, default="چشم‌انداز ما", verbose_name="عنوان چشم‌انداز")
    vision_text = models.TextField(verbose_name="متن چشم‌انداز")
    values_title = models.CharField(max_length=120, default="ارزش‌های ما", verbose_name="عنوان ارزش‌ها")
    values_text = models.TextField(verbose_name="متن ارزش‌ها")
    team_title = models.CharField(max_length=120, default="تیم ما", verbose_name="عنوان بخش تیم")
    trust_title = models.CharField(max_length=120, default="مزیت‌های آزاد گذر", verbose_name="عنوان بخش اعتماد")
    show_statistics = models.BooleanField(default=True, verbose_name="نمایش آمار")
    show_team = models.BooleanField(default=True, verbose_name="نمایش اعضای تیم")
    show_trust_items = models.BooleanField(default=True, verbose_name="نمایش مزیت‌ها")
    meta_title = models.CharField(max_length=250, blank=True, verbose_name="عنوان SEO")
    meta_description = models.CharField(max_length=320, blank=True, verbose_name="توضیحات SEO")
    is_published = models.BooleanField(default=False, verbose_name="منتشر شده")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "صفحه درباره ما"
        verbose_name_plural = "صفحه درباره ما"

    def __str__(self) -> str:
        return self.hero_title


class AboutStatistic(models.Model):
    class Icon(models.TextChoices):
        LISTING = "listing", "آگهی"
        AGENCY = "agency", "نمایندگی"
        GALLERY = "gallery", "نمایشگاه"
        USERS = "users", "کاربران"

    about_page = models.ForeignKey(AboutPage, on_delete=models.CASCADE, related_name="statistics")
    label = models.CharField(max_length=100, verbose_name="عنوان")
    value = models.PositiveBigIntegerField(verbose_name="مقدار")
    suffix = models.CharField(max_length=12, default="+", blank=True, verbose_name="پسوند")
    icon = models.CharField(max_length=20, choices=Icon.choices, default=Icon.LISTING, verbose_name="آیکن")
    sort_order = models.PositiveIntegerField(default=0, verbose_name="ترتیب نمایش")

    class Meta:
        ordering = ("sort_order", "id")
        verbose_name = "آمار درباره ما"
        verbose_name_plural = "آمارهای درباره ما"

    def __str__(self) -> str:
        return self.label


class TeamMember(models.Model):
    about_page = models.ForeignKey(AboutPage, on_delete=models.CASCADE, related_name="team_members")
    name = models.CharField(max_length=120, verbose_name="نام و نام خانوادگی")
    role = models.CharField(max_length=160, verbose_name="سمت")
    photo = models.ImageField(
        upload_to=team_member_photo_upload_to,
        blank=True,
        verbose_name="تصویر عضو تیم",
        help_text="تصویر مربعی پیشنهادی: حداقل 600 در 600 پیکسل",
    )
    description = models.TextField(blank=True, verbose_name="توضیح کوتاه")
    is_active = models.BooleanField(default=True, verbose_name="نمایش داده شود")
    sort_order = models.PositiveIntegerField(default=0, verbose_name="ترتیب نمایش")

    class Meta:
        ordering = ("sort_order", "id")
        verbose_name = "عضو تیم"
        verbose_name_plural = "اعضای تیم"

    def __str__(self) -> str:
        return self.name


class AboutTrustItem(models.Model):
    class Icon(models.TextChoices):
        VERIFIED = "verified", "تأیید رسمی"
        SUPPORT = "support", "پشتیبانی"
        GUARANTEE = "guarantee", "ضمانت"
        INSPECTION = "inspection", "کارشناسی"

    about_page = models.ForeignKey(AboutPage, on_delete=models.CASCADE, related_name="trust_items")
    title = models.CharField(max_length=120, verbose_name="عنوان")
    description = models.CharField(max_length=300, verbose_name="توضیح")
    icon = models.CharField(max_length=20, choices=Icon.choices, default=Icon.VERIFIED, verbose_name="آیکن")
    is_active = models.BooleanField(default=True, verbose_name="نمایش داده شود")
    sort_order = models.PositiveIntegerField(default=0, verbose_name="ترتیب نمایش")

    class Meta:
        ordering = ("sort_order", "id")
        verbose_name = "مزیت درباره ما"
        verbose_name_plural = "مزیت‌های درباره ما"

    def __str__(self) -> str:
        return self.title


class ContactPage(models.Model):
    site_key = models.CharField(max_length=32, unique=True, default="main", editable=False)
    title = models.CharField(max_length=180, default="تماس با ما", verbose_name="عنوان صفحه")
    subtitle = models.CharField(max_length=300, blank=True, verbose_name="توضیح کوتاه")
    form_title = models.CharField(max_length=120, default="ارسال پیام", verbose_name="عنوان فرم")
    information_title = models.CharField(max_length=120, default="اطلاعات تماس", verbose_name="عنوان اطلاعات تماس")
    address = models.TextField(blank=True, verbose_name="آدرس")
    phone = models.CharField(max_length=30, blank=True, verbose_name="تلفن")
    email = models.EmailField(blank=True, verbose_name="ایمیل")
    working_hours = models.TextField(blank=True, verbose_name="ساعات کاری")
    social_title = models.CharField(max_length=120, default="شبکه‌های اجتماعی", verbose_name="عنوان شبکه‌های اجتماعی")
    instagram_url = models.URLField(blank=True, verbose_name="لینک اینستاگرام")
    whatsapp_url = models.URLField(blank=True, verbose_name="لینک واتساپ")
    map_embed_url = models.URLField(
        blank=True,
        max_length=600,
        verbose_name="لینک Embed نقشه",
        help_text="لینک امن HTTPS برای نمایش نقشه؛ در صورت خالی بودن، آدرس متنی نمایش داده می‌شود.",
    )
    map_link = models.URLField(blank=True, max_length=600, verbose_name="لینک بازکردن نقشه")
    meta_title = models.CharField(max_length=250, blank=True, verbose_name="عنوان SEO")
    meta_description = models.CharField(max_length=320, blank=True, verbose_name="توضیحات SEO")
    is_published = models.BooleanField(default=False, verbose_name="منتشر شده")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "تنظیمات تماس با ما"
        verbose_name_plural = "تنظیمات تماس با ما"

    def __str__(self) -> str:
        return self.title


class ContactMessage(models.Model):
    class Subject(models.TextChoices):
        SERVICES = "services", "سؤال درباره خدمات"
        TECHNICAL = "technical", "پشتیبانی فنی"
        COOPERATION = "cooperation", "پیشنهاد همکاری"
        FEEDBACK = "feedback", "شکایات و پیشنهادات"
        OTHER = "other", "سایر"

    class Status(models.TextChoices):
        NEW = "new", "جدید"
        IN_REVIEW = "in_review", "در حال بررسی"
        REPLIED = "replied", "پاسخ داده شده"
        CLOSED = "closed", "بسته شده"

    public_id = models.UUIDField(default=uuid4, unique=True, editable=False, verbose_name="شناسه پیگیری")
    name = models.CharField(max_length=120, verbose_name="نام و نام خانوادگی")
    email = models.EmailField(verbose_name="ایمیل")
    phone = models.CharField(max_length=16, blank=True, verbose_name="شماره تماس")
    subject = models.CharField(max_length=24, choices=Subject.choices, verbose_name="موضوع")
    message = models.TextField(max_length=4000, verbose_name="متن پیام")
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.NEW,
        db_index=True,
        verbose_name="وضعیت رسیدگی",
    )
    admin_note = models.TextField(blank=True, verbose_name="یادداشت داخلی ادمین")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at", "-id")
        indexes = [
            models.Index(fields=("status", "-created_at"), name="content_contact_status_idx"),
            models.Index(fields=("email",), name="content_contact_email_idx"),
        ]
        verbose_name = "پیام تماس"
        verbose_name_plural = "پیام‌های تماس"

    def __str__(self) -> str:
        return f"{self.get_subject_display()} - {self.name}"
