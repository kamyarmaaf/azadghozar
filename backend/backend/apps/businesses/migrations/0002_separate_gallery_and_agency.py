from django.db import migrations, models


def normalize_subscription_plans(apps, schema_editor) -> None:
    BusinessProfile = apps.get_model("businesses", "BusinessProfile")
    BusinessSubscription = apps.get_model("businesses", "BusinessSubscription")

    # In the previous model, an agency application was stored as a gallery
    # profile plus a pending/active ``agency_*`` upgrade subscription.  Keep
    # that intent when splitting the account types: move those applications to
    # the agency queue and require the newly introduced importer documents to
    # be reviewed before verification.
    legacy_agency_business_ids = set(
        BusinessSubscription.objects.filter(
            business__kind="gallery",
            plan__in=("agency_monthly", "agency_yearly"),
            status__in=("pending", "active"),
        ).values_list("business_id", flat=True)
    )
    for business in BusinessProfile.objects.filter(
        id__in=legacy_agency_business_ids
    ).select_related("owner"):
        business.kind = "agency"
        business.verification_status = "pending"
        business.verified_at = None
        business.verification_note = (
            "اطلاعات و مدارک شرکت واردکننده را تکمیل کنید."
        )
        business.save(
            update_fields=(
                "kind",
                "verification_status",
                "verified_at",
                "verification_note",
                "updated_at",
            )
        )
        if business.owner.role != "agency":
            business.owner.role = "agency"
            business.owner.save(update_fields=("role",))

    subscriptions = BusinessSubscription.objects.select_related(
        "business"
    ).iterator(chunk_size=1000)
    for subscription in subscriptions:
        suffix = "yearly" if subscription.plan.endswith("yearly") else "monthly"
        expected_plan = f"{subscription.business.kind}_{suffix}"
        if subscription.plan != expected_plan:
            subscription.plan = expected_plan
            subscription.save(update_fields=("plan",))


class Migration(migrations.Migration):
    dependencies = [
        ("businesses", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="businessprofile",
            name="authorized_representative_name",
            field=models.CharField(
                blank=True,
                max_length=200,
                verbose_name="نماینده قانونی شرکت",
            ),
        ),
        migrations.AddField(
            model_name="businessprofile",
            name="business_card_number",
            field=models.CharField(
                blank=True,
                max_length=80,
                verbose_name="شماره کارت بازرگانی",
            ),
        ),
        migrations.AddField(
            model_name="businessprofile",
            name="company_registration_number",
            field=models.CharField(
                blank=True,
                max_length=80,
                verbose_name="شماره ثبت شرکت",
            ),
        ),
        migrations.AddField(
            model_name="businessprofile",
            name="economic_code",
            field=models.CharField(
                blank=True,
                max_length=32,
                verbose_name="کد اقتصادی",
            ),
        ),
        migrations.AddField(
            model_name="businessprofile",
            name="import_license_expires_at",
            field=models.DateField(
                blank=True,
                null=True,
                verbose_name="تاریخ اعتبار مجوز واردات",
            ),
        ),
        migrations.AddField(
            model_name="businessprofile",
            name="import_license_issuer",
            field=models.CharField(
                blank=True,
                max_length=200,
                verbose_name="مرجع صادرکننده مجوز واردات",
            ),
        ),
        migrations.AddField(
            model_name="businessprofile",
            name="import_license_number",
            field=models.CharField(
                blank=True,
                max_length=80,
                verbose_name="شماره مجوز واردات",
            ),
        ),
        migrations.AddField(
            model_name="businessprofile",
            name="license_expires_at",
            field=models.DateField(
                blank=True,
                null=True,
                verbose_name="تاریخ اعتبار مجوز",
            ),
        ),
        migrations.AddField(
            model_name="businessprofile",
            name="license_issuer",
            field=models.CharField(
                blank=True,
                max_length=200,
                verbose_name="مرجع صادرکننده مجوز",
            ),
        ),
        migrations.AddField(
            model_name="businessprofile",
            name="postal_code",
            field=models.CharField(
                blank=True,
                max_length=20,
                verbose_name="کد پستی",
            ),
        ),
        migrations.AddField(
            model_name="businessprofile",
            name="represented_brands",
            field=models.JSONField(
                blank=True,
                default=list,
                verbose_name="برندهای وارداتی",
            ),
        ),
        migrations.AlterField(
            model_name="businesssubscription",
            name="plan",
            field=models.CharField(
                choices=[
                    ("gallery_monthly", "اشتراک نمایشگاه یک‌ماهه"),
                    ("gallery_yearly", "اشتراک نمایشگاه یک‌ساله"),
                    ("agency_monthly", "اشتراک نمایندگی یک‌ماهه"),
                    ("agency_yearly", "اشتراک نمایندگی یک‌ساله"),
                ],
                max_length=24,
            ),
        ),
        migrations.RunPython(
            normalize_subscription_plans,
            migrations.RunPython.noop,
        ),
    ]
