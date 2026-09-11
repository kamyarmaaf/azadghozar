import pytest
from django.urls import reverse
from django.utils import timezone

from apps.accounts.models import User
from apps.businesses.models import (
    BusinessMembership,
    BusinessProfile,
    BusinessSubscription,
)
from apps.catalog.models import VehicleListing


def create_business(
    *,
    phone: str,
    name: str,
    verification_status: str = BusinessProfile.VerificationStatus.VERIFIED,
) -> tuple[User, BusinessProfile]:
    owner = User.objects.create_user(
        username=phone,
        phone_number=phone,
        role=User.Role.GALLERY,
        business_name=name,
        is_phone_verified=True,
    )
    business = BusinessProfile.objects.create(
        owner=owner,
        name=name,
        slug=f"business-{owner.pk}",
        city="تهران",
        license_number="LIC-123",
        national_id="1234567890",
        verification_status=verification_status,
        verified_at=(
            timezone.now()
            if verification_status == BusinessProfile.VerificationStatus.VERIFIED
            else None
        ),
    )
    return owner, business


def create_listing(owner: User, business: BusinessProfile) -> VehicleListing:
    return VehicleListing.objects.create(
        owner=owner,
        business=business,
        status=VehicleListing.Status.ACTIVE,
        brand_name="Toyota",
        model_name="Camry",
        production_year=2024,
        plate_type=VehicleListing.PlateType.NATIONAL,
        province="تهران",
        city="تهران",
        color="سفید",
        body_type="سدان",
        transmission="automatic",
        fuel_type="gasoline",
        drivetrain="fwd",
        mileage=1000,
        condition=VehicleListing.Condition.LIKE_NEW,
        body_condition=VehicleListing.BodyCondition.NO_PAINT,
        chassis_condition=VehicleListing.ChassisCondition.SEALED,
        engine_condition=VehicleListing.EngineCondition.HEALTHY,
        ownership_status=VehicleListing.OwnershipStatus.OWNER,
        price_type=VehicleListing.PriceType.FIXED,
        price=5_000_000_000,
        contact_number="09121111111",
    )


@pytest.mark.api
@pytest.mark.django_db
def test_public_directory_is_cursor_paginated_and_hides_unverified(
    api_client,
) -> None:
    owner, verified = create_business(
        phone="+989120000001",
        name="تأیید شده",
    )
    create_business(
        phone="+989120000002",
        name="در انتظار",
        verification_status=BusinessProfile.VerificationStatus.PENDING,
    )
    create_listing(owner, verified)

    response = api_client.get(reverse("businesses:business-list"))

    assert response.status_code == 200
    assert set(response.data) == {"next", "previous", "results"}
    assert [item["slug"] for item in response.data["results"]] == [
        verified.slug
    ]
    assert response.data["results"][0]["listing_count"] == 1


@pytest.mark.api
@pytest.mark.django_db
def test_public_directory_query_count_stays_constant(
    api_client,
    django_assert_max_num_queries,
) -> None:
    for index in range(15):
        owner, business = create_business(
            phone=f"+98913000{index:04d}",
            name=f"نمایشگاه {index}",
        )
        create_listing(owner, business)

    with django_assert_max_num_queries(2):
        response = api_client.get(
            reverse("businesses:business-list"),
            {"page_size": 12},
        )

    assert response.status_code == 200
    assert len(response.data["results"]) == 12
    assert response.data["next"] is not None


@pytest.mark.api
@pytest.mark.django_db
def test_public_detail_does_not_expose_review_documents(api_client) -> None:
    _, business = create_business(phone="+989120000003", name="امن")

    response = api_client.get(
        reverse(
            "businesses:business-detail",
            kwargs={"slug": business.slug},
        )
    )

    assert response.status_code == 200
    assert "license_number" not in response.data
    assert "national_id" not in response.data
    assert "verification_note" not in response.data


