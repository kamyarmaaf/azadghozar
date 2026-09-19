import pytest
from django.urls import reverse

from apps.accounts.models import User


@pytest.mark.regression
@pytest.mark.django_db
def test_user_change_page_renders_with_non_editable_referral_code(client) -> None:
    admin_user = User.objects.create_superuser(
        username="admin-regression",
        phone_number="+989123450001",
        password="strong-test-password",
    )
    agency_user = User.objects.create_user(
        username="+989123450002",
        phone_number="+989123450002",
        role=User.Role.AGENCY,
    )
    client.force_login(admin_user)

    response = client.get(
        reverse("admin:accounts_user_change", args=(agency_user.pk,))
    )

    assert response.status_code == 200
    assert agency_user.referral_code in response.content.decode()
