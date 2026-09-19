import secrets
from pathlib import Path
from uuid import uuid4

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models import Q


REFERRAL_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


def generate_referral_code() -> str:
    """Return a short, URL-safe code; database uniqueness is the final guard."""

    random_part = "".join(
        secrets.choice(REFERRAL_ALPHABET)
        for _ in range(8)
    )
    return f"AZ-{random_part}"


def business_logo_upload_to(instance, filename: str) -> str:
    suffix = Path(filename).suffix.lower()
    return f"businesses/{instance.pk}/logo/{uuid4().hex}{suffix}"


def business_cover_upload_to(instance, filename: str) -> str:
    suffix = Path(filename).suffix.lower()
    return f"businesses/{instance.pk}/cover/{uuid4().hex}{suffix}"


class User(AbstractUser):
    class Role(models.TextChoices):
        BUYER = "buyer", "خریدار"
        SELLER = "seller", "فروشنده شخصی"
        GALLERY = "gallery", "نمایشگاه‌دار"
        AGENCY = "agency", "نمایندگی"
        EXPERT = "expert", "کارشناس خودرو"
        ADMIN = "admin", "مدیر سامانه"
        ORG = "org", "مدیریت سازمان منطقه آزاد"
        FREE_ZONE_SUPERVISOR = (
            "free_zone_supervisor",
            "پنل نظارت منطقه آزاد",
        )
        SMART_ID_OPERATOR = (
            "smart_id_operator",
            "اپراتور شناسنامه هوشمند",
        )

    PUBLIC_SIGNUP_ROLES = {
        Role.BUYER,
        Role.SELLER,
        Role.GALLERY,
        Role.AGENCY,
    }

    class PreferredContactMethod(models.TextChoices):
        PHONE = "phone", "تماس تلفنی"
        CHAT = "chat", "پیام در آزادگذر"
        BOTH = "both", "تماس و پیام"

    role = models.CharField(
        max_length=32,
        choices=Role.choices,
        null=True,
        blank=True,
        verbose_name="نقش",
    )

    phone_number = models.CharField(
        max_length=16,
        unique=True,
        null=True,
        blank=True,
        verbose_name="Phone number",
    )

    is_phone_verified = models.BooleanField(
        default=False,
        verbose_name="Phone verified",
    )

    referral_code = models.CharField(
        max_length=16,
        unique=True,
        default=generate_referral_code,
        editable=False,
        verbose_name="کد دعوت",
    )

    referred_by = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="referred_users",
        verbose_name="دعوت‌شده توسط",
    )

    referral_credit = models.PositiveBigIntegerField(
        default=0,
        verbose_name="اعتبار قابل استفاده",
    )

    referral_earnings = models.PositiveBigIntegerField(
        default=0,
        verbose_name="مجموع پاداش دعوت",
    )

    terms_accepted_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="زمان پذیرش قوانین",
    )

    profile_completed_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="زمان تکمیل پروفایل",
    )

    province = models.CharField(
        max_length=64,
        blank=True,
        verbose_name="استان",
    )

    city = models.CharField(
        max_length=64,
        blank=True,
        verbose_name="شهر",
    )

    address = models.TextField(
        blank=True,
        verbose_name="آدرس",
    )

    preferred_contact_method = models.CharField(
        max_length=16,
        choices=PreferredContactMethod.choices,
        default=PreferredContactMethod.BOTH,
        verbose_name="روش تماس ترجیحی",
    )

    business_name = models.CharField(
        max_length=200,
        blank=True,
        verbose_name="نام کسب‌وکار",
    )

    business_phone = models.CharField(
        max_length=20,
        blank=True,
        verbose_name="تلفن ثابت کسب‌وکار",
    )

    business_description = models.TextField(
        blank=True,
        verbose_name="معرفی کسب‌وکار",
    )

    business_logo = models.ImageField(
        upload_to=business_logo_upload_to,
        blank=True,
        verbose_name="لوگوی کسب‌وکار",
    )

    business_cover = models.ImageField(
        upload_to=business_cover_upload_to,
        blank=True,
        verbose_name="تصویر کاور کسب‌وکار",
    )

    class Meta:
        verbose_name = "user"
        verbose_name_plural = "users"
        indexes = [
            models.Index(
                fields=("role", "is_active", "id"),
                name="account_role_active_idx",
            )
        ]

    @property
    def display_name(self) -> str:
        return (
            self.get_full_name().strip()
            or self.phone_number
            or self.username
        )

    def save(self, *args, **kwargs) -> None:
        if self.is_superuser and not self.role:
            self.role = self.Role.ADMIN
            update_fields = kwargs.get("update_fields")
            if update_fields is not None:
                kwargs["update_fields"] = {
                    *update_fields,
                    "role",
                }
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.display_name