@pytest.mark.api
@pytest.mark.django_db
def test_sensitive_change_returns_verified_business_to_review(
    api_client,
) -> None:
    owner, business = create_business(phone="+989120000004", name="قدیمی")
    api_client.force_authenticate(owner)

    response = api_client.patch(
        reverse("businesses:my-business"),
        {"name": "نام جدید"},
        format="json",
    )

    assert response.status_code == 200
    business.refresh_from_db()
    assert (
        business.verification_status
        == BusinessProfile.VerificationStatus.PENDING
    )
    assert business.verified_at is None


@pytest.mark.api
@pytest.mark.django_db
def test_listing_manager_is_scoped_to_own_business(api_client) -> None:
    owner, business = create_business(phone="+989120000005", name="اول")
    other_owner, other_business = create_business(
        phone="+989120000006",
        name="دوم",
    )
    own_listing = create_listing(owner, business)
    other_listing = create_listing(other_owner, other_business)
    employee = User.objects.create_user(
        username="+989120000007",
        phone_number="+989120000007",
        role=User.Role.BUYER,
    )
    BusinessMembership.objects.create(
        business=business,
        user=employee,
        role=BusinessMembership.Role.LISTING_MANAGER,
        can_manage_listings=True,
    )
    api_client.force_authenticate(employee)

    denied = api_client.delete(
        reverse(
            "catalog:vehicle-listing-detail",
            kwargs={"pk": other_listing.pk},
        )
    )
    allowed = api_client.delete(
        reverse(
            "catalog:vehicle-listing-detail",
            kwargs={"pk": own_listing.pk},
        )
    )

    assert denied.status_code == 403
    assert allowed.status_code == 204


@pytest.mark.api
@pytest.mark.django_db
def test_owner_can_add_existing_user_as_employee(api_client) -> None:
    owner, business = create_business(phone="+989120000008", name="تیم")
    employee = User.objects.create_user(
        username="+989120000009",
        phone_number="+989120000009",
        role=User.Role.BUYER,
    )
    api_client.force_authenticate(owner)

    response = api_client.post(
        reverse("businesses:business-members"),
        {
            "phone_number": employee.phone_number,
            "role": "sales",
            "can_manage_listings": True,
            "can_manage_members": False,
        },
        format="json",
    )

    assert response.status_code == 201
    assert BusinessMembership.objects.filter(
        business=business,
        user=employee,
        status=BusinessMembership.Status.ACTIVE,
    ).exists()


@pytest.mark.api
@pytest.mark.django_db
def test_admin_approval_upgrades_gallery_to_agency(
    api_client,
    staff_user,
) -> None:
    owner, business = create_business(phone="+989120000010", name="ارتقا")
    subscription = BusinessSubscription.objects.create(
        business=business,
        plan=BusinessSubscription.Plan.AGENCY_MONTHLY,
        requested_by=owner,
    )
    api_client.force_authenticate(staff_user)

    response = api_client.post(
        reverse(
            "businesses:admin-subscription-review",
            kwargs={"pk": subscription.pk},
        ),
        {"action": "approve", "note": "تأیید شد"},
        format="json",
    )

    assert response.status_code == 200
    business.refresh_from_db()
    owner.refresh_from_db()
    subscription.refresh_from_db()
    assert business.kind == BusinessProfile.Kind.AGENCY
    assert owner.role == User.Role.AGENCY
    assert subscription.status == BusinessSubscription.Status.ACTIVE
    assert subscription.ends_at is not None


@pytest.mark.api
@pytest.mark.django_db
def test_admin_can_verify_business(api_client, staff_user) -> None:
    _, business = create_business(
        phone="+989120000011",
        name="صف بررسی",
        verification_status=BusinessProfile.VerificationStatus.PENDING,
    )
    api_client.force_authenticate(staff_user)

    response = api_client.post(
        reverse(
            "businesses:admin-business-review",
            kwargs={"pk": business.pk},
        ),
        {"action": "verify"},
        format="json",
    )

    assert response.status_code == 200
    business.refresh_from_db()
    assert (
        business.verification_status
        == BusinessProfile.VerificationStatus.VERIFIED
    )
    assert business.reviewed_by == staff_user
