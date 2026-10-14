from django.conf import settings
from django.contrib.postgres.indexes import GinIndex
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.db.models import Q


class BusinessProfile(models.Model):
    class Kind(models.TextChoices):
        GALLERY = "gallery", "نمایشگاه"
        AGENCY = "agency", "نمایندگی"

    class VerificationStatus(models.TextChoices):
        PENDING = "pending", "در انتظار تأیید"
        VERIFIED = "verified", "تأییدشده"
        REJECTED = "rejected", "ردشده"
        SUSPENDED = "suspended", "معلق"

    owner = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="business_profile",
        verbose_name="مالک",
    )
    kind = models.CharField(
        max_length=16,
        choices=Kind.choices,
        default=Kind.GALLERY,
        verbose_name="نوع کسب‌وکار",
    )
    name = models.CharField(max_length=200, verbose_name="نام کسب‌وکار")
    slug = models.SlugField(
        max_length=220,
        unique=True,
        allow_unicode=True,
        verbose_name="نشانی عمومی",
    )
    phone = models.CharField(max_length=20, blank=True, verbose_name="تلفن")
    province = models.CharField(max_length=64, blank=True, verbose_name="استان")
    city = models.CharField(max_length=64, blank=True, verbose_name="شهر")
    address = models.TextField(blank=True, verbose_name="آدرس")
    description = models.TextField(blank=True, verbose_name="معرفی")
    established_year = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=(MinValueValidator(1200), MaxValueValidator(2200)),
        verbose_name="سال تأسیس",
    )
    working_hours = models.TextField(blank=True, verbose_name="ساعات کاری")
    website = models.URLField(blank=True, verbose_name="وب‌سایت")
    license_number = models.CharField(
        max_length=80,
        blank=True,
        verbose_name="شماره مجوز",
    )
    national_id = models.CharField(
        max_length=32,
        blank=True,
        verbose_name="شناسه ملی",
    )
    postal_code = models.CharField(
        max_length=20,
        blank=True,
        verbose_name="کد پستی",
    )
    license_issuer = models.CharField(
        max_length=200,
        blank=True,
        verbose_name="مرجع صادرکننده مجوز",
    )
    license_expires_at = models.DateField(
        null=True,
        blank=True,
        verbose_name="تاریخ اعتبار مجوز",
    )
    company_registration_number = models.CharField(
        max_length=80,
        blank=True,
        verbose_name="شماره ثبت شرکت",
    )
    economic_code = models.CharField(
        max_length=32,
        blank=True,
        verbose_name="کد اقتصادی",
    )
    authorized_representative_name = models.CharField(
        max_length=200,
        blank=True,
        verbose_name="نماینده قانونی شرکت",
    )
    import_license_number = models.CharField(
        max_length=80,
        blank=True,
        verbose_name="شماره مجوز واردات",
    )
    import_license_issuer = models.CharField(
        max_length=200,
        blank=True,
        verbose_name="مرجع صادرکننده مجوز واردات",
    )
    import_license_expires_at = models.DateField(
        null=True,
        blank=True,
        verbose_name="تاریخ اعتبار مجوز واردات",
    )
    business_card_number = models.CharField(
        max_length=80,
        blank=True,
        verbose_name="شماره کارت بازرگانی",
    )
    represented_brands = models.JSONField(
        default=list,
        blank=True,
        verbose_name="برندهای وارداتی",
    )
    verification_status = models.CharField(
        max_length=16,
        choices=VerificationStatus.choices,
        default=VerificationStatus.PENDING,
        verbose_name="وضعیت تأیید",
    )
    verification_note = models.TextField(
        blank=True,
        verbose_name="یادداشت بررسی",
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_businesses",
        verbose_name="بررسی‌شده توسط",
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-verified_at", "-id")
        indexes = [
            models.Index(
                fields=("verification_status", "kind", "-verified_at", "-id"),
                name="business_public_feed_idx",
            ),
            models.Index(
                fields=("verification_status", "city"),
                name="business_status_city_idx",
            ),
            GinIndex(
                fields=("name",),
                name="business_name_trgm_idx",
                opclasses=("gin_trgm_ops",),
            ),
        ]

    def __str__(self) -> str:
        return self.name

    def save(self, *args, **kwargs):
        """Keep gallery and importer-agency documents mutually exclusive."""
        if self.kind == self.Kind.GALLERY:
            self.company_registration_number = ""
            self.economic_code = ""
            self.authorized_representative_name = ""
            self.import_license_number = ""
            self.import_license_issuer = ""
            self.import_license_expires_at = None
            self.business_card_number = ""
            self.represented_brands = []
        elif self.kind == self.Kind.AGENCY:
            self.license_number = ""
            self.license_issuer = ""
            self.license_expires_at = None
        super().save(*args, **kwargs)


class BusinessMembership(models.Model):
    class Role(models.TextChoices):
        MANAGER = "manager", "مدیر"
        LISTING_MANAGER = "listing_manager", "مدیر آگهی‌ها"
        SALES = "sales", "کارشناس فروش"

    class Status(models.TextChoices):
        ACTIVE = "active", "فعال"
        DISABLED = "disabled", "غیرفعال"

    business = models.ForeignKey(
        BusinessProfile,
        on_delete=models.CASCADE,
        related_name="memberships",
        verbose_name="کسب‌وکار",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="business_memberships",
        verbose_name="کاربر",
    )
    role = models.CharField(
        max_length=24,
        choices=Role.choices,
        default=Role.SALES,
        verbose_name="سمت",
    )
    status = models.CharField(
        max_length=16,
        choices=Status.choices,
        default=Status.ACTIVE,
        verbose_name="وضعیت",
    )
    can_manage_listings = models.BooleanField(default=True)
    can_manage_members = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_business_memberships",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at", "-id")
        constraints = [
            models.UniqueConstraint(
                fields=("business", "user"),
                name="business_member_unique",
            ),
        ]
        indexes = [
            models.Index(
                fields=("business", "status", "-id"),
                name="business_member_status_idx",
            ),
            models.Index(
                fields=("user", "status"),
                name="business_user_access_idx",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.business} - {self.user}"


class BusinessSubscription(models.Model):
    class Plan(models.TextChoices):
        GALLERY_MONTHLY = "gallery_monthly", "اشتراک نمایشگاه یک‌ماهه"
        GALLERY_YEARLY = "gallery_yearly", "اشتراک نمایشگاه یک‌ساله"
        AGENCY_MONTHLY = "agency_monthly", "اشتراک نمایندگی یک‌ماهه"
        AGENCY_YEARLY = "agency_yearly", "اشتراک نمایندگی یک‌ساله"

    class Status(models.TextChoices):
        PENDING = "pending", "در انتظار بررسی"
        ACTIVE = "active", "فعال"
        REJECTED = "rejected", "ردشده"
        EXPIRED = "expired", "منقضی"
        CANCELLED = "cancelled", "لغوشده"

    business = models.ForeignKey(
        BusinessProfile,
        on_delete=models.CASCADE,
        related_name="subscriptions",
        verbose_name="کسب‌وکار",
    )
    plan = models.CharField(max_length=24, choices=Plan.choices)
    status = models.CharField(
        max_length=16,
        choices=Status.choices,
        default=Status.PENDING,
    )
    starts_at = models.DateTimeField(null=True, blank=True)
    ends_at = models.DateTimeField(null=True, blank=True)
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="requested_business_subscriptions",
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_business_subscriptions",
    )
    admin_note = models.TextField(blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at", "-id")
        constraints = [
            models.UniqueConstraint(
                fields=("business",),
                condition=Q(status__in=("pending", "active")),
                name="business_one_open_subscription",
            ),
        ]
        indexes = [
            models.Index(
                fields=("status", "-created_at"),
                name="business_sub_status_idx",
            ),
            models.Index(
                fields=("business", "status"),
                name="business_sub_business_idx",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.business} - {self.get_plan_display()}"
