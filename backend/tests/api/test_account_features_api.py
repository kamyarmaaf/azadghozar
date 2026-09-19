from io import BytesIO

import pytest
from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from PIL import Image

from apps.accounts.models import Referral, RoleChangeRequest, User


@pytest.mark.api
@pytest.mark.django_db
def test_roles_endpoint_exposes_all_roles_and_public_subset(
    api_client,
) -> None:
    response = api_client.get(reverse("accounts:role-choices"))

    assert response.status_code == 200
    assert len(response.data["roles"]) == 9
    public_roles = {
        item["value"]
        for item in response.data["roles"]
        if item["can_self_register"]
    }
    assert public_roles == {"buyer", "seller", "gallery", "agency"}


@pytest.mark.api
@pytest.mark.django_db
def test_gallery_can_register_but_privileged_role_cannot(
    api_client,
    otp_outbox,
) -> None:
    gallery_response = api_client.post(
        reverse("accounts:signup-request-otp"),
        {
            "phone_number": "09123334441",
            "role": "gallery",
        },
        format="json",
    )
    privileged_response = api_client.post(
        reverse("accounts:signup-request-otp"),
        {
            "phone_number": "09123334442",
            "role": "org",
        },
        format="json",
    )

    assert gallery_response.status_code == 202
    assert privileged_response.status_code == 400
    assert len(otp_outbox.messages) == 1


@pytest.mark.api
@pytest.mark.django_db
def test_agency_can_register_as_an_independent_business_type(
    api_client,
    otp_outbox,
) -> None:
    response = api_client.post(
        reverse("accounts:signup-request-otp"),
        {
            "phone_number": "09123334449",
            "role": "agency",
        },
        format="json",
    )

    assert response.status_code == 202
    assert len(otp_outbox.messages) == 1


@pytest.mark.api
@pytest.mark.django_db
def test_signup_with_referral_creates_reward(
    api_client,
    otp_outbox,
    buyer_user,
    settings,
) -> None:
    settings.REFERRAL_REWARD_VALUE = 700_000
    request_response = api_client.post(
        reverse("accounts:signup-request-otp"),
        {
            "phone_number": "09123334443",
            "role": "seller",
            "referral_code": buyer_user.referral_code.lower(),
        },
        format="json",
    )
    assert request_response.status_code == 202

    verify_response = api_client.post(
        reverse("accounts:signup-verify-otp"),
        {
            "phone_number": "09123334443",
            "otp": otp_outbox.latest_code("signup"),
        },
        format="json",
    )

    assert verify_response.status_code == 201
    referee = User.objects.get(phone_number="+989123334443")
    assert referee.referred_by == buyer_user
    reward = Referral.objects.get(
        referrer=buyer_user,
        referee=referee,
    )
    assert reward.reward_value == 700_000
    buyer_user.refresh_from_db()
    assert buyer_user.referral_earnings == 700_000


@pytest.mark.api
@pytest.mark.django_db
def test_me_profile_can_be_updated(api_client, buyer_user) -> None:
    api_client.force_authenticate(user=buyer_user)

    response = api_client.patch(
        reverse("accounts:me"),
        {
            "first_name": "  علی ",
            "last_name": " محمدی ",
            "email": "USER@EXAMPLE.COM",
            "province": " تهران ",
            "city": " تهران ",
            "address": " خیابان ولیعصر ",
            "preferred_contact_method": "chat",
            "role": "admin",
        },
        format="json",
    )

    assert response.status_code == 200
    assert response.data["display_name"] == "علی محمدی"
    assert response.data["email"] == "user@example.com"
    assert response.data["province"] == "تهران"
    assert response.data["city"] == "تهران"
    assert response.data["address"] == "خیابان ولیعصر"
    assert response.data["preferred_contact_method"] == "chat"
    assert response.data["role"] == User.Role.BUYER


