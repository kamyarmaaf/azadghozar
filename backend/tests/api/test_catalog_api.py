from io import BytesIO
from urllib.parse import urlsplit

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from django.utils import timezone
from PIL import Image

from apps.accounts.models import User
from apps.catalog.models import (
    Brand,
    ListingFavorite,
    VehicleListing,
    VehicleListingImage,
    VehicleModel,
    VehicleTrim,
)


def listing_payload() -> dict:
    images = []
    for index in range(5):
        output = BytesIO()
        Image.new("RGB", (80, 60), (20 * index, 80, 160)).save(
            output,
            format="WEBP",
        )
        images.append(
            SimpleUploadedFile(
                f"car-{index}.webp",
                output.getvalue(),
                content_type="image/webp",
            )
        )
    return {
        "brand_name": "Toyota",
        "model_name": "Camry",
        "trim_name": "XSE",
        "production_year": 2024,
        "plate_type": "free_zone",
        "free_zone": "کیش",
        "province": "هرمزگان",
        "city": "کیش",
        "color": "سفید",
        "body_type": "سدان",
        "engine_description": "2500 cc",
        "transmission": "automatic",
        "fuel_type": "gasoline",
        "drivetrain": "fwd",
        "mileage": 12000,
        "condition": "clean_used",
        "body_condition": "no_paint",
        "chassis_condition": "sealed",
        "engine_condition": "healthy",
        "insurance_months": 8,
        "ownership_status": "owner",
        "description": "خودرو سالم و آماده بازدید است.",
        "price_type": "negotiable",
        "price": 5_000_000_000,
        "trade_possible": False,
        "contact_number": "09121111111",
        "contact_preference": "both",
        "images": images,
    }


def create_active_listing(owner: User, **overrides) -> VehicleListing:
    data = {
        "owner": owner,
        "status": VehicleListing.Status.ACTIVE,
        "brand_name": "Toyota",
        "model_name": "Camry",
        "trim_name": "XSE",
        "production_year": 2024,
        "plate_type": VehicleListing.PlateType.FREE_ZONE,
        "free_zone": "کیش",
        "province": "هرمزگان",
        "city": "کیش",
        "color": "سفید",
        "body_type": "سدان",
        "engine_description": "2500 cc",
        "transmission": VehicleTrim.Transmission.AUTOMATIC,
        "fuel_type": VehicleTrim.FuelType.GASOLINE,
        "drivetrain": VehicleTrim.Drivetrain.FWD,
        "mileage": 12000,
        "condition": VehicleListing.Condition.CLEAN_USED,
        "body_condition": VehicleListing.BodyCondition.NO_PAINT,
        "chassis_condition": VehicleListing.ChassisCondition.SEALED,
        "engine_condition": VehicleListing.EngineCondition.HEALTHY,
        "insurance_months": 8,
        "ownership_status": VehicleListing.OwnershipStatus.OWNER,
        "description": "خودرو سالم و آماده بازدید است.",
        "price_type": VehicleListing.PriceType.NEGOTIABLE,
        "price": 5_000_000_000,
        "trade_possible": False,
        "contact_number": "09121111111",
        "contact_preference": VehicleListing.ContactPreference.BOTH,
        "published_at": timezone.now(),
    }
    data.update(overrides)
    return VehicleListing.objects.create(**data)


@pytest.mark.api
@pytest.mark.django_db
def test_brand_list_is_public_paginated_and_hides_inactive(
    api_client,
    buyer_user,
) -> None:
    Brand.objects.create(name="BMW", name_fa="بی‌ام‌و", slug="bmw")
    Brand.objects.create(name="Hidden", slug="hidden", is_active=False)
    create_active_listing(buyer_user, brand_name="بی‌ام‌و")
    create_active_listing(
        buyer_user,
        brand_name="بی‌ام‌و",
        status=VehicleListing.Status.PENDING,
    )

    response = api_client.get(reverse("catalog:brand-list"))

    assert response.status_code == 200
    assert set(response.data) == {"count", "next", "previous", "results"}
    assert response.data["count"] == 1
    assert response.data["results"][0]["slug"] == "bmw"
    assert response.data["results"][0]["listing_count"] == 1


