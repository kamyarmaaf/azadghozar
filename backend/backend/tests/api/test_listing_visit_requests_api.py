from datetime import datetime, time, timedelta

import pytest
from django.urls import reverse
from django.utils import timezone

from apps.accounts.models import User
from apps.catalog.models import VehicleListing, VehicleTrim
from apps.service_requests.models import ListingVisitRequest


def create_listing(owner: User, **overrides) -> VehicleListing:
    data = {
        "owner": owner,
        "status": VehicleListing.Status.ACTIVE,
        "brand_name": "Toyota",
        "model_name": "Camry",
        "trim_name": "XSE",
        "production_year": 2024,
        "plate_type": VehicleListing.PlateType.FREE_ZONE,
        "free_zone": "انزلی",
        "province": "گیلان",
        "city": "انزلی",
        "color": "سفید",
        "body_type": "سدان",
        "transmission": VehicleTrim.Transmission.AUTOMATIC,
        "fuel_type": VehicleTrim.FuelType.GASOLINE,
        "drivetrain": VehicleTrim.Drivetrain.FWD,
        "mileage": 12000,
        "condition": VehicleListing.Condition.CLEAN_USED,
        "body_condition": VehicleListing.BodyCondition.NO_PAINT,
        "chassis_condition": VehicleListing.ChassisCondition.SEALED,
        "engine_condition": VehicleListing.EngineCondition.HEALTHY,
        "ownership_status": VehicleListing.OwnershipStatus.OWNER,
        "price_type": VehicleListing.PriceType.NEGOTIABLE,
        "price": 5_000_000_000,
        "contact_number": "09121111111",
    }
    data.update(overrides)
    return VehicleListing.objects.create(**data)


def future_slot(hour: int = 10):
    target = timezone.localdate() + timedelta(days=2)
    while target.weekday() == 4:
        target += timedelta(days=1)
    return timezone.make_aware(
        datetime.combine(target, time(hour=hour)),
        timezone.get_current_timezone(),
    )


def seller_user() -> User:
    return User.objects.create_user(
        username="+989121119999",
        phone_number="+989121119999",
        role=User.Role.SELLER,
        is_phone_verified=True,
    )


@pytest.mark.api
@pytest.mark.django_db
def test_guest_can_create_visit_and_slot_becomes_unavailable(api_client):
    listing = create_listing(seller_user())
    slot = future_slot()
    response = api_client.post(
        reverse("service_requests:visit-create"),
        {
            "listing": listing.pk,
            "contact_name": "علی محمدی",
            "contact_phone": "09121112233",
            "scheduled_for": slot.isoformat(),
            "requester_note": "برای بازدید خودرو",
        },
        format="json",
    )

    assert response.status_code == 201
    assert response.data["status"] == ListingVisitRequest.Status.PENDING
    assert response.data["contact_phone"] == "+989121112233"
    assert ListingVisitRequest.objects.get().requester is None

    availability = api_client.get(
        reverse("service_requests:visit-availability"),
        {"listing": listing.pk, "date": timezone.localtime(slot).date().isoformat()},
    )
    assert availability.status_code == 200
    assert availability.data["unavailable_hours"] == [10]


@pytest.mark.api
@pytest.mark.django_db
def test_authenticated_buyer_tracks_and_cancels_own_visit(api_client, buyer_user):
    listing = create_listing(seller_user())
    api_client.force_authenticate(user=buyer_user)
    created = api_client.post(
        reverse("service_requests:visit-create"),
        {
            "listing": listing.pk,
            "contact_name": "خریدار تست",
            "contact_phone": buyer_user.phone_number,
            "scheduled_for": future_slot().isoformat(),
        },
        format="json",
    )
    mine = api_client.get(reverse("service_requests:visit-mine"))
    cancelled = api_client.post(
        reverse(
            "service_requests:visit-cancel",
            kwargs={"request_id": created.data["id"]},
        )
    )

    assert created.status_code == 201
    assert mine.status_code == 200
    assert mine.data["results"][0]["id"] == created.data["id"]
    assert cancelled.data["status"] == ListingVisitRequest.Status.CANCELLED


