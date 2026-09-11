import pytest
from django.urls import reverse

from apps.accounts.models import User
from apps.service_requests.models import ServiceRequest, ServiceRequestEvent


def request_payload(**overrides) -> dict:
    payload = {
        "service_type": ServiceRequest.ServiceType.INSPECTION,
        "contact_name": "علی محمدی",
        "contact_phone": "09121112233",
        "vehicle_type": "سدان",
        "details": "بررسی فنی و بدنه",
    }
    payload.update(overrides)
    return payload


def create_request(*, requester=None, assigned_expert=None, **overrides):
    data = {
        "requester": requester,
        "assigned_expert": assigned_expert,
        "service_type": ServiceRequest.ServiceType.INSPECTION,
        "contact_name": "کاربر تست",
        "contact_phone": "+989121112233",
        "vehicle_type": "سدان",
        "details": "درخواست تست",
    }
    data.update(overrides)
    return ServiceRequest.objects.create(**data)


def create_expert(phone: str = "+989121111999") -> User:
    return User.objects.create_user(
        username=phone,
        phone_number=phone,
        role=User.Role.EXPERT,
        is_phone_verified=True,
        first_name="کارشناس",
        last_name="آزادگذر",
    )


@pytest.mark.api
@pytest.mark.django_db
def test_anonymous_user_can_create_real_service_request(api_client) -> None:
    response = api_client.post(
        reverse("service_requests:create"),
        request_payload(),
        format="json",
    )

    assert response.status_code == 201
    assert response.data["status"] == ServiceRequest.Status.NEW
    assert response.data["contact_phone"] == "+989121112233"
    assert response.data["id"]
    service_request = ServiceRequest.objects.get()
    assert service_request.requester is None
    assert ServiceRequestEvent.objects.filter(
        service_request=service_request,
        to_status=ServiceRequest.Status.NEW,
    ).exists()


@pytest.mark.api
@pytest.mark.django_db
def test_service_request_rejects_invalid_phone(api_client) -> None:
    response = api_client.post(
        reverse("service_requests:create"),
        request_payload(contact_phone="123"),
        format="json",
    )

    assert response.status_code == 400
    assert ServiceRequest.objects.count() == 0


@pytest.mark.api
@pytest.mark.django_db
def test_authenticated_request_is_linked_and_mine_is_private(
    api_client,
    buyer_user,
) -> None:
    other = User.objects.create_user(username="other", role=User.Role.BUYER)
    create_request(requester=other)
    api_client.force_authenticate(user=buyer_user)

    created = api_client.post(
        reverse("service_requests:create"),
        request_payload(),
        format="json",
    )
    response = api_client.get(reverse("service_requests:mine"))

    assert created.status_code == 201
    assert response.status_code == 200
    assert len(response.data["results"]) == 1
    assert response.data["results"][0]["id"] == created.data["id"]
    assert ServiceRequest.objects.get(public_id=created.data["id"]).requester == buyer_user


@pytest.mark.api
@pytest.mark.django_db
def test_my_requests_requires_authentication(api_client) -> None:
    response = api_client.get(reverse("service_requests:mine"))

    assert response.status_code == 401


@pytest.mark.api
@pytest.mark.django_db
def test_admin_list_is_protected_and_filterable(
    api_client,
    buyer_user,
    staff_user,
) -> None:
    create_request(service_type=ServiceRequest.ServiceType.INSPECTION)
    create_request(service_type=ServiceRequest.ServiceType.TRANSPORT)
    api_client.force_authenticate(user=buyer_user)
    forbidden = api_client.get(reverse("service_requests:admin-list"))
    api_client.force_authenticate(user=staff_user)
    response = api_client.get(
        reverse("service_requests:admin-list"),
        {"service_type": ServiceRequest.ServiceType.TRANSPORT},
    )

    assert forbidden.status_code == 403
    assert response.status_code == 200
    assert len(response.data["results"]) == 1
    assert response.data["results"][0]["service_type"] == "transport"