@pytest.mark.api
@pytest.mark.django_db
def test_business_profile_fields_are_limited_to_business_roles(
    api_client,
    buyer_user,
) -> None:
    api_client.force_authenticate(user=buyer_user)

    denied_response = api_client.patch(
        reverse("accounts:me"),
        {"business_name": "نمایشگاه غیرمجاز"},
        format="json",
    )
    buyer_user.role = User.Role.GALLERY
    buyer_user.save(update_fields=["role"])
    allowed_response = api_client.patch(
        reverse("accounts:me"),
        {
            "business_name": " رویال موتورز ",
            "business_phone": " 02191009100 ",
            "business_description": " فروش خودروهای وارداتی ",
        },
        format="json",
    )

    assert denied_response.status_code == 400
    assert allowed_response.status_code == 200
    assert allowed_response.data["business_name"] == "رویال موتورز"
    assert allowed_response.data["business_phone"] == "02191009100"


@pytest.mark.api
@pytest.mark.django_db
def test_gallery_business_images_are_compressed_to_webp(
    api_client,
    buyer_user,
    settings,
    tmp_path,
) -> None:
    settings.MEDIA_ROOT = tmp_path
    buyer_user.role = User.Role.GALLERY
    buyer_user.save(update_fields=["role"])
    source = BytesIO()
    Image.new("RGB", (2200, 1400), "gold").save(source, format="PNG")
    api_client.force_authenticate(user=buyer_user)

    response = api_client.patch(
        reverse("accounts:me"),
        {
            "business_cover": SimpleUploadedFile(
                "cover.png",
                source.getvalue(),
                content_type="image/png",
            )
        },
        format="multipart",
    )

    assert response.status_code == 200
    buyer_user.refresh_from_db()
    assert buyer_user.business_cover.name.endswith(".webp")
    assert buyer_user.business_cover.size <= 700 * 1024


@pytest.mark.api
@pytest.mark.django_db
def test_referral_reward_can_only_be_claimed_once(
    api_client,
    buyer_user,
) -> None:
    referee = User.objects.create_user(
        username="+989123334444",
        phone_number="+989123334444",
        role=User.Role.SELLER,
        referred_by=buyer_user,
    )
    reward = Referral.objects.create(
        referrer=buyer_user,
        referee=referee,
        code=buyer_user.referral_code,
        reward_value=500_000,
    )
    api_client.force_authenticate(user=buyer_user)

    first_response = api_client.post(
        reverse("accounts:referral-claim", args=[reward.pk]),
        {},
        format="json",
    )
    second_response = api_client.post(
        reverse("accounts:referral-claim", args=[reward.pk]),
        {},
        format="json",
    )

    assert first_response.status_code == 200
    assert first_response.data["referral_credit"] == 500_000
    assert second_response.status_code == 409
    buyer_user.refresh_from_db()
    assert buyer_user.referral_credit == 500_000


@pytest.mark.api
@pytest.mark.django_db
def test_referral_stats_and_claim_are_private(
    api_client,
    buyer_user,
) -> None:
    other_user = User.objects.create_user(
        username="+989123334445",
        phone_number="+989123334445",
        role=User.Role.BUYER,
    )
    referee = User.objects.create_user(
        username="+989123334446",
        phone_number="+989123334446",
        role=User.Role.SELLER,
        referred_by=buyer_user,
    )
    reward = Referral.objects.create(
        referrer=buyer_user,
        referee=referee,
        code=buyer_user.referral_code,
    )

    anonymous_stats = api_client.get(
        reverse("accounts:referral-stats")
    )
    api_client.force_authenticate(user=other_user)
    other_claim = api_client.post(
        reverse("accounts:referral-claim", args=[reward.pk]),
        {},
        format="json",
    )

    assert anonymous_stats.status_code == 401
    assert other_claim.status_code == 404


@pytest.mark.api
@pytest.mark.django_db
def test_user_can_request_allowed_role_change_once(
    api_client,
    buyer_user,
) -> None:
    api_client.force_authenticate(user=buyer_user)
    payload = {
        "to_role": "seller",
        "reason": "می‌خواهم خودروی شخصی خودم را بفروشم.",
    }

    first_response = api_client.post(
        reverse("accounts:role-change-list-create"),
        payload,
        format="json",
    )
    second_response = api_client.post(
        reverse("accounts:role-change-list-create"),
        payload,
        format="json",
    )

    assert first_response.status_code == 201
    assert first_response.data["from_role"] == "buyer"
    assert first_response.data["to_role"] == "seller"
    assert second_response.status_code == 400
    assert RoleChangeRequest.objects.filter(user=buyer_user).count() == 1