@pytest.mark.api
@pytest.mark.django_db
def test_listing_owner_can_confirm_visit_and_other_user_cannot(api_client, buyer_user):
    owner = seller_user()
    listing = create_listing(owner)
    visit = ListingVisitRequest.objects.create(
        listing=listing,
        requester=buyer_user,
        contact_name="خریدار تست",
        contact_phone=buyer_user.phone_number,
        scheduled_for=future_slot(),
    )

    api_client.force_authenticate(user=buyer_user)
    hidden = api_client.get(reverse("service_requests:visit-managed-list"))
    forbidden = api_client.patch(
        reverse(
            "service_requests:visit-managed-detail",
            kwargs={"request_id": visit.public_id},
        ),
        {"status": "confirmed"},
        format="json",
    )

    api_client.force_authenticate(user=owner)
    visible = api_client.get(reverse("service_requests:visit-managed-list"))
    confirmed = api_client.patch(
        reverse(
            "service_requests:visit-managed-detail",
            kwargs={"request_id": visit.public_id},
        ),
        {"status": "confirmed", "owner_note": "ساعت موردنظر مناسب است."},
        format="json",
    )

    assert hidden.data["results"] == []
    assert forbidden.status_code == 404
    assert visible.data["results"][0]["id"] == str(visit.public_id)
    assert confirmed.status_code == 200
    assert confirmed.data["status"] == ListingVisitRequest.Status.CONFIRMED
    assert confirmed.data["responded_at"] is not None


@pytest.mark.api
@pytest.mark.django_db
def test_owner_cannot_request_visit_for_own_listing(api_client):
    owner = seller_user()
    listing = create_listing(owner)
    api_client.force_authenticate(user=owner)

    response = api_client.post(
        reverse("service_requests:visit-create"),
        {
            "listing": listing.pk,
            "contact_name": "مالک خودرو",
            "contact_phone": owner.phone_number,
            "scheduled_for": future_slot().isoformat(),
        },
        format="json",
    )

    assert response.status_code == 400
    assert ListingVisitRequest.objects.count() == 0


@pytest.mark.api
@pytest.mark.django_db
def test_duplicate_open_slot_is_rejected_and_cancelled_slot_can_be_reused(api_client):
    listing = create_listing(seller_user())
    slot = future_slot()
    payload = {
        "listing": listing.pk,
        "contact_name": "متقاضی اول",
        "contact_phone": "09121112233",
        "scheduled_for": slot.isoformat(),
    }
    first = api_client.post(reverse("service_requests:visit-create"), payload, format="json")
    duplicate = api_client.post(
        reverse("service_requests:visit-create"),
        {**payload, "contact_name": "متقاضی دوم", "contact_phone": "09121112244"},
        format="json",
    )
    request = ListingVisitRequest.objects.get(public_id=first.data["id"])
    request.status = ListingVisitRequest.Status.CANCELLED
    request.save(update_fields=("status", "updated_at"))
    reused = api_client.post(
        reverse("service_requests:visit-create"),
        {**payload, "contact_name": "متقاضی دوم", "contact_phone": "09121112244"},
        format="json",
    )

    assert first.status_code == 201
    assert duplicate.status_code == 400
    assert reused.status_code == 201


@pytest.mark.api
@pytest.mark.django_db
def test_owner_must_explain_rejected_visit(api_client, buyer_user):
    owner = seller_user()
    visit = ListingVisitRequest.objects.create(
        listing=create_listing(owner),
        requester=buyer_user,
        contact_name="خریدار تست",
        contact_phone=buyer_user.phone_number,
        scheduled_for=future_slot(),
    )
    api_client.force_authenticate(user=owner)
    url = reverse(
        "service_requests:visit-managed-detail",
        kwargs={"request_id": visit.public_id},
    )

    without_reason = api_client.patch(url, {"status": "rejected"}, format="json")
    with_reason = api_client.patch(
        url,
        {"status": "rejected", "owner_note": "خودرو در این روز در دسترس نیست."},
        format="json",
    )

    assert without_reason.status_code == 400
    assert with_reason.status_code == 200
    assert with_reason.data["status"] == ListingVisitRequest.Status.REJECTED
