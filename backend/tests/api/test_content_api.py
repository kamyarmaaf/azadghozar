from io import BytesIO

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from PIL import Image

from apps.content.models import EducationalVideo, FrequentlyAskedQuestion


def image_upload(name: str = "cover.jpg") -> SimpleUploadedFile:
    output = BytesIO()
    Image.new("RGB", (320, 180), (15, 23, 42)).save(output, format="JPEG")
    return SimpleUploadedFile(name, output.getvalue(), content_type="image/jpeg")


def create_video(**overrides) -> EducationalVideo:
    data = {
        "title": "آموزش خرید خودرو",
        "slug": "car-buying-guide",
        "category": EducationalVideo.Category.EDUCATION,
        "thumbnail": image_upload(),
        "video": SimpleUploadedFile("guide.mp4", b"video", content_type="video/mp4"),
        "is_published": True,
    }
    data.update(overrides)
    return EducationalVideo.objects.create(**data)


@pytest.mark.api
@pytest.mark.django_db
def test_public_video_list_is_paginated_and_hides_drafts(api_client) -> None:
    create_video()
    create_video(title="پیش‌نویس", slug="draft", is_published=False)

    response = api_client.get(reverse("content:educational-video-list"))

    assert response.status_code == 200
    assert response.data["count"] == 1
    assert response.data["results"][0]["slug"] == "car-buying-guide"


@pytest.mark.api
@pytest.mark.django_db
def test_video_detail_increments_view_count(api_client) -> None:
    video = create_video()

    response = api_client.get(
        reverse("content:educational-video-detail", kwargs={"slug": video.slug})
    )

    assert response.status_code == 200
    assert response.data["view_count"] == 1
    video.refresh_from_db()
    assert video.view_count == 1


@pytest.mark.api
@pytest.mark.django_db
def test_video_list_filters_by_category(api_client) -> None:
    create_video()
    create_video(
        title="قوانین تردد",
        slug="traffic-rules",
        category=EducationalVideo.Category.RULES,
    )

    response = api_client.get(
        reverse("content:educational-video-list"),
        {"category": "rules"},
    )

    assert response.status_code == 200
    assert response.data["count"] == 1
    assert response.data["results"][0]["category"] == "rules"


@pytest.mark.api
@pytest.mark.django_db
def test_public_faq_list_is_paginated_and_hides_drafts(api_client) -> None:
    FrequentlyAskedQuestion.objects.create(
        question="چطور آگهی ثبت کنم؟",
        answer="پس از ورود، ثبت آگهی را انتخاب کنید.",
        category=FrequentlyAskedQuestion.Category.SELLING,
        is_published=True,
    )
    FrequentlyAskedQuestion.objects.create(
        question="سؤال پیش‌نویس",
        answer="پاسخ پیش‌نویس",
        is_published=False,
    )

    response = api_client.get(reverse("content:faq-list"))

    assert response.status_code == 200
    assert response.data["count"] == 1
    assert response.data["results"][0]["category_label"] == "فروش خودرو"


@pytest.mark.api
@pytest.mark.django_db
def test_faq_list_supports_search_and_category(api_client) -> None:
    FrequentlyAskedQuestion.objects.create(
        question="مدارک خرید خودرو چیست؟",
        answer="مدارک هویتی و مالکیت لازم است.",
        category=FrequentlyAskedQuestion.Category.BUYING,
        is_published=True,
    )
    FrequentlyAskedQuestion.objects.create(
        question="نحوه ثبت‌نام",
        answer="شماره همراه خود را وارد کنید.",
        category=FrequentlyAskedQuestion.Category.ACCOUNT,
        is_published=True,
    )

    response = api_client.get(
        reverse("content:faq-list"),
        {"category": "buying", "q": "مدارک"},
    )

    assert response.status_code == 200
    assert response.data["count"] == 1
    assert response.data["results"][0]["category"] == "buying"