@pytest.mark.api
@pytest.mark.django_db
def test_brand_detail_uses_slug(api_client) -> None:
    Brand.objects.create(name="BMW", slug="bmw")

    response = api_client.get(
        reverse("catalog:brand-detail", kwargs={"slug": "bmw"})
    )

    assert response.status_code == 200
    assert response.data["name"] == "BMW"


@pytest.mark.api
@pytest.mark.django_db
def test_staff_can_upload_brand_logo_and_banner(
    api_client,
    staff_user,
    settings,
    tmp_path,
) -> None:
    settings.MEDIA_ROOT = tmp_path
    api_client.force_authenticate(user=staff_user)
    output = BytesIO()
    Image.new("RGBA", (1200, 600), (255, 0, 0, 0)).save(
        output,
        format="PNG",
    )
    logo = SimpleUploadedFile(
        "bmw-logo.png",
        output.getvalue(),
        content_type="image/png",
    )
    banner_output = BytesIO()
    Image.new("RGB", (1600, 500), (15, 23, 42)).save(
        banner_output,
        format="JPEG",
    )
    banner = SimpleUploadedFile(
        "bmw-banner.jpg",
        banner_output.getvalue(),
        content_type="image/jpeg",
    )

    response = api_client.post(
        reverse("catalog:brand-list"),
        {
            "name": "BMW",
            "name_fa": "بی‌ام‌و",
            "slug": "bmw",
            "logo": logo,
            "banner": banner,
        },
        format="multipart",
    )

    assert response.status_code == 201
    brand = Brand.objects.get(slug="bmw")
    assert brand.logo.name.endswith(".webp")
    assert brand.logo.size <= 300 * 1024
    assert brand.banner.name.endswith(".webp")
    assert brand.banner.size <= 900 * 1024
    assert response.data["logo_url"].startswith("http://testserver/media/")
    assert response.data["banner_url"].startswith("http://testserver/media/")
    assert "logo" not in response.data
    assert "banner" not in response.data


@pytest.mark.api
@pytest.mark.django_db
def test_models_can_be_filtered_by_brand_slug(api_client) -> None:
    bmw = Brand.objects.create(name="BMW", slug="bmw")
    benz = Brand.objects.create(name="Mercedes-Benz", slug="mercedes-benz")
    VehicleModel.objects.create(brand=bmw, name="X4", slug="bmw-x4")
    VehicleModel.objects.create(
        brand=benz,
        name="E-Class",
        slug="mercedes-benz-e-class",
    )

    response = api_client.get(
        reverse("catalog:vehicle-model-list"),
        {"brand": "bmw"},
    )

    assert response.status_code == 200
    assert response.data["count"] == 1
    assert response.data["results"][0]["slug"] == "bmw-x4"


@pytest.mark.api
@pytest.mark.django_db
def test_trims_can_be_filtered_by_model_slug(api_client) -> None:
    brand = Brand.objects.create(name="BMW", slug="bmw")
    x4 = VehicleModel.objects.create(
        brand=brand,
        name="X4",
        slug="bmw-x4",
    )
    x5 = VehicleModel.objects.create(
        brand=brand,
        name="X5",
        slug="bmw-x5",
    )
    VehicleTrim.objects.create(
        vehicle_model=x4,
        name="xDrive30i",
        slug="bmw-x4-xdrive30i",
    )
    VehicleTrim.objects.create(
        vehicle_model=x5,
        name="xDrive40i",
        slug="bmw-x5-xdrive40i",
    )

    response = api_client.get(
        reverse("catalog:vehicle-trim-list"),
        {"model": "bmw-x4"},
    )

    assert response.status_code == 200
    assert response.data["count"] == 1
    assert response.data["results"][0]["slug"] == "bmw-x4-xdrive30i"


