from pathlib import Path
from uuid import uuid4

from django.contrib.postgres.indexes import GinIndex
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.db.models.functions import Lower


class TimestampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Brand(TimestampedModel):
    name = models.CharField(max_length=100)
    name_fa = models.CharField(max_length=100, blank=True)
    slug = models.SlugField(max_length=120, unique=True)
    logo_url = models.URLField(max_length=500, blank=True)
    country = models.CharField(max_length=80, blank=True)
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ("sort_order", "name", "id")
        constraints = [
            models.UniqueConstraint(
                Lower("name"),
                name="catalog_brand_name_ci_unique",
            ),
        ]
        indexes = [
            models.Index(
                fields=("is_active", "sort_order"),
                name="catalog_brand_active_sort_idx",
            ),
        ]

    def __str__(self) -> str:
        return self.name_fa or self.name


class VehicleModel(TimestampedModel):
    class BodyType(models.TextChoices):
        SEDAN = "sedan", "Sedan"
        HATCHBACK = "hatchback", "Hatchback"
        SUV = "suv", "SUV"
        CROSSOVER = "crossover", "Crossover"
        COUPE = "coupe", "Coupe"
        CONVERTIBLE = "convertible", "Convertible"
        WAGON = "wagon", "Wagon"
        PICKUP = "pickup", "Pickup"
        VAN = "van", "Van"
        MINIVAN = "minivan", "Minivan"
        OTHER = "other", "Other"

    brand = models.ForeignKey(
        Brand,
        on_delete=models.PROTECT,
        related_name="vehicle_models",
    )
    name = models.CharField(max_length=120)
    name_fa = models.CharField(max_length=120, blank=True)
    slug = models.SlugField(max_length=180, unique=True)
    body_type = models.CharField(
        max_length=20,
        choices=BodyType.choices,
        blank=True,
    )
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ("brand__sort_order", "sort_order", "name", "id")
        constraints = [
            models.UniqueConstraint(
                "brand",
                Lower("name"),
                name="catalog_model_brand_name_ci_unique",
            ),
        ]
        indexes = [
            models.Index(
                fields=("brand", "is_active", "sort_order"),
                name="catalog_model_active_idx",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.brand.name} {self.name}"


class VehicleTrim(TimestampedModel):
    class Transmission(models.TextChoices):
        MANUAL = "manual", "Manual"
        AUTOMATIC = "automatic", "Automatic"
        CVT = "cvt", "CVT"
        DCT = "dct", "DCT"
        AMT = "amt", "AMT"
        OTHER = "other", "Other"

    class FuelType(models.TextChoices):
        GASOLINE = "gasoline", "Gasoline"
        DIESEL = "diesel", "Diesel"
        HYBRID = "hybrid", "Hybrid"
        PLUG_IN_HYBRID = "phev", "Plug-in hybrid"
        ELECTRIC = "electric", "Electric"
        CNG = "cng", "CNG"
        OTHER = "other", "Other"

    class Drivetrain(models.TextChoices):
        FWD = "fwd", "Front-wheel drive"
        RWD = "rwd", "Rear-wheel drive"
        AWD = "awd", "All-wheel drive"
        FOUR_WD = "4wd", "Four-wheel drive"
        OTHER = "other", "Other"

    vehicle_model = models.ForeignKey(
        VehicleModel,
        on_delete=models.PROTECT,
        related_name="trims",
    )
    name = models.CharField(max_length=160)
    name_fa = models.CharField(max_length=160, blank=True)
    slug = models.SlugField(max_length=220, unique=True)
    production_start_year = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=(MinValueValidator(1886), MaxValueValidator(2100)),
    )
    production_end_year = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=(MinValueValidator(1886), MaxValueValidator(2100)),
    )
    engine_displacement_cc = models.PositiveIntegerField(
        null=True,
        blank=True,
        validators=(MinValueValidator(1), MaxValueValidator(20000)),
    )
    power_hp = models.PositiveIntegerField(
        null=True,
        blank=True,
        validators=(MinValueValidator(1), MaxValueValidator(5000)),
    )
    torque_nm = models.PositiveIntegerField(
        null=True,
        blank=True,
        validators=(MinValueValidator(1), MaxValueValidator(10000)),
    )
    transmission = models.CharField(
        max_length=20,
        choices=Transmission.choices,
        blank=True,
    )
    fuel_type = models.CharField(
        max_length=20,
        choices=FuelType.choices,
        blank=True,
    )
    drivetrain = models.CharField(
        max_length=20,
        choices=Drivetrain.choices,
        blank=True,
    )
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = (
            "vehicle_model__brand__sort_order",
            "vehicle_model__sort_order",
            "sort_order",
            "name",
            "id",
        )
        constraints = [
            models.UniqueConstraint(
                "vehicle_model",
                Lower("name"),
                name="catalog_trim_model_name_ci_unique",
            ),
            models.CheckConstraint(
                condition=(
                    models.Q(production_start_year__isnull=True)
                    | models.Q(production_end_year__isnull=True)
                    | models.Q(
                        production_end_year__gte=models.F(
                            "production_start_year"
                        )
                    )
                ),
                name="catalog_trim_valid_year_range",
            ),
        ]
        indexes = [
            models.Index(
                fields=("vehicle_model", "is_active", "sort_order"),
                name="catalog_trim_parent_active_idx",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.vehicle_model} {self.name}"


def listing_image_upload_to(instance, filename: str) -> str:
    suffix = Path(filename).suffix.lower()
    return f"listings/{instance.listing_id}/images/{uuid4().hex}{suffix}"


def listing_video_upload_to(instance, filename: str) -> str:
    suffix = Path(filename).suffix.lower()
    return f"listings/{instance.owner_id}/videos/{uuid4().hex}{suffix}"


class VehicleListing(TimestampedModel):
    class Status(models.TextChoices):
        PENDING = "pending", "در انتظار بررسی"
        ACTIVE = "active", "فعال"
        REJECTED = "rejected", "رد شده"
        SOLD = "sold", "فروخته شده"
        EXPIRED = "expired", "منقضی"

    class PlateType(models.TextChoices):
        FREE_ZONE = "free_zone", "منطقه آزاد"
        TEMPORARY_IMPORT = "temporary_import", "واردات موقت"
        NATIONAL = "national", "پلاک ملی"

    class Condition(models.TextChoices):
        NEW = "new", "آکبند"
        LIKE_NEW = "like_new", "در حد نو"
        CLEAN_USED = "clean_used", "کارکرده تمیز"
        GOOD = "good", "سالم"
        NEEDS_REPAIR = "needs_repair", "نیاز به تعمیر"

    class BodyCondition(models.TextChoices):
        NO_PAINT = "no_paint", "بدون رنگ"
        ONE_SPOT = "one_spot", "یک لکه رنگ"
        MULTIPLE_SPOTS = "multiple_spots", "چند لکه رنگ"
        AROUND_PAINT = "around_paint", "دور رنگ"
        FULL_PAINT = "full_paint", "تمام رنگ"
        ACCIDENT = "accident", "تصادفی"

    class ChassisCondition(models.TextChoices):
        SEALED = "sealed", "سالم و پلمپ"
        MINOR_DAMAGE = "minor_damage", "ضربه جزئی"
        DAMAGED = "damaged", "آسیب‌دیده"

    class EngineCondition(models.TextChoices):
        HEALTHY = "healthy", "سالم"
        NEEDS_SERVICE = "needs_service", "نیاز به سرویس"
        REPLACED = "replaced", "تعویض شده"
        NEEDS_REPAIR = "needs_repair", "نیاز به تعمیر"

    class OwnershipStatus(models.TextChoices):
        OWNER = "owner", "سند به نام فروشنده"
        READY = "ready", "سند آماده انتقال"
        POWER_OF_ATTORNEY = "power_of_attorney", "وکالتی"
        FINANCED = "financed", "در رهن یا لیزینگ"

    class PriceType(models.TextChoices):
        FIXED = "fixed", "قیمت قطعی"
        NEGOTIABLE = "negotiable", "قابل مذاکره"
        CONTACT = "contact", "تماس بگیرید"

    class ContactPreference(models.TextChoices):
        PHONE = "phone", "تماس تلفنی"
        CHAT = "chat", "پیام در آزادگذر"
        BOTH = "both", "تماس و پیام"

    owner = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="vehicle_listings",
    )
    business = models.ForeignKey(
        "businesses.BusinessProfile",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="listings",
    )
    status = models.CharField(
        max_length=16,
        choices=Status.choices,
        default=Status.PENDING,
    )
    brand_name = models.CharField(max_length=100)
    model_name = models.CharField(max_length=120)
    trim_name = models.CharField(max_length=160, blank=True)
    production_year = models.PositiveSmallIntegerField(
        validators=(MinValueValidator(1886), MaxValueValidator(2100)),
    )
    plate_type = models.CharField(max_length=24, choices=PlateType.choices)
    free_zone = models.CharField(max_length=80, blank=True)
    province = models.CharField(max_length=64)
    city = models.CharField(max_length=64)
    color = models.CharField(max_length=40)
    body_type = models.CharField(max_length=40)
    engine_description = models.CharField(max_length=120, blank=True)
    transmission = models.CharField(
        max_length=20,
        choices=VehicleTrim.Transmission.choices,
    )
    fuel_type = models.CharField(
        max_length=20,
        choices=VehicleTrim.FuelType.choices,
    )
    drivetrain = models.CharField(
        max_length=20,
        choices=VehicleTrim.Drivetrain.choices,
    )
    mileage = models.PositiveIntegerField()
    condition = models.CharField(max_length=20, choices=Condition.choices)
    body_condition = models.CharField(
        max_length=24,
        choices=BodyCondition.choices,
    )
    chassis_condition = models.CharField(
        max_length=20,
        choices=ChassisCondition.choices,
    )
    engine_condition = models.CharField(
        max_length=20,
        choices=EngineCondition.choices,
    )
    insurance_months = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=(MaxValueValidator(12),),
    )
    ownership_status = models.CharField(
        max_length=24,
        choices=OwnershipStatus.choices,
    )
    description = models.TextField(blank=True)
    price_type = models.CharField(max_length=16, choices=PriceType.choices)
    price = models.PositiveBigIntegerField(null=True, blank=True)
    trade_possible = models.BooleanField(default=False)
    is_instant_sale = models.BooleanField(default=False)
    is_special_sale = models.BooleanField(default=False)
    is_inspected = models.BooleanField(default=False)
    view_count = models.PositiveIntegerField(default=0)
    contact_number = models.CharField(max_length=20)
    contact_preference = models.CharField(
        max_length=16,
        choices=ContactPreference.choices,
        default=ContactPreference.BOTH,
    )
    video = models.FileField(
        upload_to=listing_video_upload_to,
        blank=True,
    )
    rejection_reason = models.TextField(blank=True)
    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ("-created_at", "-id")
        indexes = [
            models.Index(
                fields=("status", "-created_at"),
                name="listing_status_created_idx",
            ),
            models.Index(
                fields=("-created_at", "-id"),
                condition=models.Q(status="active"),
                name="listing_active_feed_idx",
            ),
            models.Index(
                fields=("price", "-created_at"),
                condition=models.Q(status="active"),
                name="listing_active_price_idx",
            ),
            models.Index(
                fields=("mileage", "-created_at"),
                condition=models.Q(status="active"),
                name="listing_active_mileage_idx",
            ),
            models.Index(
                fields=("production_year", "-created_at"),
                condition=models.Q(status="active"),
                name="listing_active_year_idx",
            ),
            models.Index(
                fields=("brand_name", "-created_at"),
                condition=models.Q(status="active"),
                name="listing_active_brand_idx",
            ),
            models.Index(
                fields=("province", "city", "status"),
                name="listing_location_idx",
            ),
            models.Index(
                fields=("owner", "status"),
                name="listing_owner_status_idx",
            ),
            models.Index(
                fields=("business", "status", "-created_at", "-id"),
                name="listing_business_feed_idx",
            ),
            GinIndex(
                fields=("brand_name",),
                name="listing_brand_trgm_idx",
                opclasses=("gin_trgm_ops",),
            ),
            GinIndex(
                fields=("model_name",),
                name="listing_model_trgm_idx",
                opclasses=("gin_trgm_ops",),
            ),
            GinIndex(
                fields=("trim_name",),
                name="listing_trim_trgm_idx",
                opclasses=("gin_trgm_ops",),
            ),
            GinIndex(
                fields=("city",),
                name="listing_city_trgm_idx",
                opclasses=("gin_trgm_ops",),
            ),
        ]
        constraints = [
            models.CheckConstraint(
                condition=(
                    models.Q(price_type="contact")
                    | models.Q(price__isnull=False)
                ),
                name="listing_price_required_ck",
            ),
            models.CheckConstraint(
                condition=(
                    ~models.Q(plate_type="free_zone")
                    | ~models.Q(free_zone="")
                ),
                name="listing_free_zone_ck",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.brand_name} {self.model_name} ({self.production_year})"


class VehicleListingImage(models.Model):
    listing = models.ForeignKey(
        VehicleListing,
        on_delete=models.CASCADE,
        related_name="images",
    )
    file = models.FileField(upload_to=listing_image_upload_to)
    sort_order = models.PositiveSmallIntegerField(default=0)
    file_size = models.PositiveIntegerField(default=0)
    mime_type = models.CharField(max_length=40, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("sort_order", "id")
        constraints = [
            models.UniqueConstraint(
                fields=("listing", "sort_order"),
                name="listing_image_order_uniq",
            ),
        ]

    def __str__(self) -> str:
        return f"Listing {self.listing_id} image {self.sort_order}"


class ListingFavorite(TimestampedModel):
    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="listing_favorites",
    )
    listing = models.ForeignKey(
        VehicleListing,
        on_delete=models.CASCADE,
        related_name="favorited_by",
    )

    class Meta:
        ordering = ("-created_at", "-id")
        constraints = [
            models.UniqueConstraint(
                fields=("user", "listing"),
                name="favorite_user_listing_uniq",
            ),
        ]
        indexes = [
            models.Index(
                fields=("user", "-created_at"),
                name="favorite_user_created_idx",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.user_id} saved listing {self.listing_id}"
