from io import BytesIO

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from PIL import Image

from apps.content.models import (
    AboutPage,
    AboutStatistic,
    AboutTrustItem,
    Article,
    ContactMessage,
    ContactPage,
    EducationalVideo,
    FrequentlyAskedQuestion,
    TeamMember,
)


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


def create_article(**overrides) -> Article:
    data = {
        "title": "بررسی نیسان ترا",
        "slug": "nissan-terra-review",
        "summary": "بررسی تخصصی طراحی و امکانات نیسان ترا.",
        "content": "## طراحی\nطراحی بدنه و کابین را بررسی می‌کنیم.",
        "category": Article.Category.REVIEW,
        "cover_image": image_upload("article-cover.jpg"),
        "is_published": True,
    }
    data.update(overrides)
    return Article.objects.create(**data)


@pytest.mark.api
@pytest.mark.django_db
def test_public_article_list_is_paginated_and_hides_drafts(api_client) -> None:
    create_article()
    create_article(title="پیش‌نویس", slug="draft-article", is_published=False)

    response = api_client.get(reverse("content:article-list"))

    assert response.status_code == 200
    assert response.data["count"] == 1
    assert response.data["results"][0]["slug"] == "nissan-terra-review"


@pytest.mark.api
@pytest.mark.django_db
def test_article_detail_increments_view_count(api_client) -> None:
    article = create_article()

    response = api_client.get(
        reverse("content:article-detail", kwargs={"slug": article.slug})
    )

    assert response.status_code == 200
    assert response.data["view_count"] == 1
    assert response.data["cover_image_url"].startswith("http://testserver/media/")


@pytest.mark.api
@pytest.mark.django_db
def test_article_list_supports_search_and_category(api_client) -> None:
    create_article()
    create_article(
        title="راهنمای خرید خودرو",
        slug="car-buying-guide-article",
        category=Article.Category.BUYING_GUIDE,
    )

    response = api_client.get(
        reverse("content:article-list"),
        {"category": "review", "q": "نیسان"},
    )

    assert response.status_code == 200
    assert response.data["count"] == 1
    assert response.data["results"][0]["category"] == "review"


def create_about_page(**overrides) -> AboutPage:
    data = {
        "intro": "آزاد گذر بازار تخصصی خودروهای مناطق آزاد است.",
        "mission_text": "ایجاد شفافیت در معاملات خودرو.",
        "vision_text": "تبدیل شدن به مرجع معتبر بازار خودرو.",
        "values_text": "شفافیت، امنیت و احترام به کاربران.",
        "hero_image": image_upload("about-hero.jpg"),
        "is_published": True,
    }
    data.update(overrides)
    return AboutPage.objects.create(**data)


@pytest.mark.api
@pytest.mark.django_db
def test_about_page_returns_published_content_and_nested_sections(api_client) -> None:
    page = create_about_page()
    AboutStatistic.objects.create(about_page=page, label="آگهی فعال", value=120, icon="listing")
    TeamMember.objects.create(about_page=page, name="عضو تیم", role="مدیر محصول")
    AboutTrustItem.objects.create(about_page=page, title="شفافیت", description="اطلاعات قابل بررسی")

    response = api_client.get(reverse("content:about"))

    assert response.status_code == 200
    assert response.data["hero_title"] == "درباره آزاد گذر"
    assert response.data["hero_image_url"].startswith("http://testserver/media/")
    assert response.data["statistics"][0]["value"] == 120
    assert response.data["team_members"][0]["role"] == "مدیر محصول"
    assert response.data["trust_items"][0]["title"] == "شفافیت"


@pytest.mark.api
@pytest.mark.django_db
def test_about_page_hides_draft(api_client) -> None:
    create_about_page(is_published=False)

    response = api_client.get(reverse("content:about"))

    assert response.status_code == 404


def create_contact_page(**overrides) -> ContactPage:
    data = {
        "subtitle": "تیم پشتیبانی آزاد گذر آماده پاسخ‌گویی است.",
        "address": "منطقه آزاد انزلی",
        "phone": "013-00000000",
        "email": "info@example.com",
        "working_hours": "شنبه تا پنج‌شنبه",
        "is_published": True,
    }
    data.update(overrides)
    return ContactPage.objects.create(**data)


@pytest.mark.api
@pytest.mark.django_db
def test_contact_page_returns_published_information_and_subjects(api_client) -> None:
    create_contact_page()

    response = api_client.get(reverse("content:contact"))

    assert response.status_code == 200
    assert response.data["address"] == "منطقه آزاد انزلی"
    assert response.data["subjects"][0] == {
        "value": "services",
        "label": "سؤال درباره خدمات",
    }


@pytest.mark.api
@pytest.mark.django_db
def test_contact_message_is_validated_and_stored(api_client) -> None:
    payload = {
        "name": "کاربر تست",
        "email": "USER@example.com",
        "phone": "09121112233",
        "subject": "technical",
        "message": "برای استفاده از سایت به راهنمایی نیاز دارم.",
    }

    response = api_client.post(
        reverse("content:contact-message-create"),
        payload,
        format="json",
    )

    assert response.status_code == 201
    message = ContactMessage.objects.get(public_id=response.data["id"])
    assert message.email == "user@example.com"
    assert message.phone == "+989121112233"
    assert message.status == ContactMessage.Status.NEW


@pytest.mark.api
@pytest.mark.django_db
def test_contact_message_rejects_short_message(api_client) -> None:
    response = api_client.post(
        reverse("content:contact-message-create"),
        {
            "name": "کاربر تست",
            "email": "user@example.com",
            "subject": "other",
            "message": "کوتاه",
        },
        format="json",
    )

    assert response.status_code == 400
    assert ContactMessage.objects.count() == 0