@pytest.mark.api
@pytest.mark.django_db
def test_admin_can_assign_only_an_active_expert(
    api_client,
    buyer_user,
    staff_user,
) -> None:
    service_request = create_request()
    expert = create_expert()
    api_client.force_authenticate(user=staff_user)
    url = reverse(
        "service_requests:admin-detail",
        kwargs={"request_id": service_request.public_id},
    )

    invalid = api_client.patch(
        url,
        {"assigned_expert": buyer_user.pk},
        format="json",
    )
    response = api_client.patch(
        url,
        {"assigned_expert": expert.pk, "priority": "high"},
        format="json",
    )

    assert invalid.status_code == 400
    assert response.status_code == 200
    assert response.data["status"] == ServiceRequest.Status.ASSIGNED
    assert response.data["assigned_expert"] == expert.pk
    service_request.refresh_from_db()
    assert service_request.priority == ServiceRequest.Priority.HIGH


@pytest.mark.api
@pytest.mark.django_db
def test_expert_sees_only_assigned_requests_and_completes_work(
    api_client,
) -> None:
    expert = create_expert()
    assigned = create_request(
        assigned_expert=expert,
        status=ServiceRequest.Status.ASSIGNED,
    )
    create_request(status=ServiceRequest.Status.ASSIGNED)
    api_client.force_authenticate(user=expert)

    response = api_client.get(reverse("service_requests:expert-list"))
    detail_url = reverse(
        "service_requests:expert-detail",
        kwargs={"request_id": assigned.public_id},
    )
    started = api_client.patch(
        detail_url,
        {"status": "in_progress", "expert_note": "بازرسی شروع شد"},
        format="json",
    )
    completed = api_client.patch(
        detail_url,
        {"status": "completed", "expert_note": "خودرو بررسی شد"},
        format="json",
    )

    assert response.status_code == 200
    assert [item["id"] for item in response.data["results"]] == [
        str(assigned.public_id)
    ]
    assert started.status_code == 200
    assert completed.status_code == 200
    assert completed.data["completed_at"] is not None


@pytest.mark.api
@pytest.mark.django_db
def test_completed_request_cannot_return_to_progress(
    api_client,
    staff_user,
) -> None:
    service_request = create_request(status=ServiceRequest.Status.COMPLETED)
    api_client.force_authenticate(user=staff_user)
    response = api_client.patch(
        reverse(
            "service_requests:admin-detail",
            kwargs={"request_id": service_request.public_id},
        ),
        {"status": "in_progress"},
        format="json",
    )

    assert response.status_code == 400
    service_request.refresh_from_db()
    assert service_request.status == ServiceRequest.Status.COMPLETED


@pytest.mark.api
@pytest.mark.django_db
def test_request_cannot_be_assigned_without_expert(
    api_client,
    staff_user,
) -> None:
    service_request = create_request()
    api_client.force_authenticate(user=staff_user)
    response = api_client.patch(
        reverse(
            "service_requests:admin-detail",
            kwargs={"request_id": service_request.public_id},
        ),
        {"status": "assigned"},
        format="json",
    )

    assert response.status_code == 400
    service_request.refresh_from_db()
    assert service_request.status == ServiceRequest.Status.NEW


@pytest.mark.api
@pytest.mark.django_db
def test_admin_cursor_page_query_count_is_constant(
    api_client,
    staff_user,
    django_assert_max_num_queries,
) -> None:
    for index in range(25):
        create_request(contact_name=f"درخواست {index}")
    api_client.force_authenticate(user=staff_user)

    with django_assert_max_num_queries(1):
        response = api_client.get(
            reverse("service_requests:admin-list"),
            {"page_size": 20},
        )

    assert response.status_code == 200
    assert len(response.data["results"]) == 20
    assert response.data["next"] is not None
