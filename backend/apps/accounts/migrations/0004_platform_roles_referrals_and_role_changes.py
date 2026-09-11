import secrets

import apps.accounts.models
import django.db.models.deletion
from django.db import migrations, models


REFERRAL_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
ROLE_CHOICES = [
    ("buyer", "خریدار"),
    ("seller", "فروشنده شخصی"),
    ("gallery", "نمایشگاه‌دار"),
    ("agency", "نمایندگی"),
    ("expert", "کارشناس خودرو"),
    ("admin", "مدیر سامانه"),
    ("org", "مدیریت سازمان منطقه آزاد"),
    ("free_zone_supervisor", "نظارت سازمان منطقه آزاد"),
    ("smart_id_operator", "اپراتور شناسنامه هوشمند"),
]


def populate_referral_codes(apps, schema_editor) -> None:
    User = apps.get_model("accounts", "User")
    database_alias = schema_editor.connection.alias
    used_codes = set(
        User.objects.using(database_alias)
        .exclude(referral_code__isnull=True)
        .values_list("referral_code", flat=True)
    )

    for user in User.objects.using(database_alias).filter(
        referral_code__isnull=True
    ):
        while True:
            random_part = "".join(
                secrets.choice(REFERRAL_ALPHABET)
                for _ in range(8)
            )
            code = f"AZ-{random_part}"
            if code not in used_codes:
                break

        user.referral_code = code
        user.save(update_fields=["referral_code"])
        used_codes.add(code)


def clear_referral_codes(apps, schema_editor) -> None:
    User = apps.get_model("accounts", "User")
    User.objects.using(schema_editor.connection.alias).update(
        referral_code=None
    )


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0003_user_is_phone_verified_user_phone_number"),
    ]

    operations = [
        migrations.AlterField(
            model_name="user",
            name="role",
            field=models.CharField(
                blank=True,
                choices=ROLE_CHOICES,
                max_length=32,
                null=True,
                verbose_name="نقش",
            ),
        ),
        migrations.AddField(
            model_name="user",
            name="referral_code",
            field=models.CharField(
                blank=True,
                max_length=16,
                null=True,
                unique=True,
                verbose_name="کد دعوت",
            ),
        ),
        migrations.AddField(
            model_name="user",
            name="referral_credit",
            field=models.PositiveBigIntegerField(
                default=0,
                verbose_name="اعتبار قابل استفاده",
            ),
        ),
        migrations.AddField(
            model_name="user",
            name="referral_earnings",
            field=models.PositiveBigIntegerField(
                default=0,
                verbose_name="مجموع پاداش دعوت",
            ),
        ),
        migrations.AddField(
            model_name="user",
            name="referred_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="referred_users",
                to="accounts.user",
                verbose_name="دعوت‌شده توسط",
            ),
        ),
        migrations.RunPython(
            populate_referral_codes,
            clear_referral_codes,
        ),
        migrations.AlterField(
            model_name="user",
            name="referral_code",
            field=models.CharField(
                default=apps.accounts.models.generate_referral_code,
                editable=False,
                max_length=16,
                unique=True,
                verbose_name="کد دعوت",
            ),
        ),
        migrations.CreateModel(
            name="Referral",
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
                ("code", models.CharField(max_length=16, verbose_name="کد استفاده‌شده")),
                (
                    "reward_type",
                    models.CharField(
                        choices=[
                            ("credit", "اعتبار"),
                            ("discount", "تخفیف"),
                            ("gift", "هدیه"),
                        ],
                        default="credit",
                        max_length=16,
                        verbose_name="نوع پاداش",
                    ),
                ),
                (
                    "reward_value",
                    models.PositiveBigIntegerField(
                        default=500000,
                        verbose_name="مبلغ پاداش",
                    ),
                ),
                (
                    "reward_claimed",
                    models.BooleanField(default=False, verbose_name="دریافت‌شده"),
                ),
                (
                    "claimed_at",
                    models.DateTimeField(blank=True, null=True, verbose_name="زمان دریافت"),
                ),
                (
                    "created_at",
                    models.DateTimeField(auto_now_add=True, verbose_name="زمان ایجاد"),
                ),
                (
                    "referee",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="referral_origin",
                        to="accounts.user",
                        verbose_name="کاربر دعوت‌شده",
                    ),
                ),
                (
                    "referrer",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="referral_rewards",
                        to="accounts.user",
                        verbose_name="دعوت‌کننده",
                    ),
                ),
            ],
            options={
                "ordering": ("-created_at", "-id"),
                "indexes": [
                    models.Index(
                        fields=["referrer", "reward_claimed"],
                        name="account_referral_claim_idx",
                    ),
                ],
            },
        ),
        migrations.CreateModel(
            name="RoleChangeRequest",
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
                    "from_role",
                    models.CharField(
                        choices=ROLE_CHOICES,
                        max_length=32,
                        verbose_name="نقش فعلی",
                    ),
                ),
                (
                    "to_role",
                    models.CharField(
                        choices=ROLE_CHOICES,
                        max_length=32,
                        verbose_name="نقش درخواستی",
                    ),
                ),
                ("reason", models.TextField(verbose_name="دلیل درخواست")),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("pending", "در انتظار بررسی"),
                            ("approved", "تأییدشده"),
                            ("rejected", "ردشده"),
                        ],
                        default="pending",
                        max_length=16,
                        verbose_name="وضعیت",
                    ),
                ),
                ("admin_note", models.TextField(blank=True, verbose_name="یادداشت مدیر")),
                (
                    "reviewed_at",
                    models.DateTimeField(blank=True, null=True, verbose_name="زمان بررسی"),
                ),
                (
                    "created_at",
                    models.DateTimeField(auto_now_add=True, verbose_name="زمان ایجاد"),
                ),
                (
                    "updated_at",
                    models.DateTimeField(auto_now=True, verbose_name="زمان به‌روزرسانی"),
                ),
                (
                    "reviewed_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="reviewed_role_changes",
                        to="accounts.user",
                        verbose_name="بررسی‌شده توسط",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="role_change_requests",
                        to="accounts.user",
                        verbose_name="کاربر",
                    ),
                ),
            ],
            options={
                "ordering": ("-created_at", "-id"),
                "indexes": [
                    models.Index(
                        fields=["status", "created_at"],
                        name="account_role_status_idx",
                    ),
                ],
                "constraints": [
                    models.UniqueConstraint(
                        condition=models.Q(("status", "pending")),
                        fields=("user",),
                        name="account_one_pending_role",
                    ),
                ],
            },
        ),
    ]