@pytest.mark.api
@pytest.mark.django_db
def test_catalog_search_matches_persian_name(api_client) -> None:
    Brand.objects.create(
        name="Mercedes-Benz",
        name_fa="مرسدس بنز",
        slug="mercedes-benz",
    )

    response = api_client.get(
        reverse("catalog:brand-list"),
        {"q": "مرسدس"},
    )

    assert response.status_code == 200
    assert response.data["count"] == 1


@pytest.mark.api
@pytest.mark.django_db
def test_catalog_rejects_unsupported_http_method(
    api_client,
    staff_user,
) -> None:
    api_client.force_authenticate(user=staff_user)

    response = api_client.patch(
        reverse("catalog:brand-list"),
        {"name": "BMW"},
        format="json",
    )

    assert response.status_code == 405


@pytest.mark.api
@pytest.mark.django_db
def test_seller_can_create_compressed_listing_with_five_images(
    api_client,
    buyer_user,
    settings,
    tmp_path,
) -> None:
    settings.MEDIA_ROOT = tmp_path
    buyer_user.role = "seller"
    buyer_user.save(update_fields=["role"])
    api_client.force_authenticate(user=buyer_user)

    response = api_client.post(
        reverse("catalog:vehicle-listing-list"),
        listing_payload(),
        format="multipart",
    )

    assert response.status_code == 201
    listing = VehicleListing.objects.get(pk=response.data["id"])
    assert listing.owner == buyer_user
    assert listing.status == VehicleListing.Status.PENDING
    assert listing.images.count() == 5
    assert all(image.mime_type == "image/webp" for image in listing.images.all())

    api_client.force_authenticate(user=None)
    anonymous_response = api_client.get(
        reverse("catalog:vehicle-listing-list")
    )
    assert anonymous_response.data["count"] == 0

    api_client.force_authenticate(user=buyer_user)
    owner_response = api_client.get(reverse("catalog:vehicle-listing-list"))
    assert owner_response.data["count"] == 1


@pytest.mark.api
@pytest.mark.django_db
def test_listing_filters_mine_and_staff_can_moderate(
    api_client,
    buyer_user,
    staff_user,
    settings,
    tmp_path,
) -> None:
    settings.MEDIA_ROOT = tmp_path
    buyer_user.role = User.Role.SELLER
    buyer_user.save(update_fields=["role"])
    api_client.force_authenticate(user=buyer_user)
    create_response = api_client.post(
        reverse("catalog:vehicle-listing-list"),
        listing_payload(),
        format="multipart",
    )
    listing_id = create_response.data["id"]

    mine_response = api_client.get(
        reverse("catalog:vehicle-listing-list"),
        {"mine": "true"},
    )
    assert mine_response.status_code == 200
    assert mine_response.data["count"] == 1

    api_client.force_authenticate(user=staff_user)
    pending_response = api_client.get(
        reverse("catalog:vehicle-listing-list"),
        {"status": "pending"},
    )
    assert pending_response.data["count"] == 1

    approve_response = api_client.post(
        reverse(
            "catalog:vehicle-listing-approve",
            kwargs={"pk": listing_id},
        ),
        {},
        format="json",
    )
    assert approve_response.status_code == 200
    assert approve_response.data["status"] == VehicleListing.Status.ACTIVE
    assert approve_response.data["published_at"] is not None
    assert approve_response.data["is_instant_sale"] is False
    assert approve_response.data["is_special_sale"] is False


@pytest.mark.api
@pytest.mark.django_db
@pytest.mark.parametrize(
    ("campaign", "is_instant_sale", "is_special_sale"),
    (
        ("regular", False, False),
        ("instant", True, False),
        ("special", False, True),
    ),
)
def test_staff_assigns_campaign_while_approving_listing(
    api_client,
    buyer_user,
    staff_user,
    campaign,
    is_instant_sale,
    is_special_sale,
) -> None:
    listing = create_active_listing(
        buyer_user,
        status=VehicleListing.Status.PENDING,
        published_at=None,
        is_instant_sale=True,
        is_special_sale=True,
    )
    api_client.force_authenticate(user=staff_user)

    response = api_client.post(
        reverse(
            "catalog:vehicle-listing-approve",
            kwargs={"pk": listing.pk},
        ),
        {"campaign": campaign},
        format="json",
    )

    assert response.status_code == 200
    listing.refresh_from_db()
    assert listing.status == VehicleListing.Status.ACTIVE
    assert listing.is_instant_sale is is_instant_sale
    assert listing.is_special_sale is is_special_sale
    assert response.data["is_instant_sale"] is is_instant_sale
    assert response.data["is_special_sale"] is is_special_sale


