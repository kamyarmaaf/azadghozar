import pytest
from django.urls import reverse

from apps.accounts.models import User
from apps.businesses.models import BusinessProfile
from apps.service_requests.models import ServiceRequest


def create_role_user(phone: str, role: str) -> User:
    return User.objects.create_user(
        username=phone,
        phone_number=phone,
        role=role,
        is_phone_verified=True,
    )


def create_business(user: User, kind: str, status: str) -> BusinessProfile:
    return BusinessProfile.objects.create(
        owner=user,
        kind=kind,
        name=f"business-{user.pk}",
        slug=f"business-{user.pk}",
        verification_status=status,
    )


@pytest.mark.api
@pytest.mark.django_db
def test_dashboard_summary_requires_authentication(api_client) -> None:
    response = api_client.get(reverse("accounts:dashboard-summary"))

    assert response.status_code == 401


@pytest.mark.api
@pytest.mark.django_db
def test_buyer_dashboard_uses_all_real_service_requests(
    api_client,
    buyer_user,
) -> None:
    for request_status in (
        ServiceRequest.Status.NEW,
        ServiceRequest.Status.COMPLETED,
    ):
        ServiceRequest.objects.create(
            requester=buyer_user,
            service_type=ServiceRequest.ServiceType.INSPECTION,
            contact_name="خریدار",
            contact_phone="+989121111111",
            vehicle_type="سواری",
            status=request_status,
        )
    api_client.force_authenticate(user=buyer_user)

    response = api_client.get(reverse("accounts:dashboard-summary"))

    assert response.status_code == 200
    assert response.data["role"] == User.Role.BUYER
    assert response.data["metrics"] == {
        "favorite_count": 0,
        "service_request_count": 2,
        "open_service_request_count": 1,
    }


@pytest.mark.api
@pytest.mark.django_db
@pytest.mark.parametrize(
    ("role", "kind"),
    (
        (User.Role.GALLERY, BusinessProfile.Kind.GALLERY),
        (User.Role.AGENCY, BusinessProfile.Kind.AGENCY),
    ),
)
def test_business_dashboard_keeps_gallery_and_agency_separate(
    api_client,
    role,
    kind,
) -> None:
    user = create_role_user(
        "+989130000001" if kind == "gallery" else "+989130000002",
        role,
    )
    business = create_business(
        user,
        kind,
        BusinessProfile.VerificationStatus.VERIFIED,
    )
    api_client.force_authenticate(user=user)

    response = api_client.get(reverse("accounts:dashboard-summary"))

    assert response.status_code == 200
    assert response.data["scope"] == "business"
    assert response.data["business"]["id"] == business.pk
    assert response.data["business"]["kind"] == kind
    assert response.data["metrics"]["listing_count"] == 0


@pytest.mark.api
@pytest.mark.django_db
def test_org_dashboard_returns_platform_counts_without_mock_data(api_client) -> None:
    gallery_user = create_role_user("+989130000003", User.Role.GALLERY)
    agency_user = create_role_user("+989130000004", User.Role.AGENCY)
    create_business(
        gallery_user,
        BusinessProfile.Kind.GALLERY,
        BusinessProfile.VerificationStatus.VERIFIED,
    )
    create_business(
        agency_user,
        BusinessProfile.Kind.AGENCY,
        BusinessProfile.VerificationStatus.PENDING,
    )
    org_user = create_role_user("+989130000005", User.Role.ORG)
    api_client.force_authenticate(user=org_user)

    response = api_client.get(reverse("accounts:dashboard-summary"))

    assert response.status_code == 200
    assert response.data["scope"] == "platform_read_only"
    assert response.data["metrics"]["verified_gallery_count"] == 1
    assert response.data["metrics"]["verified_agency_count"] == 0
    assert response.data["metrics"]["pending_business_count"] == 1


@pytest.mark.api
@pytest.mark.django_db
def test_admin_role_without_staff_flag_cannot_read_admin_summary(api_client) -> None:
    user = create_role_user("+989130000006", User.Role.ADMIN)
    api_client.force_authenticate(user=user)

    response = api_client.get(reverse("accounts:dashboard-summary"))

    assert response.status_code == 403
