import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("service_requests", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="ListingVisitRequest",
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
                ("contact_name", models.CharField(max_length=120, verbose_name="نام تماس")),
                ("contact_phone", models.CharField(max_length=16, verbose_name="شماره تماس")),
                ("scheduled_for", models.DateTimeField(verbose_name="زمان پیشنهادی بازدید")),
                (
                    "requester_note",
                    models.TextField(blank=True, max_length=1000, verbose_name="توضیح متقاضی"),
                ),
                (
                    "owner_note",
                    models.TextField(blank=True, max_length=1000, verbose_name="پاسخ مالک"),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("pending", "در انتظار پاسخ"),
                            ("confirmed", "تأییدشده"),
                            ("rejected", "ردشده"),
                            ("cancelled", "لغوشده"),
                            ("completed", "انجام‌شده"),
                        ],
                        db_index=True,
                        default="pending",
                        max_length=16,
                        verbose_name="وضعیت",
                    ),
                ),
                ("responded_at", models.DateTimeField(blank=True, null=True, verbose_name="زمان پاسخ")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "listing",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="visit_requests",
                        to="catalog.vehiclelisting",
                        verbose_name="آگهی",
                    ),
                ),
                (
                    "requester",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="listing_visit_requests",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="درخواست‌دهنده",
                    ),
                ),
            ],
            options={
                "ordering": ("-created_at", "-id"),
                "verbose_name": "درخواست بازدید حضوری",
                "verbose_name_plural": "درخواست‌های بازدید حضوری",
                "indexes": [
                    models.Index(
                        fields=["listing", "status", "scheduled_for"],
                        name="visit_listing_slot_idx",
                    ),
                    models.Index(
                        fields=["requester", "-created_at", "-id"],
                        name="visit_requester_feed_idx",
                    ),
                ],
                "constraints": [
                    models.UniqueConstraint(
                        condition=models.Q(status__in=("pending", "confirmed")),
                        fields=("listing", "scheduled_for"),
                        name="visit_open_listing_slot_unique",
                    ),
                ],
            },
        ),
    ]