@pytest.mark.api
@pytest.mark.django_db
def test_staff_cannot_approve_listing_with_unknown_campaign(
    api_client,
    buyer_user,
    staff_user,
) -> None:
    listing = create_active_listing(
        buyer_user,
        status=VehicleListing.Status.PENDING,
        published_at=None,
    )
    api_client.force_authenticate(user=staff_user)

    response = api_client.post(
        reverse(
            "catalog:vehicle-listing-approve",
            kwargs={"pk": listing.pk},
        ),
        {"campaign": "sponsored"},
        format="json",
    )

    assert response.status_code == 400
    assert "campaign" in response.data
    listing.refresh_from_db()
    assert listing.status == VehicleListing.Status.PENDING


@pytest.mark.api
@pytest.mark.django_db
def test_public_listing_search_honors_home_filters_and_bounded_pages(
    api_client, buyer_user
) -> None:
    owner = buyer_user
    entries = [
        create_active_listing(owner, brand_name="Toyota", body_type="سدان", city="کیش"),
        create_active_listing(owner, brand_name="BMW", body_type="شاسی‌بلند", city="کیش"),
        create_active_listing(owner, brand_name="Honda", body_type="سدان", city="تهران"),
    ]
    create_active_listing(owner, brand_name="BMW", status=VehicleListing.Status.PENDING)
    url = reverse("catalog:vehicle-listing-list")

    response = api_client.get(url, {
        "brands": ["toyota", "bmw"], "body_types": ["سدان", "شاسی‌بلند"],
        "city": "کیش", "page_size": 1, "summary": "true",
    })
    assert response.status_code == 200
    assert response.data["count"] == 2
    assert len(response.data["results"]) == 1
    assert response.data["results"][0]["id"] in {entries[0].id, entries[1].id}
    assert response.data["next"] is not None
    next_response = api_client.get(response.data["next"])
    assert next_response.status_code == 200
    assert next_response.data["count"] == 2
    assert {response.data["results"][0]["id"], next_response.data["results"][0]["id"]} == {entries[0].id, entries[1].id}

    search = api_client.get(url, {"q": "honda", "city": "تهران", "summary": "true"})
    assert search.status_code == 200
    assert search.data["results"][0]["id"] == entries[2].id
    assert search.data["count"] == 1

    invalid = api_client.get(url, {"brands": ["BMW"] * 21})
    assert invalid.status_code == 400

    instant_listing = create_active_listing(
        owner, brand_name="Toyota", is_instant_sale=True,
    )
    special_listing = create_active_listing(
        owner, brand_name="BMW", is_special_sale=True,
    )
    instant_response = api_client.get(url, {
        "is_instant_sale": "True", "page_size": 24, "summary": "true",
    })
    assert instant_response.status_code == 200
    assert instant_response.data["count"] == 1
    assert instant_response.data["results"][0]["id"] == instant_listing.id
    special_response = api_client.get(url, {
        "is_special_sale": "True", "page_size": 24, "summary": "true",
    })
    assert special_response.status_code == 200
    assert special_response.data["count"] == 1
    assert special_response.data["results"][0]["id"] == special_listing.id
    instant_campaign = api_client.get(url, {
        "campaign": "instant", "page_size": 24, "summary": "true",
    })
    assert instant_campaign.status_code == 200
    assert instant_campaign.data["count"] == 1
    assert instant_campaign.data["results"][0]["id"] == instant_listing.id
    special_campaign = api_client.get(url, {
        "campaign": "special", "page_size": 24, "summary": "true",
    })
    assert special_campaign.status_code == 200
    assert special_campaign.data["count"] == 1
    assert special_campaign.data["results"][0]["id"] == special_listing.id
    invalid_campaign = api_client.get(url, {"campaign": "featured"})
    assert invalid_campaign.status_code == 400
    assert "campaign" in invalid_campaign.data
    latest_regular = api_client.get(url, {
        "is_instant_sale": "False", "is_special_sale": "False",
        "page_size": 6, "summary": "true",
    })
    assert latest_regular.status_code == 200
    assert latest_regular.data["count"] == 3
    assert len(latest_regular.data["results"]) == 3


