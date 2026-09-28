import pytest

from apps.content.models import SupportConversation, SupportMessage


@pytest.mark.django_db
def test_support_chat_requires_authentication(api_client):
    response = api_client.get("/api/v1/content/chat/")
    assert response.status_code == 401


@pytest.mark.django_db
def test_user_can_send_and_read_support_messages(api_client, buyer_user):
    api_client.force_authenticate(user=buyer_user)
    sent = api_client.post("/api/v1/content/chat/", {"text": "  برای خرید خودرو راهنمایی می‌خواهم.  "}, format="json")
    assert sent.status_code == 201
    assert sent.data["text"] == "برای خرید خودرو راهنمایی می‌خواهم."
    assert sent.data["sender"] == "user"

    conversation = SupportConversation.objects.get(user=buyer_user)
    SupportMessage.objects.create(conversation=conversation, sender=SupportMessage.Sender.SUPPORT, text="حتماً، چطور کمک کنیم؟")
    received = api_client.get("/api/v1/content/chat/")
    assert received.status_code == 200
    assert [item["sender"] for item in received.data["messages"]] == ["user", "support"]


@pytest.mark.django_db
def test_user_cannot_read_another_users_chat(api_client, buyer_user, django_user_model):
    other = django_user_model.objects.create_user(username="other-chat", phone_number="+989121234567")
    conversation = SupportConversation.objects.create(user=other)
    SupportMessage.objects.create(conversation=conversation, sender=SupportMessage.Sender.USER, text="private")
    api_client.force_authenticate(user=buyer_user)
    response = api_client.get("/api/v1/content/chat/")
    assert response.status_code == 200
    assert response.data["messages"] == []
