from django.db import migrations


def clear_cross_kind_documents(apps, schema_editor) -> None:
    BusinessProfile = apps.get_model("businesses", "BusinessProfile")
    BusinessProfile.objects.filter(kind="gallery").update(
        company_registration_number="",
        economic_code="",
        authorized_representative_name="",
        import_license_number="",
        import_license_issuer="",
        import_license_expires_at=None,
        business_card_number="",
        represented_brands=[],
    )
    BusinessProfile.objects.filter(kind="agency").update(
        license_number="",
        license_issuer="",
        license_expires_at=None,
    )


class Migration(migrations.Migration):
    dependencies = [("businesses", "0002_separate_gallery_and_agency")]

    operations = [
        migrations.RunPython(
            clear_cross_kind_documents,
            migrations.RunPython.noop,
        ),
    ]