@pytest.mark.api
@pytest.mark.django_db
def test_admin_pending_queue_is_staff_only_count_free_and_bounded(
    api_client, buyer_user, staff_user, django_assert_num_queries
) -> None:
    seller = User.objects.create_user(
        username="moderation-seller", role=User.Role.SELLER,
    )
    pending = []
    for index in range(45):
        pending.append(create_active_listing(
            seller,
            model_name=f"Pending {index}",
            status=VehicleListing.Status.PENDING,
            published_at=None,
        ))
    VehicleListingImage.objects.create(
        listing=pending[-1], file="listings/moderation/cover.webp",
        sort_order=0, file_size=123, mime_type="image/webp",
    )
    create_active_listing(seller, model_name="Active listing")
    url = reverse("catalog:vehicle-listing-pending-queue")
    assert api_client.get(url).status_code == 401
    api_client.force_authenticate(user=buyer_user)
    assert api_client.get(url).status_code == 403

    api_client.force_authenticate(user=staff_user)
    with django_assert_num_queries(1):
        first = api_client.get(url)
    assert first.status_code == 200
    assert set(first.data) == {"next", "previous", "results"}
    assert len(first.data["results"]) == 20
    assert first.data["next"]
    assert first.data["results"][0]["cover_image"].endswith("cover.webp")
    assert set(first.data["results"][0]) == {
        "id", "owner_name", "brand_name", "model_name", "trim_name",
        "production_year", "price", "created_at", "cover_image",
    }

    with django_assert_num_queries(1):
        second = api_client.get(first.data["next"])
    assert second.status_code == 200
    assert len(second.data["results"]) == 20
    assert second.data["previous"]
    assert set(item["id"] for item in first.data["results"]).isdisjoint(
        item["id"] for item in second.data["results"]
    )

    third = api_client.get(second.data["next"])
    assert len(third.data["results"]) == 5
    assert third.data["next"] is None
    assert len(api_client.get(url, {"page_size": 5000}).data["results"]) == 45


@pytest.mark.api
@pytest.mark.django_db
def test_internal_listing_reviews_do_not_inflate_public_view_count(
    api_client, buyer_user, staff_user
) -> None:
    pending = create_active_listing(
        buyer_user, status=VehicleListing.Status.PENDING, published_at=None,
    )
    active = create_active_listing(buyer_user)
    api_client.force_authenticate(user=staff_user)
    assert api_client.get(reverse("catalog:vehicle-listing-detail", args=[pending.pk])).status_code == 200
    assert api_client.get(reverse("catalog:vehicle-listing-detail", args=[active.pk])).status_code == 200
    api_client.force_authenticate(user=buyer_user)
    assert api_client.get(reverse("catalog:vehicle-listing-detail", args=[active.pk])).status_code == 200
    active.refresh_from_db()
    pending.refresh_from_db()
    assert active.view_count == pending.view_count == 0

    api_client.force_authenticate(user=None)
    assert api_client.get(reverse("catalog:vehicle-listing-detail", args=[active.pk])).status_code == 200
    active.refresh_from_db()
    assert active.view_count == 1


