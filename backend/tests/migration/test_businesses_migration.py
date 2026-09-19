import pytest
from django.db import connection
from django.db.migrations.executor import MigrationExecutor


PREVIOUS_MIGRATION = ("businesses", "0001_initial")
TARGET_MIGRATION = ("businesses", "0002_separate_gallery_and_agency")


@pytest.mark.migration
@pytest.mark.django_db(transaction=True)
def test_legacy_agency_request_moves_out_of_gallery_queue(
    django_db_blocker,
) -> None:
    with django_db_blocker.unblock():
        executor = MigrationExecutor(connection)
        executor.migrate([PREVIOUS_MIGRATION])

        old_apps = executor.loader.project_state([PREVIOUS_MIGRATION]).apps
        OldUser = old_apps.get_model("accounts", "User")
        OldBusiness = old_apps.get_model("businesses", "BusinessProfile")
        OldSubscription = old_apps.get_model(
            "businesses",
            "BusinessSubscription",
        )

        owner = OldUser.objects.create(
            username="legacy-agency-owner",
            role="gallery",
        )
        business = OldBusiness.objects.create(
            owner=owner,
            kind="gallery",
            name="شرکت واردکننده قدیمی",
            slug="legacy-agency",
            verification_status="verified",
        )
        OldSubscription.objects.create(
            business=business,
            requested_by=owner,
            plan="agency_yearly",
            status="pending",
        )

        executor = MigrationExecutor(connection)
        executor.migrate([TARGET_MIGRATION])

        new_apps = executor.loader.project_state([TARGET_MIGRATION]).apps
        NewUser = new_apps.get_model("accounts", "User")
        NewBusiness = new_apps.get_model("businesses", "BusinessProfile")
        NewSubscription = new_apps.get_model(
            "businesses",
            "BusinessSubscription",
        )

        migrated_owner = NewUser.objects.get(pk=owner.pk)
        migrated_business = NewBusiness.objects.get(pk=business.pk)
        migrated_subscription = NewSubscription.objects.get(
            business_id=business.pk
        )

        assert migrated_owner.role == "agency"
        assert migrated_business.kind == "agency"
        assert migrated_business.verification_status == "pending"
        assert migrated_business.verified_at is None
        assert migrated_business.verification_note
        assert migrated_subscription.plan == "agency_yearly"

        executor = MigrationExecutor(connection)
        executor.migrate(executor.loader.graph.leaf_nodes())
