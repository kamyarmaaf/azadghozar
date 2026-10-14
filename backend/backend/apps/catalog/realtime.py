"""Authenticated, read-only message events over WebSocket."""

import asyncio
import logging
import time

from asgiref.sync import async_to_sync
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.layers import get_channel_layer
from django.urls import path
from rest_framework_simplejwt.authentication import JWTAuthentication

logger = logging.getLogger(__name__)
CHAT_PROTOCOL = "azadgozar-chat-v1"


def user_group(user_id):
    return f"listing_messages_user_{user_id}"


@database_sync_to_async
def authenticate_access_token(token):
    try:
        auth = JWTAuthentication()
        validated = auth.get_validated_token(token)
        user = auth.get_user(validated)
        return user.pk, validated["exp"]
    except Exception:  # Malformed, expired, revoked or inactive token.
        return None


class ListingJWTMiddleware:
    """Browser sockets carry their short-lived JWT as a subprotocol, never a URL."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        protocols = scope.get("subprotocols", [])
        authenticated = None
        if len(protocols) == 2 and protocols[0] == CHAT_PROTOCOL:
            authenticated = await authenticate_access_token(protocols[1])
        scope = {**scope, "listing_user": authenticated}
        return await self.app(scope, receive, send)


class ListingEventConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        authenticated = self.scope.get("listing_user")
        if not authenticated:
            await self.close(code=4401)
            return
        self.user_id, expires_at = authenticated
        self.group_name = user_group(self.user_id)
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept(subprotocol=CHAT_PROTOCOL)
        self.expiry_task = asyncio.create_task(self.close_when_expired(expires_at))
        self.heartbeat_task = asyncio.create_task(self.send_heartbeats())

    async def close_when_expired(self, expires_at):
        await asyncio.sleep(max(0, expires_at - time.time()))
        await self.close(code=4401)

    async def send_heartbeats(self):
        while True:
            await asyncio.sleep(25)
            await self.send_json({"type": "ping"})

    async def disconnect(self, code):
        if hasattr(self, "expiry_task"):
            self.expiry_task.cancel()
        if hasattr(self, "heartbeat_task"):
            self.heartbeat_task.cancel()
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        # Writes go through the authenticated, rate-limited HTTP endpoint.
        await self.close(code=4400)

    async def listing_message(self, event):
        await self.send_json({"type": "message.created", **event["payload"]})


websocket_urlpatterns = [
    path("ws/catalog/messages/", ListingEventConsumer.as_asgi()),
]


def broadcast_listing_message(conversation, message):
    """Called after the database commit; delivery failure cannot undo a saved message."""
    layer = get_channel_layer()
    if layer is None:
        return
    payload = {
        "conversation_id": conversation.pk,
        "message": {
            "id": message.pk,
            "sender_id": message.sender_id,
            "text": message.text,
            "created_at": message.created_at.isoformat(),
        },
    }
    for user_id in {conversation.buyer_id, conversation.owner_id}:
        try:
            async_to_sync(layer.group_send)(
                user_group(user_id), {"type": "listing.message", "payload": payload}
            )
        except Exception:
            logger.exception("Could not publish listing message event for user %s", user_id)