@pytest.mark.api
@pytest.mark.django_db
def test_listing_images_are_server_compressed_to_webp(
    api_client,
    buyer_user,
    settings,
    tmp_path,
) -> None:
    settings.MEDIA_ROOT = tmp_path
    buyer_user.role = User.Role.SELLER
    buyer_user.save(update_fields=["role"])
    payload = listing_payload()
    png = BytesIO()
    Image.new("RGB", (2400, 1800), "navy").save(png, format="PNG")
    payload["images"][0] = SimpleUploadedFile(
        "large.png",
        png.getvalue(),
        content_type="image/png",
    )
    api_client.force_authenticate(user=buyer_user)

    response = api_client.post(
        reverse("catalog:vehicle-listing-list"),
        payload,
        format="multipart",
    )

    assert response.status_code == 201
    image = VehicleListing.objects.get(pk=response.data["id"]).images.first()
    assert image is not None
    assert image.file.name.endswith(".webp")
    assert image.file_size <= 1024 * 1024


@pytest.mark.api
@pytest.mark.django_db
def test_owner_can_edit_listing_and_replace_one_image(
    api_client,
    buyer_user,
    settings,
    tmp_path,
) -> None:
    settings.MEDIA_ROOT = tmp_path
    buyer_user.role = User.Role.SELLER
    buyer_user.save(update_fields=["role"])
    api_client.force_authenticate(user=buyer_user)
    create_response = api_client.post(
        reverse("catalog:vehicle-listing-list"),
        listing_payload(),
        format="multipart",
    )
    listing = VehicleListing.objects.get(pk=create_response.data["id"])
    listing.status = VehicleListing.Status.ACTIVE
    listing.published_at = timezone.now()
    listing.save(update_fields=["status", "published_at"])
    existing_images = list(listing.images.order_by("sort_order"))

    output = BytesIO()
    Image.new("RGB", (120, 90), "green").save(output, format="PNG")
    replacement = SimpleUploadedFile(
        "replacement.png",
        output.getvalue(),
        content_type="image/png",
    )
    response = api_client.patch(
        reverse("catalog:vehicle-listing-detail", kwargs={"pk": listing.pk}),
        {
            "model_name": "Corolla",
            "retained_image_ids": [image.id for image in existing_images[:4]],
            "images": [replacement],
        },
        format="multipart",
    )

    assert response.status_code == 200
    listing.refresh_from_db()
    assert listing.model_name == "Corolla"
    assert listing.status == VehicleListing.Status.PENDING
    assert listing.published_at is None
    assert listing.images.count() == 5
    assert not listing.images.filter(pk=existing_images[-1].pk).exists()
    assert list(listing.images.values_list("sort_order", flat=True)) == list(range(5))


@pytest.mark.api
@pytest.mark.django_db
def test_owner_can_remove_listing_video(
    api_client,
    buyer_user,
    settings,
    tmp_path,
) -> None:
    settings.MEDIA_ROOT = tmp_path
    buyer_user.role = User.Role.SELLER
    buyer_user.save(update_fields=["role"])
    api_client.force_authenticate(user=buyer_user)
    payload = listing_payload()
    payload["video"] = SimpleUploadedFile(
        "walkaround.mp4",
        b"test-video",
        content_type="video/mp4",
    )
    create_response = api_client.post(
        reverse("catalog:vehicle-listing-list"),
        payload,
        format="multipart",
    )
    listing = VehicleListing.objects.get(pk=create_response.data["id"])

    response = api_client.patch(
        reverse("catalog:vehicle-listing-detail", kwargs={"pk": listing.pk}),
        {
            "retained_image_ids": list(
                listing.images.values_list("id", flat=True)
            ),
            "remove_video": True,
        },
        format="multipart",
    )

    assert response.status_code == 200
    listing.refresh_from_db()
    assert not listing.video


