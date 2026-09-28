"""Private listing conversations between an interested user and the listing owner."""

from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import serializers, status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.viewsets import GenericViewSet

from apps.catalog.models import ListingConversation, ListingMessage, VehicleListing
from apps.catalog.realtime import broadcast_listing_message


class ConversationPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 50


class MessagePagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = "page_size"
    max_page_size = 100


class ConversationSerializer(serializers.ModelSerializer):
    other_party_name = serializers.SerializerMethodField()
    listing_id = serializers.IntegerField(read_only=True, allow_null=True)
    buyer_id = serializers.IntegerField(read_only=True)
    owner_id = serializers.IntegerField(read_only=True)

    class Meta:
        model = ListingConversation
        fields = (
            "id", "listing_id", "listing_title", "buyer_id", "owner_id",
            "other_party_name", "last_message_text", "last_message_at", "created_at",
        )

    def get_other_party_name(self, conversation):
        user = self.context["request"].user
        other = conversation.owner if user.pk == conversation.buyer_id else conversation.buyer
        return other.get_full_name().strip() or (
            "صاحب آگهی" if user.pk == conversation.buyer_id else "کاربر آزادگذر"
        )


class MessageSerializer(serializers.ModelSerializer):
    sender_id = serializers.IntegerField(read_only=True)

    class Meta:
        model = ListingMessage
        fields = ("id", "sender_id", "text", "created_at")
        read_only_fields = fields


class StartConversationSerializer(serializers.Serializer):
    listing_id = serializers.IntegerField(min_value=1)


class SendMessageSerializer(serializers.Serializer):
    text = serializers.CharField(max_length=2000, allow_blank=False, trim_whitespace=True)


class ListingConversationViewSet(GenericViewSet):
    permission_classes = (IsAuthenticated,)
    pagination_class = ConversationPagination
    throttle_classes = (ScopedRateThrottle,)
    throttle_scope = "listing_conversation_create"
    serializer_class = ConversationSerializer

    def get_throttles(self):
        if self.action == "create":
            self.throttle_scope = "listing_conversation_create"
            return super().get_throttles()
        if self.action == "messages" and self.request.method == "POST":
            self.throttle_scope = "listing_message_create"
            return super().get_throttles()
        return []

    def get_queryset(self):
        user = self.request.user
        return ListingConversation.objects.filter(
            Q(buyer=user) | Q(owner=user)
        ).select_related("buyer", "owner", "listing").order_by("-last_message_at", "-id")

    def list(self, request):
        page = self.paginate_queryset(self.get_queryset())
        return self.get_paginated_response(self.get_serializer(page, many=True).data)

    def create(self, request):
        serializer = StartConversationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        listing = get_object_or_404(
            VehicleListing.objects.select_related("owner"),
            pk=serializer.validated_data["listing_id"],
        )
        if listing.owner_id == request.user.pk:
            raise ValidationError({"listing_id": "You cannot message your own listing."})
        existing = ListingConversation.objects.filter(listing=listing, buyer=request.user).first()
        if existing:
            return Response(self.get_serializer(existing).data, status=status.HTTP_200_OK)
        if listing.status != VehicleListing.Status.ACTIVE or listing.contact_preference == VehicleListing.ContactPreference.PHONE:
            raise ValidationError({"listing_id": "Messaging is not available for this listing."})
        with transaction.atomic():
            conversation, created = ListingConversation.objects.get_or_create(
                listing=listing,
                buyer=request.user,
                defaults={
                    "owner": listing.owner,
                    "listing_title": f"{listing.brand_name} {listing.model_name}"[:240],
                },
            )
        return Response(self.get_serializer(conversation).data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    @action(detail=True, methods=("get", "post"), pagination_class=MessagePagination)
    def messages(self, request, pk=None):
        conversation = self.get_object()
        if request.method == "GET":
            page = self.paginate_queryset(
                conversation.messages.select_related("sender").order_by("-created_at", "-id")
            )
            return self.get_paginated_response(MessageSerializer(page, many=True).data)
        if request.user.pk == conversation.owner_id and not conversation.last_message_at:
            raise PermissionDenied("Only the interested user can start a conversation.")
        serializer = SendMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            message = ListingMessage.objects.create(
                conversation=conversation,
                sender=request.user,
                text=serializer.validated_data["text"],
            )
            ListingConversation.objects.filter(pk=conversation.pk).update(
                last_message_text=message.text[:200],
                last_message_at=message.created_at,
                updated_at=timezone.now(),
            )
            transaction.on_commit(
                lambda: broadcast_listing_message(conversation, message)
            )
        return Response(MessageSerializer(message).data, status=status.HTTP_201_CREATED)