@pytest.mark.api
@pytest.mark.django_db
def test_user_cannot_self_assign_privileged_role(
    api_client,
    buyer_user,
) -> None:
    api_client.force_authenticate(user=buyer_user)

    response = api_client.post(
        reverse("accounts:role-change-list-create"),
        {
            "to_role": "admin",
            "reason": "این درخواست نباید اجازه داده شود.",
        },
        format="json",
    )

    assert response.status_code == 400
    assert RoleChangeRequest.objects.count() == 0


@pytest.mark.api
@pytest.mark.django_db
def test_staff_can_approve_role_change(
    api_client,
    buyer_user,
    staff_user,
) -> None:
    role_request = RoleChangeRequest.objects.create(
        user=buyer_user,
        from_role=User.Role.BUYER,
        to_role=User.Role.SELLER,
        reason="درخواست معتبر برای فروش خودرو",
    )

    api_client.force_authenticate(user=staff_user)
    response = api_client.post(
        reverse(
            "accounts:role-change-approve",
            args=[role_request.pk],
        ),
        {"admin_note": "مدارک بررسی و تأیید شد."},
        format="json",
    )

    assert response.status_code == 200
    assert response.data["status"] == "approved"
    buyer_user.refresh_from_db()
    assert buyer_user.role == User.Role.SELLER


@pytest.mark.api
@pytest.mark.django_db
def test_pending_role_requests_use_bounded_cursor_pages(
    api_client, buyer_user, staff_user, django_assert_max_num_queries
) -> None:
    applicants = User.objects.bulk_create(
        [User(username=f"role-applicant-{index}", role=User.Role.BUYER)
         for index in range(54)]
    )
    RoleChangeRequest.objects.bulk_create(
        [RoleChangeRequest(
            user=applicant,
            from_role=User.Role.BUYER,
            to_role=User.Role.SELLER,
            reason="فروش خودرو",
        ) for applicant in applicants]
    )
    url = reverse("accounts:role-change-pending")
    api_client.force_authenticate(user=buyer_user)
    assert api_client.get(url).status_code == 403

    api_client.force_authenticate(user=staff_user)
    with django_assert_max_num_queries(1):
        first = api_client.get(url)
    assert first.status_code == 200
    assert len(first.data["requests"]) == 20
    assert first.data["next"]
    assert "count" not in first.data

    with django_assert_max_num_queries(1):
        second = api_client.get(first.data["next"])
    assert second.status_code == 200
    assert len(second.data["requests"]) == 20
    assert set(item["id"] for item in first.data["requests"]).isdisjoint(
        item["id"] for item in second.data["requests"]
    )
    assert len(api_client.get(url, {"page_size": 5000}).data["requests"]) == 50


@pytest.mark.security
@pytest.mark.django_db
def test_non_staff_cannot_review_role_change(
    api_client,
    buyer_user,
) -> None:
    applicant = User.objects.create_user(
        username="+989123334447",
        phone_number="+989123334447",
        role=User.Role.BUYER,
    )
    role_request = RoleChangeRequest.objects.create(
        user=applicant,
        from_role=User.Role.BUYER,
        to_role=User.Role.SELLER,
        reason="درخواست معتبر برای تغییر نقش",
    )
    api_client.force_authenticate(user=buyer_user)

    response = api_client.post(
        reverse(
            "accounts:role-change-approve",
            args=[role_request.pk],
        ),
        {},
        format="json",
    )

    assert response.status_code == 403
    applicant.refresh_from_db()
    assert applicant.role == User.Role.BUYER


@pytest.mark.api
@pytest.mark.django_db
def test_verified_user_can_complete_profile_and_login_with_password(
    api_client,
    buyer_user,
) -> None:
    api_client.force_authenticate(user=buyer_user)

    complete_response = api_client.post(
        reverse("accounts:signup-complete"),
        {
            "full_name": "علی محمدی",
            "password": "Karvo-Secure-2026!",
            "password_confirmation": "Karvo-Secure-2026!",
            "accept_terms": True,
        },
        format="json",
    )

    assert complete_response.status_code == 200
    assert complete_response.data["user"]["display_name"] == "علی محمدی"
    assert complete_response.data["user"]["profile_completed_at"]

    api_client.force_authenticate(user=None)
    login_response = api_client.post(
        reverse("accounts:password-login"),
        {
            "identifier": "09121111111",
            "password": "Karvo-Secure-2026!",
        },
        format="json",
    )

    assert login_response.status_code == 200
    assert login_response.data["user"]["id"] == buyer_user.pk
    assert login_response.data["access"]
    assert login_response.data["refresh"]


