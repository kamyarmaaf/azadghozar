"""WebSocket permissions and HTTP-to-WebSocket message delivery."""

from asgiref.sync import async_to_sync, sync_to_async
from channels.testing import WebsocketCommunicator
from django.urls import reverse
from rest_framework_simplejwt.tokens import AccessToken
import pytest

from apps.accounts.models import User
from apps.catalog.realtime import CHAT_PROTOCOL
from config.asgi import application
from tests.api.test_catalog_api import create_active_listing


def socket(token, origin=b"http://localhost:3000"):
    return WebsocketCommunicator(
        application,
        "/ws/catalog/messages/",
        headers=[(b"origin", origin)],
        subprotocols=[CHAT_PROTOCOL, token],
    )


@pytest.mark.api
@pytest.mark.django_db(transaction=True)
def test_only_authenticated_allowed_origins_connect(buyer_user):
    token = str(AccessToken.for_user(buyer_user))

    async def scenario():
        for client in (
            socket("invalid-token"),
            socket(token, b"http://another.example"),
        ):
            accepted, _ = await client.connect()
            assert not accepted
            await client.wait()

        client = socket(token)
        accepted, protocol = await client.connect()
        assert accepted and protocol == CHAT_PROTOCOL
        await client.disconnect()

    async_to_sync(scenario)()


@pytest.mark.api
@pytest.mark.django_db(transaction=True)
def test_http_message_is_pushed_only_to_the_two_participants(api_client, buyer_user):
    owner = User.objects.create_user(username="+989129999991", phone_number="+989129999991", role=User.Role.SELLER)
    stranger = User.objects.create_user(username="+989129999992", phone_number="+989129999992", role=User.Role.BUYER)
    listing = create_active_listing(owner)
    api_client.force_authenticate(user=buyer_user)
    created = api_client.post(reverse("catalog:listing-conversation-list"), {"listing_id": listing.pk})
    assert created.status_code == 201
    messages_url = reverse("catalog:listing-conversation-messages", args=[created.data["id"]])

    async def scenario():
        buyer_socket = socket(str(AccessToken.for_user(buyer_user)))
        owner_socket = socket(str(AccessToken.for_user(owner)))
        stranger_socket = socket(str(AccessToken.for_user(stranger)))
        clients = (buyer_socket, owner_socket, stranger_socket)
        try:
            for client in clients:
                assert (await client.connect())[0]
            response = await sync_to_async(api_client.post, thread_sensitive=True)(
                messages_url, {"text": "آیا موجود است؟"}, format="json"
            )
            assert response.status_code == 201
            for client in (buyer_socket, owner_socket):
                event = await client.receive_json_from(timeout=2)
                assert event["type"] == "message.created"
                assert event["conversation_id"] == created.data["id"]
                assert event["message"]["id"] == response.data["id"]
                assert event["message"]["text"] == "آیا موجود است؟"
            assert await stranger_socket.receive_nothing(timeout=0.2)
        finally:
            for client in clients:
                await client.disconnect()

    async_to_sync(scenario)()