@pytest.mark.api
@pytest.mark.django_db
def test_authenticated_user_can_manage_listing_favorites(
    api_client,
    buyer_user,
) -> None:
    seller = User.objects.create_user(
        username="+989133333333",
        phone_number="+989133333333",
        role=User.Role.SELLER,
        is_phone_verified=True,
    )
    listing = create_active_listing(seller)
    list_url = reverse("catalog:listing-favorite-list")
    detail_url = reverse(
        "catalog:listing-favorite-detail",
        kwargs={"listing_id": listing.id},
    )

    anonymous_response = api_client.get(list_url)
    assert anonymous_response.status_code == 401

    api_client.force_authenticate(user=buyer_user)
    create_response = api_client.post(
        list_url,
        {"listing_id": listing.id},
        format="json",
    )
    duplicate_response = api_client.post(
        list_url,
        {"listing_id": listing.id},
        format="json",
    )

    assert create_response.status_code == 201
    assert duplicate_response.status_code == 201
    assert ListingFavorite.objects.filter(
        user=buyer_user,
        listing=listing,
    ).count() == 1

    list_response = api_client.get(list_url)
    assert list_response.status_code == 200
    assert list_response.data["count"] == 1
    assert list_response.data["results"][0]["listing"]["id"] == listing.id

    delete_response = api_client.delete(detail_url)
    assert delete_response.status_code == 204
    assert not ListingFavorite.objects.filter(
        user=buyer_user,
        listing=listing,
    ).exists()


@pytest.mark.api
@pytest.mark.django_db
def test_user_cannot_favorite_inactive_listing_or_delete_another_users_favorite(
    api_client,
    buyer_user,
) -> None:
    seller = User.objects.create_user(
        username="+989144444444",
        phone_number="+989144444444",
        role=User.Role.SELLER,
        is_phone_verified=True,
    )
    other_buyer = User.objects.create_user(
        username="+989155555555",
        phone_number="+989155555555",
        role=User.Role.BUYER,
        is_phone_verified=True,
    )
    active_listing = create_active_listing(seller)
    pending_listing = create_active_listing(
        seller,
        status=VehicleListing.Status.PENDING,
        model_name="Corolla",
        published_at=None,
    )
    ListingFavorite.objects.create(
        user=other_buyer,
        listing=active_listing,
    )
    api_client.force_authenticate(user=buyer_user)

    inactive_response = api_client.post(
        reverse("catalog:listing-favorite-list"),
        {"listing_id": pending_listing.id},
        format="json",
    )
    delete_response = api_client.delete(
        reverse(
            "catalog:listing-favorite-detail",
            kwargs={"listing_id": active_listing.id},
        )
    )

    assert inactive_response.status_code == 400
    assert delete_response.status_code == 404
    assert ListingFavorite.objects.filter(
        user=other_buyer,
        listing=active_listing,
    ).exists()


@pytest.mark.api
@pytest.mark.django_db
def test_comparison_candidates_use_cursor_pagination_and_constant_queries(
    api_client,
    django_assert_num_queries,
) -> None:
    seller = User.objects.create_user(
        username="+989166666666",
        phone_number="+989166666666",
        role=User.Role.SELLER,
        is_phone_verified=True,
    )
    for index in range(20):
        create_active_listing(
            seller,
            model_name=f"Camry {index}",
            mileage=10_000 + index,
        )
    create_active_listing(
        seller,
        status=VehicleListing.Status.PENDING,
        model_name="Hidden Camry",
        published_at=None,
    )

    with django_assert_num_queries(1):
        response = api_client.get(
            reverse("catalog:vehicle-listing-comparison-candidates"),
            {"page_size": 5},
        )

    assert response.status_code == 200
    assert set(response.data) == {"next", "previous", "results"}
    assert len(response.data["results"]) == 5
    assert response.data["next"] is not None
    assert "cursor=" in response.data["next"]
    assert "description" not in response.data["results"][0]
    assert "contact_number" not in response.data["results"][0]

    first_page_ids = {item["id"] for item in response.data["results"]}
    next_url = urlsplit(response.data["next"])
    second_response = api_client.get(f"{next_url.path}?{next_url.query}")
    second_page_ids = {
        item["id"] for item in second_response.data["results"]
    }
    assert second_response.status_code == 200
    assert first_page_ids.isdisjoint(second_page_ids)


