from io import BytesIO

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.urls import reverse
from PIL import Image

from apps.accounts.models import User


def sample_image(name="portrait.png"):
    buffer = BytesIO()
    Image.new("RGB", (1800, 1200), "#4676a0").save(buffer, format="PNG")
    return SimpleUploadedFile(name, buffer.getvalue(), content_type="image/png")


@pytest.mark.api
@pytest.mark.django_db
def test_authenticated_profile_photo_is_recompressed_and_scoped(api_client, buyer_user, tmp_path):
    endpoint = reverse("accounts:me")
    assert api_client.patch(endpoint, {"profile_photo": sample_image()}, format="multipart").status_code == 401

    buyer_user.first_name = "Test"
    buyer_user.save(update_fields=["first_name"])
    with override_settings(MEDIA_ROOT=tmp_path):
        api_client.force_authenticate(user=buyer_user)
        response = api_client.patch(endpoint, {"profile_photo": sample_image()}, format="multipart")
        assert response.status_code == 200, response.data
        buyer_user.refresh_from_db()
        path = tmp_path / buyer_user.profile_photo.name
        assert path.exists()
        assert path.stat().st_size <= 250 * 1024
        assert buyer_user.profile_photo.name.startswith(f"users/{buyer_user.pk}/profile/")
        assert buyer_user.profile_photo.name.endswith(".webp")
        with Image.open(path) as saved:
            assert saved.format == "WEBP"
            assert max(saved.size) <= 512
        assert response.data["profile_photo"]
        assert api_client.get(endpoint).data["profile_photo"] == response.data["profile_photo"]
        assert response.data["first_name"] == "Test"

        other = User.objects.create_user(username="other-photo-user", role=User.Role.BUYER)
        api_client.force_authenticate(user=other)
        assert api_client.get(endpoint).data["profile_photo"] is None


@pytest.mark.api
@pytest.mark.django_db
def test_profile_photo_rejects_invalid_images_without_changing_existing_photo(api_client, buyer_user, tmp_path):
    endpoint = reverse("accounts:me")
    with override_settings(MEDIA_ROOT=tmp_path):
        api_client.force_authenticate(user=buyer_user)
        assert api_client.patch(endpoint, {"profile_photo": sample_image()}, format="multipart").status_code == 200
        buyer_user.refresh_from_db()
        original = buyer_user.profile_photo.name
        response = api_client.patch(
            endpoint,
            {"profile_photo": SimpleUploadedFile("fake.png", b"not-an-image", content_type="image/png")},
            format="multipart",
        )
        assert response.status_code == 400
        assert "profile_photo" in response.data
        buyer_user.refresh_from_db()
        assert buyer_user.profile_photo.name == original


@pytest.mark.api
@pytest.mark.django_db
@pytest.mark.parametrize(
    "role",
    [
        User.Role.GALLERY,
        User.Role.AGENCY,
        User.Role.EXPERT,
        User.Role.ADMIN,
    ],
)
def test_profile_photo_is_only_available_to_buyers_and_sellers(
    api_client,
    buyer_user,
    tmp_path,
    role,
):
    endpoint = reverse("accounts:me")
    buyer_user.role = role
    buyer_user.save(update_fields=["role"])

    with override_settings(MEDIA_ROOT=tmp_path):
        api_client.force_authenticate(user=buyer_user)
        response = api_client.patch(
            endpoint,
            {"profile_photo": sample_image()},
            format="multipart",
        )

    assert response.status_code == 400
    assert "profile_photo" in response.data
    assert api_client.get(endpoint).data["profile_photo"] is None
