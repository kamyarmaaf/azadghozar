import django.contrib.postgres.indexes
import django.core.validators
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models
from django.db.models import Q
from django.utils.text import slugify


def create_existing_business_profiles(apps, schema_editor) -> None:
    User = apps.get_model("accounts", "User")
    BusinessProfile = apps.get_model("businesses", "BusinessProfile")
    profiles = []
    users = User.objects.filter(role__in=("gallery", "agency")).iterator(
        chunk_size=2000
    )
    for user in users:
        full_name = f"{user.first_name} {user.last_name}".strip()
        name = (user.business_name or "").strip() or full_name
        name = name or user.phone_number or user.username
        base = slugify(name, allow_unicode=True)[:180] or "business"
        profiles.append(BusinessProfile(
            owner_id=user.pk,
            kind="agency" if user.role == "agency" else "gallery",
            name=name,
            slug=f"{base}-{user.pk}",
            phone=user.business_phone,
            province=user.province,
            city=user.city,
            address=user.address,
            description=user.business_description,
        ))
        if len(profiles) == 2000:
            BusinessProfile.objects.bulk_create(profiles, batch_size=2000)
            profiles.clear()
    if profiles:
        BusinessProfile.objects.bulk_create(profiles, batch_size=2000)


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("catalog", "0006_listing_scale_indexes"),
        ("accounts", "0008_user_business_media"),
    ]

    operations = [
        migrations.CreateModel(
            name="BusinessProfile",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("kind", models.CharField(choices=[("gallery", "نمایشگاه"), ("agency", "نمایندگی")], default="gallery", max_length=16, verbose_name="نوع کسب‌وکار")),
                ("name", models.CharField(max_length=200, verbose_name="نام کسب‌وکار")),
                ("slug", models.SlugField(allow_unicode=True, max_length=220, unique=True, verbose_name="نشانی عمومی")),
                ("phone", models.CharField(blank=True, max_length=20, verbose_name="تلفن")),
                ("province", models.CharField(blank=True, max_length=64, verbose_name="استان")),
                ("city", models.CharField(blank=True, max_length=64, verbose_name="شهر")),
                ("address", models.TextField(blank=True, verbose_name="آدرس")),
                ("description", models.TextField(blank=True, verbose_name="معرفی")),
                ("established_year", models.PositiveSmallIntegerField(blank=True, null=True, validators=[django.core.validators.MinValueValidator(1200), django.core.validators.MaxValueValidator(2200)], verbose_name="سال تأسیس")),
                ("working_hours", models.TextField(blank=True, verbose_name="ساعات کاری")),
                ("website", models.URLField(blank=True, verbose_name="وب‌سایت")),
                ("license_number", models.CharField(blank=True, max_length=80, verbose_name="شماره مجوز")),
                ("national_id", models.CharField(blank=True, max_length=32, verbose_name="شناسه ملی")),
                ("verification_status", models.CharField(choices=[("pending", "در انتظار تأیید"), ("verified", "تأییدشده"), ("rejected", "ردشده"), ("suspended", "معلق")], default="pending", max_length=16, verbose_name="وضعیت تأیید")),
                ("verification_note", models.TextField(blank=True, verbose_name="یادداشت بررسی")),
                ("verified_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("owner", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="business_profile", to=settings.AUTH_USER_MODEL, verbose_name="مالک")),
                ("reviewed_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="reviewed_businesses", to=settings.AUTH_USER_MODEL, verbose_name="بررسی‌شده توسط")),
            ],
            options={
                "ordering": ("-verified_at", "-id"),
                "indexes": [
                    models.Index(fields=["verification_status", "kind", "-verified_at", "-id"], name="business_public_feed_idx"),
                    models.Index(fields=["verification_status", "city"], name="business_status_city_idx"),
                    django.contrib.postgres.indexes.GinIndex(fields=["name"], name="business_name_trgm_idx", opclasses=("gin_trgm_ops",)),
                ],
            },
        ),
        migrations.CreateModel(
            name="BusinessMembership",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("role", models.CharField(choices=[("manager", "مدیر"), ("listing_manager", "مدیر آگهی‌ها"), ("sales", "کارشناس فروش")], default="sales", max_length=24, verbose_name="سمت")),
                ("status", models.CharField(choices=[("active", "فعال"), ("disabled", "غیرفعال")], default="active", max_length=16, verbose_name="وضعیت")),
                ("can_manage_listings", models.BooleanField(default=True)),
                ("can_manage_members", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("business", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="memberships", to="businesses.businessprofile", verbose_name="کسب‌وکار")),
                ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="created_business_memberships", to=settings.AUTH_USER_MODEL)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="business_memberships", to=settings.AUTH_USER_MODEL, verbose_name="کاربر")),
            ],
            options={
                "ordering": ("-created_at", "-id"),
                "indexes": [
                    models.Index(fields=["business", "status", "-id"], name="business_member_status_idx"),
                    models.Index(fields=["user", "status"], name="business_user_access_idx"),
                ],
                "constraints": [models.UniqueConstraint(fields=("business", "user"), name="business_member_unique")],
            },
        ),
        migrations.CreateModel(
            name="BusinessSubscription",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("plan", models.CharField(choices=[("agency_monthly", "نمایندگی یک‌ماهه"), ("agency_yearly", "نمایندگی یک‌ساله")], max_length=24)),
                ("status", models.CharField(choices=[("pending", "در انتظار بررسی"), ("active", "فعال"), ("rejected", "ردشده"), ("expired", "منقضی"), ("cancelled", "لغوشده")], default="pending", max_length=16)),
                ("starts_at", models.DateTimeField(blank=True, null=True)),
                ("ends_at", models.DateTimeField(blank=True, null=True)),
                ("admin_note", models.TextField(blank=True)),
                ("reviewed_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("business", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="subscriptions", to="businesses.businessprofile", verbose_name="کسب‌وکار")),
                ("requested_by", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="requested_business_subscriptions", to=settings.AUTH_USER_MODEL)),
                ("reviewed_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="reviewed_business_subscriptions", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "ordering": ("-created_at", "-id"),
                "indexes": [
                    models.Index(fields=["status", "-created_at"], name="business_sub_status_idx"),
                    models.Index(fields=["business", "status"], name="business_sub_business_idx"),
                ],
                "constraints": [models.UniqueConstraint(condition=Q(status__in=("pending", "active")), fields=("business",), name="business_one_open_subscription")],
            },
        ),
        migrations.RunPython(create_existing_business_profiles, migrations.RunPython.noop),
    ]
