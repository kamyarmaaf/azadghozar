from uuid import uuid4

from django.conf import settings
from django.contrib.postgres.indexes import GinIndex
from django.db import models


class ServiceRequest(models.Model):
    class ServiceType(models.TextChoices):
        TRANSFER = "transfer", "انتقال مالکیت"
        TRANSPORT = "transport", "حمل‌ونقل"
        INSPECTION = "inspection", "بازرسی خودرو"
        CONSULTATION = "consultation", "مشاوره تخصصی"
        DOCUMENT_CHECK = "document_check", "استعلام مدارک"
        STATUS_CHECK = "status_check", "استعلام وضعیت"
        BUY_ASSIST = "buy_assist", "همراهی در خرید"
        SELL_ASSIST = "sell_assist", "همراهی در فروش"

    class Status(models.TextChoices):
        NEW = "new", "جدید"
        REVIEWING = "reviewing", "در حال بررسی"
        ASSIGNED = "assigned", "ارجاع‌شده"
        IN_PROGRESS = "in_progress", "در حال انجام"
        COMPLETED = "completed", "تکمیل‌شده"
        CANCELLED = "cancelled", "لغوشده"

    class Priority(models.TextChoices):
        NORMAL = "normal", "عادی"
        HIGH = "high", "بالا"
        URGENT = "urgent", "فوری"

    public_id = models.UUIDField(
        default=uuid4,
        unique=True,
        editable=False,
        verbose_name="شناسه پیگیری",
    )
    requester = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="service_requests",
        verbose_name="درخواست‌دهنده",
    )
    listing = models.ForeignKey(
        "catalog.VehicleListing",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="service_requests",
        verbose_name="آگهی مرتبط",
    )
    assigned_expert = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_service_requests",
        verbose_name="کارشناس مسئول",
    )
    service_type = models.CharField(
        max_length=24,
        choices=ServiceType.choices,
        verbose_name="نوع خدمت",
    )
    contact_name = models.CharField(max_length=120, verbose_name="نام تماس")
    contact_phone = models.CharField(max_length=16, verbose_name="شماره تماس")
    vehicle_type = models.CharField(max_length=64, verbose_name="نوع خودرو")
    details = models.TextField(blank=True, verbose_name="جزئیات")
    status = models.CharField(
        max_length=16,
        choices=Status.choices,
        default=Status.NEW,
        verbose_name="وضعیت",
    )
    priority = models.CharField(
        max_length=12,
        choices=Priority.choices,
        default=Priority.NORMAL,
        verbose_name="اولویت",
    )
    scheduled_for = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="زمان برنامه‌ریزی‌شده",
    )
    admin_note = models.TextField(blank=True, verbose_name="یادداشت مدیر")
    expert_note = models.TextField(blank=True, verbose_name="گزارش کارشناس")
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at", "-id")
        indexes = [
            models.Index(
                fields=("status", "-created_at", "-id"),
                name="svc_status_feed_idx",
            ),
            models.Index(
                fields=("service_type", "status", "-created_at", "-id"),
                name="svc_type_status_idx",
            ),
            models.Index(
                fields=("requester", "-created_at", "-id"),
                name="svc_requester_feed_idx",
            ),
            models.Index(
                fields=("assigned_expert", "status", "-created_at", "-id"),
                name="svc_expert_status_idx",
            ),
            models.Index(fields=("contact_phone",), name="svc_phone_idx"),
            GinIndex(
                fields=("contact_name",),
                name="svc_name_trgm_idx",
                opclasses=("gin_trgm_ops",),
            ),
        ]

    def __str__(self) -> str:
        return f"{self.get_service_type_display()} - {self.contact_name}"


class ServiceRequestEvent(models.Model):
    service_request = models.ForeignKey(
        ServiceRequest,
        on_delete=models.CASCADE,
        related_name="events",
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="service_request_events",
    )
    from_status = models.CharField(max_length=16, blank=True)
    to_status = models.CharField(max_length=16)
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at", "-id")
        indexes = [
            models.Index(
                fields=("service_request", "-created_at", "-id"),
                name="svc_event_feed_idx",
            )
        ]

    def __str__(self) -> str:
        return f"{self.service_request_id}: {self.from_status} -> {self.to_status}"

