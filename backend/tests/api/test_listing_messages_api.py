import pytest
from django.urls import reverse

from apps.accounts.models import User
from apps.catalog.models import ListingConversation, ListingMessage, VehicleListing
from tests.api.test_catalog_api import create_active_listing


def other_user(phone):
    return User.objects.create_user(username=phone, phone_number=phone, role=User.Role.BUYER)


@pytest.mark.api
@pytest.mark.django_db
def test_listing_conversation_is_private_and_persistent(api_client, buyer_user):
    owner = other_user("+989129999999")
    stranger = other_user("+989128888888")
    listing = create_active_listing(owner)
    endpoint = reverse("catalog:listing-conversation-list")

    assert api_client.post(endpoint, {"listing_id": listing.pk}, format="json").status_code == 401
    api_client.force_authenticate(user=buyer_user)
    opened = api_client.post(endpoint, {"listing_id": listing.pk}, format="json")
    assert opened.status_code == 201
    again = api_client.post(endpoint, {"listing_id": listing.pk}, format="json")
    assert again.status_code == 200
    assert opened.data["id"] == again.data["id"]
    assert ListingConversation.objects.count() == 1
    messages_url = reverse("catalog:listing-conversation-messages", args=[opened.data["id"]])
    assert api_client.post(messages_url, {"text": "   "}, format="json").status_code == 400
    sent = api_client.post(messages_url, {"text": "  سلام، خودرو موجود است؟  "}, format="json")
    assert sent.status_code == 201
    assert sent.data["text"] == "سلام، خودرو موجود است؟"
    assert api_client.get(messages_url).data["results"][0]["text"] == sent.data["text"]

    api_client.force_authenticate(user=stranger)
    assert api_client.get(endpoint).data["count"] == 0
    assert api_client.get(messages_url).status_code == 404
    assert api_client.post(messages_url, {"text": "مزاحم"}, format="json").status_code == 404
    assert ListingMessage.objects.count() == 1

    api_client.force_authenticate(user=owner)
    assert api_client.get(endpoint).data["results"][0]["last_message_text"] == "سلام، خودرو موجود است؟"
    reply = api_client.post(messages_url, {"text": "بله، موجود است."}, format="json")
    assert reply.status_code == 201
    assert reply.data["sender_id"] == owner.pk
    assert api_client.get(messages_url).data["count"] == 2


@pytest.mark.api
@pytest.mark.django_db
def test_messages_respect_listing_status_contact_choice_and_ownership(api_client, buyer_user):
    owner = other_user("+989127777777")
    listing = create_active_listing(owner)
    endpoint = reverse("catalog:listing-conversation-list")
    api_client.force_authenticate(user=owner)
    assert api_client.post(endpoint, {"listing_id": listing.pk}, format="json").status_code == 400

    api_client.force_authenticate(user=buyer_user)
    listing.status = VehicleListing.Status.PENDING
    listing.save(update_fields=["status"])
    assert api_client.post(endpoint, {"listing_id": listing.pk}, format="json").status_code == 400
    listing.status = VehicleListing.Status.ACTIVE
    listing.contact_preference = VehicleListing.ContactPreference.PHONE
    listing.save(update_fields=["status", "contact_preference"])
    assert api_client.post(endpoint, {"listing_id": listing.pk}, format="json").status_code == 400
    listing.contact_preference = VehicleListing.ContactPreference.CHAT
    listing.save(update_fields=["contact_preference"])
    opened = api_client.post(endpoint, {"listing_id": listing.pk}, format="json")
    assert opened.status_code == 201
    messages_url = reverse("catalog:listing-conversation-messages", args=[opened.data["id"]])
    api_client.force_authenticate(user=owner)
    assert api_client.post(messages_url, {"text": "شروع نابه‌جا"}, format="json").status_code == 403

    api_client.force_authenticate(user=buyer_user)
    assert api_client.post(messages_url, {"text": "سلام"}, format="json").status_code == 201
    listing.status = VehicleListing.Status.SOLD
    listing.save(update_fields=["status"])
    assert api_client.post(endpoint, {"listing_id": listing.pk}, format="json").status_code == 200
    assert api_client.post(messages_url, {"text": "متشکرم"}, format="json").status_code == 201
