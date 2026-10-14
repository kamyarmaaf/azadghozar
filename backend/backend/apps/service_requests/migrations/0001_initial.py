import uuid

import django.contrib.postgres.indexes
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("accounts", "0009_user_role_active_index"),
        ("catalog", "0007_listing_business"),
    ]

    operations = [
        migrations.CreateModel(
            name="ServiceRequest",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "public_id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        unique=True,
                        verbose_name="شناسه پیگیری",
                    ),
                ),
                (
                    "service_type",
                    models.CharField(
                        choices=[
                            ("transfer", "انتقال مالکیت"),
                            ("transport", "حمل‌ونقل"),
                            ("inspection", "بازرسی خودرو"),
                            ("consultation", "مشاوره تخصصی"),
                            ("document_check", "استعلام مدارک"),
                            ("status_check", "استعلام وضعیت"),
                            ("buy_assist", "همراهی در خرید"),
                            ("sell_assist", "همراهی در فروش"),
                        ],
                        max_length=24,
                        verbose_name="نوع خدمت",
                    ),
                ),
                (
                    "contact_name",
                    models.CharField(max_length=120, verbose_name="نام تماس"),
                ),
                (
                    "contact_phone",
                    models.CharField(max_length=16, verbose_name="شماره تماس"),
                ),
                (
                    "vehicle_type",
                    models.CharField(max_length=64, verbose_name="نوع خودرو"),
                ),
                ("details", models.TextField(blank=True, verbose_name="جزئیات")),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("new", "جدید"),
                            ("reviewing", "در حال بررسی"),
                            ("assigned", "ارجاع‌شده"),
                            ("in_progress", "در حال انجام"),
                            ("completed", "تکمیل‌شده"),
                            ("cancelled", "لغوشده"),
                        ],
                        default="new",
                        max_length=16,
                        verbose_name="وضعیت",
                    ),
                ),
                (
                    "priority",
                    models.CharField(
                        choices=[
                            ("normal", "عادی"),
                            ("high", "بالا"),
                            ("urgent", "فوری"),
                        ],
                        default="normal",
                        max_length=12,
                        verbose_name="اولویت",
                    ),
                ),
                (
                    "scheduled_for",
                    models.DateTimeField(
                        blank=True,
                        null=True,
                        verbose_name="زمان برنامه‌ریزی‌شده",
                    ),
                ),
                ("admin_note", models.TextField(blank=True, verbose_name="یادداشت مدیر")),
                ("expert_note", models.TextField(blank=True, verbose_name="گزارش کارشناس")),
                ("completed_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "assigned_expert",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="assigned_service_requests",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="کارشناس مسئول",
                    ),
                ),
                (
                    "listing",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="service_requests",
                        to="catalog.vehiclelisting",
                        verbose_name="آگهی مرتبط",
                    ),
                ),
                (
                    "requester",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="service_requests",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="درخواست‌دهنده",
                    ),
                ),
            ],
            options={
                "ordering": ("-created_at", "-id"),
                "indexes": [
                    models.Index(
                        fields=["status", "-created_at", "-id"],
                        name="svc_status_feed_idx",
                    ),
                    models.Index(
                        fields=["service_type", "status", "-created_at", "-id"],
                        name="svc_type_status_idx",
                    ),
                    models.Index(
                        fields=["requester", "-created_at", "-id"],
                        name="svc_requester_feed_idx",
                    ),
                    models.Index(
                        fields=["assigned_expert", "status", "-created_at", "-id"],
                        name="svc_expert_status_idx",
                    ),
                    models.Index(fields=["contact_phone"], name="svc_phone_idx"),
                    django.contrib.postgres.indexes.GinIndex(
                        fields=["contact_name"],
                        name="svc_name_trgm_idx",
                        opclasses=("gin_trgm_ops",),
                    ),
                ],
            },
        ),
        migrations.CreateModel(
            name="ServiceRequestEvent",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("from_status", models.CharField(blank=True, max_length=16)),
                ("to_status", models.CharField(max_length=16)),
                ("note", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "actor",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="service_request_events",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "service_request",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="events",
                        to="service_requests.servicerequest",
                    ),
                ),
            ],
            options={
                "ordering": ("-created_at", "-id"),
                "indexes": [
                    models.Index(
                        fields=["service_request", "-created_at", "-id"],
                        name="svc_event_feed_idx",
                    )
                ],
            },
        ),
    ]
