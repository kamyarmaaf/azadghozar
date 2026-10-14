from uuid import uuid4

import pytest

from apps.content.models import FrequentlyAskedQuestion, SupportConversation, SupportMessage


@pytest.fixture(autouse=True)
def disable_external_ai(monkeypatch):
    monkeypatch.delenv("AI_SUPPORT_API_KEY", raising=False)


@pytest.mark.django_db
def test_guest_chat_requires_a_valid_session_id(api_client):
    response = api_client.get("/api/v1/content/chat/")
    assert response.status_code == 400

    response = api_client.get("/api/v1/content/chat/?session_id=invalid")
    assert response.status_code == 400


@pytest.mark.django_db
def test_guest_can_send_message_and_receive_persisted_ai_reply(api_client):
    session_id = uuid4()
    FrequentlyAskedQuestion.objects.create(
        question="چطور آگهی خودرو ثبت کنم؟",
        answer="از دکمه ثبت آگهی استفاده کنید.",
        is_published=True,
    )

    sent = api_client.post(
        "/api/v1/content/chat/",
        {"text": "برای ثبت آگهی راهنمایی می‌خواهم.", "session_id": str(session_id)},
        format="json",
    )

    assert sent.status_code == 201
    assert sent.data["sender"] == "user"
    assert sent.data["reply"]["sender"] == "ai"
    assert sent.data["reply"]["text"] == "از دکمه ثبت آگهی استفاده کنید."
    conversation = SupportConversation.objects.get(guest_id=session_id)
    assert list(conversation.messages.values_list("sender", flat=True)) == ["user", "ai"]

    received = api_client.get(f"/api/v1/content/chat/?session_id={session_id}")
    assert received.status_code == 200
    assert len(received.data["messages"]) == 2


@pytest.mark.django_db
def test_authenticated_user_can_send_and_read_support_messages(api_client, buyer_user):
    api_client.force_authenticate(user=buyer_user)
    sent = api_client.post(
        "/api/v1/content/chat/",
        {"text": "  برای خرید خودرو راهنمایی می‌خواهم.  "},
        format="json",
    )
    assert sent.status_code == 201
    assert sent.data["text"] == "برای خرید خودرو راهنمایی می‌خواهم."
    assert sent.data["reply"]["sender"] == "ai"

    conversation = SupportConversation.objects.get(user=buyer_user)
    SupportMessage.objects.create(
        conversation=conversation,
        sender=SupportMessage.Sender.SUPPORT,
        text="کارشناس هم پاسخ داد.",
    )
    received = api_client.get("/api/v1/content/chat/")
    assert received.status_code == 200
    assert [item["sender"] for item in received.data["messages"]] == ["user", "ai", "support"]


@pytest.mark.django_db
def test_user_cannot_read_another_users_chat(api_client, buyer_user, django_user_model):
    other = django_user_model.objects.create_user(username="other-chat", phone_number="+989121234567")
    conversation = SupportConversation.objects.create(user=other)
    SupportMessage.objects.create(conversation=conversation, sender=SupportMessage.Sender.USER, text="private")
    api_client.force_authenticate(user=buyer_user)

    response = api_client.get("/api/v1/content/chat/")

    assert response.status_code == 200
    assert response.data["messages"] == []
