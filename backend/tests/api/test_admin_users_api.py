import pytest
from django.urls import reverse

from apps.accounts.models import User


@pytest.mark.api
@pytest.mark.django_db
def test_user_directory_is_staff_only(api_client, buyer_user, staff_user):
    url = reverse("accounts:admin-users")
    assert api_client.get(url).status_code == 401
    api_client.force_authenticate(user=buyer_user)
    assert api_client.get(url).status_code == 403
    api_client.force_authenticate(user=staff_user)
    assert api_client.get(url).status_code == 200


@pytest.mark.api
@pytest.mark.django_db
def test_user_directory_paginates_without_a_count_query(
    api_client, staff_user, django_assert_max_num_queries
):
    users = [
        User(username=f"buyer-{index}", role=User.Role.BUYER)
        for index in range(57)
    ]
    User.objects.bulk_create(users)
    api_client.force_authenticate(user=staff_user)
    url = reverse("accounts:admin-users")
    with django_assert_max_num_queries(1):
        first = api_client.get(url, {"page_size": 20, "role": "buyer"})
    assert first.status_code == 200
    assert len(first.data["results"]) == 20
    assert first.data["next"]
    assert "count" not in first.data
    with django_assert_max_num_queries(1):
        second = api_client.get(first.data["next"])
    assert second.status_code == 200
    assert len(second.data["results"]) == 20
    assert set(item["id"] for item in first.data["results"]).isdisjoint(
        item["id"] for item in second.data["results"]
    )


@pytest.mark.api
@pytest.mark.django_db
def test_search_uses_exact_normalized_phone_and_status_filter(api_client, staff_user):
    person = User.objects.create_user(
        username="seller-001",
        phone_number="+989121234567",
        role=User.Role.SELLER,
        is_active=False,
        first_name="سارا",
    )
    api_client.force_authenticate(user=staff_user)
    response = api_client.get(
        reverse("accounts:admin-users"),
        {"phone": "۰۹۱۲۱۲۳۴۵۶۷", "role": "seller", "active": "false"},
    )
    assert response.status_code == 200
    assert [item["id"] for item in response.data["results"]] == [person.id]
    assert response.data["results"][0]["display_name"] == "سارا"


@pytest.mark.api
@pytest.mark.django_db
def test_admin_user_details_are_read_only_and_exclude_secrets(api_client, staff_user):
    member = User.objects.create_user(username="other-user", role=User.Role.BUYER)
    url = reverse("accounts:admin-user-detail", kwargs={"pk": member.pk})
    assert api_client.get(url).status_code == 401
    api_client.force_authenticate(user=member)
    assert api_client.get(url).status_code == 403
    api_client.force_authenticate(user=staff_user)
    response = api_client.get(url)
    assert response.status_code == 200
    assert set(response.data) == {
        "id", "display_name", "phone_number", "role", "role_label",
        "is_phone_verified", "is_active", "is_staff", "date_joined",
    }
    assert api_client.patch(url, {"is_staff": False}).status_code == 405
    assert api_client.post(reverse("accounts:admin-users"), {"is_staff": True}).status_code == 405


@pytest.mark.api
@pytest.mark.django_db
def test_admin_users_rejects_invalid_filters_and_caps_page_size(api_client, staff_user):
    User.objects.bulk_create(
        [User(username=f"bulk-user-{index}") for index in range(58)]
    )
    api_client.force_authenticate(user=staff_user)
    url = reverse("accounts:admin-users")
    for params in ({"role": "superuser"}, {"active": "yes"}, {"phone": "123"}):
        assert api_client.get(url, params).status_code == 400
    response = api_client.get(url, {"page_size": 5000})
    assert response.status_code == 200
    assert len(response.data["results"]) == 50