@pytest.mark.api
@pytest.mark.django_db
def test_gallery_signup_completion_creates_only_a_gallery_business(
    api_client,
) -> None:
    gallery = User.objects.create_user(
        username="+989123334451",
        phone_number="+989123334451",
        role=User.Role.GALLERY,
        is_phone_verified=True,
    )
    api_client.force_authenticate(user=gallery)

    response = api_client.post(
        reverse("accounts:signup-complete"),
        {
            "full_name": "مریم احمدی",
            "password": "AzadGozar-Agency-2026!",
            "password_confirmation": "AzadGozar-Agency-2026!",
            "accept_terms": True,
            "business_name": "نمایشگاه ساحل خودرو",
            "business_phone": "01333334444",
            "province": "گیلان",
            "city": "انزلی",
            "address": "بلوار اصلی، پلاک ۲۰",
            "postal_code": "4313111111",
            "business_description": "فروش خودروهای وارداتی منطقه آزاد",
            "license_number": "GL-1405-100",
            "license_issuer": "اتحادیه نمایشگاه‌داران انزلی",
            "national_id": "14001234567",
        },
        format="json",
    )

    assert response.status_code == 200
    assert response.data["user"]["role"] == User.Role.GALLERY
    assert response.data["business_registration"] == {
        "id": response.data["user"]["business_access"]["id"],
        "kind": "gallery",
        "verification_status": "pending",
    }
    gallery.refresh_from_db()
    business = gallery.business_profile
    assert gallery.business_name == "نمایشگاه ساحل خودرو"
    assert business.name == "نمایشگاه ساحل خودرو"
    assert business.slug.startswith("نمایشگاه-ساحل-خودرو-")
    assert business.license_number == "GL-1405-100"
    assert business.national_id == "14001234567"
    assert business.verification_status == "pending"
    assert business.subscriptions.count() == 0


@pytest.mark.api
@pytest.mark.django_db
def test_agency_signup_completion_creates_an_independent_agency_business(
    api_client,
) -> None:
    agency = User.objects.create_user(
        username="+989123334453",
        phone_number="+989123334453",
        role=User.Role.AGENCY,
        is_phone_verified=True,
    )
    api_client.force_authenticate(user=agency)

    response = api_client.post(
        reverse("accounts:signup-complete"),
        {
            "full_name": "مریم احمدی",
            "password": "AzadGozar-Agency-2026!",
            "password_confirmation": "AzadGozar-Agency-2026!",
            "accept_terms": True,
            "business_name": "شرکت واردکننده ساحل خودرو",
            "business_phone": "01333334444",
            "province": "گیلان",
            "city": "انزلی",
            "address": "بلوار اصلی، پلاک ۲۱",
            "postal_code": "4313111112",
            "national_id": "14001234568",
            "company_registration_number": "123456",
            "authorized_representative_name": "مریم احمدی",
            "import_license_number": "IMP-1405-10",
            "import_license_issuer": "وزارت صنعت، معدن و تجارت",
            "represented_brands": ["Toyota", "Kia"],
        },
        format="json",
    )

    assert response.status_code == 200
    assert response.data["user"]["role"] == User.Role.AGENCY
    assert response.data["business_registration"]["kind"] == "agency"
    agency.refresh_from_db()
    business = agency.business_profile
    assert business.kind == "agency"
    assert business.company_registration_number == "123456"
    assert business.import_license_number == "IMP-1405-10"
    assert business.represented_brands == ["Toyota", "Kia"]
    assert business.subscriptions.count() == 0


