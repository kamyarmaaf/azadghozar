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
    kind: str = BusinessProfile.Kind.GALLERY,
) -> tuple[User, BusinessProfile]:
    owner = User.objects.create_user(
        username=phone,
        phone_number=phone,
        role=User.Role.AGENCY if kind == BusinessProfile.Kind.AGENCY else User.Role.GALLERY,
        business_name=name,
        is_phone_verified=True,
    )
    business = BusinessProfile.objects.create(
        owner=owner,
        kind=kind,
        name=name,
        slug=f"business-{owner.pk}",
        phone="02188776655",
        province="تهران",
        city="تهران",
        address="خیابان اصلی، پلاک ۱۰",
        postal_code="1234567890",
        license_number="LIC-123",
        license_issuer="اتحادیه نمایشگاه‌داران",
        national_id="1234567890",
        company_registration_number=("REG-123" if kind == BusinessProfile.Kind.AGENCY else ""),
        authorized_representative_name=("نماینده شرکت" if kind == BusinessProfile.Kind.AGENCY else ""),
        import_license_number=("IMP-123" if kind == BusinessProfile.Kind.AGENCY else ""),
        import_license_issuer=("وزارت صمت" if kind == BusinessProfile.Kind.AGENCY else ""),
        represented_brands=(["Toyota"] if kind == BusinessProfile.Kind.AGENCY else []),
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
def test_public_detail_is_scoped_to_requested_business_kind(api_client) -> None:
    _, gallery = create_business(phone="+989120000023", name="نمایشگاه مستقل")

    response = api_client.get(
        reverse("businesses:business-detail", kwargs={"slug": gallery.slug}),
        {"kind": BusinessProfile.Kind.AGENCY},
    )

    assert response.status_code == 404


@pytest.mark.api
@pytest.mark.django_db
def test_business_profile_rejects_documents_from_other_kind(api_client) -> None:
    owner, business = create_business(
        phone="+989120000024",
        name="نمایشگاه تفکیک‌شده",
        kind=BusinessProfile.Kind.GALLERY,
    )
    api_client.force_authenticate(owner)

    response = api_client.patch(
        reverse("businesses:my-business"),
        {"import_license_number": "IMP-WRONG"},
        format="json",
    )

    assert response.status_code == 400
    assert "import_license_number" in response.data
    business.refresh_from_db()
    assert business.import_license_number == ""


@pytest.mark.api
@pytest.mark.django_db
def test_admin_cannot_verify_incomplete_importer_agency(
    api_client,
    staff_user,
) -> None:
    _, agency = create_business(
        phone="+989120000025",
        name="شرکت واردکننده ناقص",
        kind=BusinessProfile.Kind.AGENCY,
        verification_status=BusinessProfile.VerificationStatus.PENDING,
    )
    agency.import_license_number = ""
    agency.save()
    api_client.force_authenticate(staff_user)

    response = api_client.post(
        reverse(
            "businesses:admin-business-review",
            kwargs={"pk": agency.pk},
        ),
        {"action": "verify"},
        format="json",
    )

    assert response.status_code == 400
    assert "import_license_number" in response.data


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
def test_correcting_rejected_business_returns_it_to_review(api_client) -> None:
    owner, business = create_business(
        phone="+989120000014",
        name="مدارک ناقص",
        verification_status=BusinessProfile.VerificationStatus.REJECTED,
    )
    business.verification_note = "شماره مجوز اصلاح شود."
    business.save(update_fields=("verification_note", "updated_at"))
    api_client.force_authenticate(owner)

    response = api_client.patch(
        reverse("businesses:my-business"),
        {"description": "توضیحات اصلاح‌شده کسب‌وکار"},
        format="json",
    )

    assert response.status_code == 200
    business.refresh_from_db()
    assert business.description == "توضیحات اصلاح‌شده کسب‌وکار"
    assert (
        business.verification_status
        == BusinessProfile.VerificationStatus.PENDING
    )
    assert business.verification_note == ""


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
def test_admin_subscription_approval_does_not_change_business_identity(
    api_client,
    staff_user,
) -> None:
    owner, business = create_business(phone="+989120000010", name="اشتراک")
    subscription = BusinessSubscription.objects.create(
        business=business,
        plan=BusinessSubscription.Plan.GALLERY_MONTHLY,
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
    assert response.data["business_verification_status"] == "verified"
    business.refresh_from_db()
    owner.refresh_from_db()
    subscription.refresh_from_db()
    assert business.kind == BusinessProfile.Kind.GALLERY
    assert owner.role == User.Role.GALLERY
    assert subscription.status == BusinessSubscription.Status.ACTIVE
    assert subscription.ends_at is not None


@pytest.mark.api
@pytest.mark.django_db
def test_admin_business_queues_are_separated_by_kind(
    api_client,
    staff_user,
) -> None:
    gallery_owner, gallery = create_business(
        phone="+989120000020",
        name="نمایشگاه مستقل",
        kind=BusinessProfile.Kind.GALLERY,
        verification_status=BusinessProfile.VerificationStatus.PENDING,
    )
    agency_owner, agency = create_business(
        phone="+989120000021",
        name="شرکت واردکننده مستقل",
        kind=BusinessProfile.Kind.AGENCY,
        verification_status=BusinessProfile.VerificationStatus.PENDING,
    )
    BusinessSubscription.objects.create(
        business=gallery,
        plan=BusinessSubscription.Plan.GALLERY_MONTHLY,
        requested_by=gallery_owner,
    )
    BusinessSubscription.objects.create(
        business=agency,
        plan=BusinessSubscription.Plan.AGENCY_MONTHLY,
        requested_by=agency_owner,
    )
    api_client.force_authenticate(staff_user)

    gallery_profiles = api_client.get(
        reverse("businesses:admin-business-list"),
        {"kind": BusinessProfile.Kind.GALLERY},
    )
    agency_profiles = api_client.get(
        reverse("businesses:admin-business-list"),
        {"kind": BusinessProfile.Kind.AGENCY},
    )
    gallery_subscriptions = api_client.get(
        reverse("businesses:admin-subscription-list"),
        {"kind": BusinessProfile.Kind.GALLERY, "status": "pending"},
    )
    agency_subscriptions = api_client.get(
        reverse("businesses:admin-subscription-list"),
        {"kind": BusinessProfile.Kind.AGENCY, "status": "pending"},
    )

    assert [item["kind"] for item in gallery_profiles.data["results"]] == [
        BusinessProfile.Kind.GALLERY
    ]
    assert [item["kind"] for item in agency_profiles.data["results"]] == [
        BusinessProfile.Kind.AGENCY
    ]
    assert [
        item["business_name"]
        for item in gallery_subscriptions.data["results"]
    ] == [gallery.name]
    assert [
        item["business_name"]
        for item in agency_subscriptions.data["results"]
    ] == [agency.name]


@pytest.mark.api
@pytest.mark.django_db
def test_subscription_plan_must_match_business_kind(api_client) -> None:
    owner, _ = create_business(
        phone="+989120000022",
        name="واردکننده پلن مستقل",
        kind=BusinessProfile.Kind.AGENCY,
    )
    api_client.force_authenticate(owner)

    invalid = api_client.post(
        reverse("businesses:business-subscriptions"),
        {"plan": BusinessSubscription.Plan.GALLERY_MONTHLY},
        format="json",
    )
    valid = api_client.post(
        reverse("businesses:business-subscriptions"),
        {"plan": BusinessSubscription.Plan.AGENCY_MONTHLY},
        format="json",
    )

    assert invalid.status_code == 400
    assert valid.status_code == 201


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


@pytest.mark.api
@pytest.mark.django_db
def test_admin_cannot_activate_subscription_before_business_verification(
    api_client,
    staff_user,
) -> None:
    owner, business = create_business(
        phone="+989120000012",
        name="نمایشگاه در انتظار",
        verification_status=BusinessProfile.VerificationStatus.PENDING,
    )
    subscription = BusinessSubscription.objects.create(
        business=business,
        plan=BusinessSubscription.Plan.GALLERY_MONTHLY,
        requested_by=owner,
    )
    api_client.force_authenticate(staff_user)

    response = api_client.post(
        reverse(
            "businesses:admin-subscription-review",
            kwargs={"pk": subscription.pk},
        ),
        {"action": "approve", "note": "بررسی اولیه"},
        format="json",
    )

    assert response.status_code == 400
    owner.refresh_from_db()
    business.refresh_from_db()
    subscription.refresh_from_db()
    assert owner.role == User.Role.GALLERY
    assert business.kind == BusinessProfile.Kind.GALLERY
    assert subscription.status == BusinessSubscription.Status.PENDING


@pytest.mark.api
@pytest.mark.django_db
def test_rejecting_business_requires_a_reason(api_client, staff_user) -> None:
    _, business = create_business(
        phone="+989120000013",
        name="بررسی علت رد",
        verification_status=BusinessProfile.VerificationStatus.PENDING,
    )
    api_client.force_authenticate(staff_user)

    response = api_client.post(
        reverse(
            "businesses:admin-business-review",
            kwargs={"pk": business.pk},
        ),
        {"action": "reject", "note": ""},
        format="json",
    )

    assert response.status_code == 400
    assert "note" in response.data
    business.refresh_from_db()
    assert business.verification_status == BusinessProfile.VerificationStatus.PENDING