@pytest.mark.api
@pytest.mark.django_db
def test_public_listing_summary_has_bounded_payload_and_queries(
    api_client,
    django_assert_num_queries,
) -> None:
    seller = User.objects.create_user(
        username="+989199999999",
        phone_number="+989199999999",
        role=User.Role.SELLER,
        is_phone_verified=True,
    )
    for index in range(12):
        listing = create_active_listing(
            seller,
            model_name=f"Summary {index}",
        )
        VehicleListingImage.objects.create(
            listing=listing,
            file=f"listings/summary/{index}.webp",
            sort_order=0,
            file_size=123,
            mime_type="image/webp",
        )

    with django_assert_num_queries(2):
        response = api_client.get(
            reverse("catalog:vehicle-listing-list"),
            {"summary": "true", "page_size": 5},
        )

    assert response.status_code == 200
    assert response.data["count"] == 12
    assert len(response.data["results"]) == 5
    first = response.data["results"][0]
    assert first["cover_image"].endswith(".webp")
    assert "description" not in first
    assert "contact_number" not in first
    assert "image_files" not in first


@pytest.mark.api
@pytest.mark.django_db
def test_comparison_candidates_searches_only_active_listings(api_client) -> None:
    seller = User.objects.create_user(
        username="+989177777777",
        phone_number="+989177777777",
        role=User.Role.SELLER,
        is_phone_verified=True,
    )
    visible = create_active_listing(
        seller,
        brand_name="Mercedes-Benz",
        model_name="E200",
    )
    create_active_listing(
        seller,
        status=VehicleListing.Status.PENDING,
        brand_name="Mercedes-Benz",
        model_name="Hidden",
        published_at=None,
    )

    response = api_client.get(
        reverse("catalog:vehicle-listing-comparison-candidates"),
        {"q": "Mercedes"},
    )

    assert response.status_code == 200
    assert [item["id"] for item in response.data["results"]] == [visible.id]

    short_query_response = api_client.get(
        reverse("catalog:vehicle-listing-comparison-candidates"),
        {"q": "M"},
    )
    assert short_query_response.status_code == 400
    assert "q" in short_query_response.data


@pytest.mark.api
@pytest.mark.django_db
def test_comparison_returns_requested_active_listings_in_one_query(
    api_client,
    django_assert_num_queries,
) -> None:
    seller = User.objects.create_user(
        username="+989188888888",
        phone_number="+989188888888",
        role=User.Role.SELLER,
        is_phone_verified=True,
    )
    first = create_active_listing(seller, model_name="Camry")
    second = create_active_listing(seller, model_name="Corolla")
    hidden = create_active_listing(
        seller,
        status=VehicleListing.Status.PENDING,
        model_name="Hidden",
        published_at=None,
    )
    VehicleListingImage.objects.create(
        listing=second,
        file="listings/test/cover.webp",
        sort_order=0,
        file_size=123,
        mime_type="image/webp",
    )

    with django_assert_num_queries(1):
        response = api_client.get(
            reverse("catalog:vehicle-listing-comparison"),
            {"ids": f"{second.id},{hidden.id},{first.id}"},
        )

    assert response.status_code == 200
    assert [item["id"] for item in response.data] == [second.id, first.id]
    assert response.data[0]["cover_image"].endswith(
        "/media/listings/test/cover.webp"
    )
    assert "description" not in response.data[0]
    assert "contact_number" not in response.data[0]


@pytest.mark.api
@pytest.mark.django_db
@pytest.mark.parametrize(
    "ids",
    (
        "",
        "invalid",
        "1,2,3,4,5",
        "0",
    ),
)
def test_comparison_rejects_invalid_or_unbounded_ids(api_client, ids) -> None:
    response = api_client.get(
        reverse("catalog:vehicle-listing-comparison"),
        {"ids": ids},
    )

    assert response.status_code == 400
    assert "ids" in response.data


@pytest.mark.security
@pytest.mark.django_db
def test_buyer_cannot_publish_vehicle_listing(
    api_client,
    buyer_user,
    settings,
    tmp_path,
) -> None:
    settings.MEDIA_ROOT = tmp_path
    api_client.force_authenticate(user=buyer_user)

    response = api_client.post(
        reverse("catalog:vehicle-listing-list"),
        listing_payload(),
        format="multipart",
    )

    assert response.status_code == 400
    assert VehicleListing.objects.count() == 0