@pytest.mark.api
@pytest.mark.django_db
def test_gallery_signup_requires_verification_profile_fields(api_client) -> None:
    gallery = User.objects.create_user(
        username="+989123334452",
        phone_number="+989123334452",
        role=User.Role.GALLERY,
        is_phone_verified=True,
    )
    api_client.force_authenticate(user=gallery)

    response = api_client.post(
        reverse("accounts:signup-complete"),
        {
            "full_name": "مریم احمدی",
            "password": "AzadGozar-Gallery-2026!",
            "password_confirmation": "AzadGozar-Gallery-2026!",
            "accept_terms": True,
            "business_name": "نمایشگاه ناقص",
        },
        format="json",
    )

    assert response.status_code == 400
    assert {
        "business_phone",
        "province",
        "city",
        "address",
        "postal_code",
        "license_number",
        "license_issuer",
    }.issubset(response.data)
    gallery.refresh_from_db()
    assert gallery.profile_completed_at is None


@pytest.mark.security
@pytest.mark.django_db
def test_signup_completion_requires_terms_and_matching_passwords(
    api_client,
    buyer_user,
) -> None:
    api_client.force_authenticate(user=buyer_user)

    response = api_client.post(
        reverse("accounts:signup-complete"),
        {
            "full_name": "علی محمدی",
            "password": "Karvo-Secure-2026!",
            "password_confirmation": "Different-Secure-2026!",
            "accept_terms": False,
        },
        format="json",
    )

    assert response.status_code == 400
    buyer_user.refresh_from_db()
    assert buyer_user.has_usable_password() is False
    assert buyer_user.terms_accepted_at is None


@pytest.mark.security
@pytest.mark.django_db
def test_password_login_returns_generic_error(api_client, buyer_user) -> None:
    buyer_user.set_password("Karvo-Secure-2026!")
    buyer_user.save(update_fields=["password"])

    wrong_password = api_client.post(
        reverse("accounts:password-login"),
        {
            "identifier": buyer_user.phone_number,
            "password": "wrong-password",
        },
        format="json",
    )
    unknown_user = api_client.post(
        reverse("accounts:password-login"),
        {
            "identifier": "unknown-user",
            "password": "wrong-password",
        },
        format="json",
    )

    assert wrong_password.status_code == 400
    assert unknown_user.status_code == 400
    assert wrong_password.data == unknown_user.data


@pytest.mark.regression
@pytest.mark.django_db
def test_new_superuser_gets_admin_role() -> None:
    superuser = User.objects.create_superuser(
        username="system-owner",
        password="Karvo-Secure-2026!",
    )

    assert superuser.role == User.Role.ADMIN


@pytest.mark.api
@pytest.mark.django_db
def test_password_can_be_reset_with_single_use_otp(
    api_client,
    buyer_user,
    otp_outbox,
) -> None:
    request_response = api_client.post(
        reverse("accounts:password-reset-request"),
        {"phone_number": "09121111111"},
        format="json",
    )
    assert request_response.status_code == 202

    payload = {
        "phone_number": "09121111111",
        "otp": otp_outbox.latest_code("password_reset"),
        "new_password": "New-Karvo-Secure-2026!",
        "password_confirmation": "New-Karvo-Secure-2026!",
    }
    confirm_response = api_client.post(
        reverse("accounts:password-reset-confirm"),
        payload,
        format="json",
    )
    reused_response = api_client.post(
        reverse("accounts:password-reset-confirm"),
        payload,
        format="json",
    )

    assert confirm_response.status_code == 200
    assert reused_response.status_code == 400
    buyer_user.refresh_from_db()
    assert buyer_user.check_password("New-Karvo-Secure-2026!")


@pytest.mark.security
@pytest.mark.django_db
def test_password_reset_request_does_not_reveal_account_existence(
    api_client,
    buyer_user,
    otp_outbox,
) -> None:
    existing_response = api_client.post(
        reverse("accounts:password-reset-request"),
        {"phone_number": buyer_user.phone_number},
        format="json",
    )

    cache.clear()
    missing_response = api_client.post(
        reverse("accounts:password-reset-request"),
        {"phone_number": "09129999999"},
        format="json",
    )

    assert existing_response.status_code == missing_response.status_code == 202
    assert existing_response.data["detail"] == missing_response.data["detail"]
    assert existing_response.data["expires_in"] == missing_response.data["expires_in"]
    assert existing_response.data["resend_in"] == missing_response.data["resend_in"]
    assert len(otp_outbox.messages) == 1
