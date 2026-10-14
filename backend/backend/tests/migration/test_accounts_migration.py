import pytest
from django.db import connection
from django.db.migrations.executor import MigrationExecutor


TARGET_MIGRATION = (
    "accounts",
    "0003_user_is_phone_verified_user_phone_number",
)


@pytest.mark.migration
@pytest.mark.django_db(transaction=True)
def test_phone_fields_migration_preserves_existing_users(
    django_db_blocker,
) -> None:
    with django_db_blocker.unblock():
        executor = MigrationExecutor(connection)
        target_migration = executor.loader.get_migration(*TARGET_MIGRATION)

        accounts_dependencies = [
            dependency
            for dependency in target_migration.dependencies
            if dependency[0] == "accounts"
        ]
        assert accounts_dependencies, (
            "The target migration must depend on an earlier accounts migration."
        )

        previous_target = accounts_dependencies[0]
        executor.migrate([previous_target])

        old_apps = executor.loader.project_state(
            [previous_target]
        ).apps
        OldUser = old_apps.get_model("accounts", "User")

        old_user = OldUser.objects.create(
            username="migration-test-admin",
            is_staff=True,
            is_superuser=True,
        )
        old_pk = old_user.pk

        executor = MigrationExecutor(connection)
        executor.migrate([TARGET_MIGRATION])

        new_apps = executor.loader.project_state(
            [TARGET_MIGRATION]
        ).apps
        NewUser = new_apps.get_model("accounts", "User")
        migrated_user = NewUser.objects.get(pk=old_pk)

        assert migrated_user.phone_number is None
        assert migrated_user.is_phone_verified is False

        # Restore all apps to their latest migration state for following tests.
        executor = MigrationExecutor(connection)
        executor.migrate(executor.loader.graph.leaf_nodes())