class OtpChallenge(models.Model):
    class Purpose(models.TextChoices):
        SIGNUP = "signup", "ثبت‌نام"
        LOGIN = "login", "ورود"
        PASSWORD_RESET = "password_reset", "بازیابی رمز"

    phone_number = models.CharField(max_length=16)
    purpose = models.CharField(
        max_length=20,
        choices=Purpose.choices,
    )
    code_hash = models.CharField(max_length=64)
    metadata = models.JSONField(default=dict, blank=True)
    attempts = models.PositiveSmallIntegerField(default=0)
    expires_at = models.DateTimeField()
    cooldown_until = models.DateTimeField()
    request_window_started_at = models.DateTimeField()
    request_count = models.PositiveSmallIntegerField(default=1)
    consumed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=("phone_number", "purpose"),
                name="acct_otp_phone_purpose_uniq",
            ),
        ]
        indexes = [
            models.Index(
                fields=("expires_at",),
                name="acct_otp_expiry_idx",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.phone_number} ({self.purpose})"


class Referral(models.Model):
    class RewardType(models.TextChoices):
        CREDIT = "credit", "اعتبار"
        DISCOUNT = "discount", "تخفیف"
        GIFT = "gift", "هدیه"

    referrer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="referral_rewards",
        verbose_name="دعوت‌کننده",
    )
    referee = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="referral_origin",
        verbose_name="کاربر دعوت‌شده",
    )
    code = models.CharField(
        max_length=16,
        verbose_name="کد استفاده‌شده",
    )
    reward_type = models.CharField(
        max_length=16,
        choices=RewardType.choices,
        default=RewardType.CREDIT,
        verbose_name="نوع پاداش",
    )
    reward_value = models.PositiveBigIntegerField(
        default=500_000,
        verbose_name="مبلغ پاداش",
    )
    reward_claimed = models.BooleanField(
        default=False,
        verbose_name="دریافت‌شده",
    )
    claimed_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="زمان دریافت",
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="زمان ایجاد",
    )

    class Meta:
        ordering = ("-created_at", "-id")
        indexes = [
            models.Index(
                fields=("referrer", "reward_claimed"),
                name="account_referral_claim_idx",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.referrer} -> {self.referee}"


class RoleChangeRequest(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "در انتظار بررسی"
        APPROVED = "approved", "تأییدشده"
        REJECTED = "rejected", "ردشده"

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="role_change_requests",
        verbose_name="کاربر",
    )
    from_role = models.CharField(
        max_length=32,
        choices=User.Role.choices,
        verbose_name="نقش فعلی",
    )
    to_role = models.CharField(
        max_length=32,
        choices=User.Role.choices,
        verbose_name="نقش درخواستی",
    )
    reason = models.TextField(verbose_name="دلیل درخواست")
    status = models.CharField(
        max_length=16,
        choices=Status.choices,
        default=Status.PENDING,
        verbose_name="وضعیت",
    )
    admin_note = models.TextField(
        blank=True,
        verbose_name="یادداشت مدیر",
    )
    reviewed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_role_changes",
        verbose_name="بررسی‌شده توسط",
    )
    reviewed_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="زمان بررسی",
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="زمان ایجاد",
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="زمان به‌روزرسانی",
    )

    class Meta:
        ordering = ("-created_at", "-id")
        constraints = [
            models.UniqueConstraint(
                fields=("user",),
                condition=Q(status="pending"),
                name="account_one_pending_role",
            ),
        ]
        indexes = [
            models.Index(
                fields=("status", "created_at"),
                name="account_role_status_idx",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.user}: {self.from_role} -> {self.to_role}"
