from django.db import transaction
from rest_framework import serializers

from apps.accounts.models import User
from apps.accounts.services.otp import normalize_phone_number
from apps.catalog.models import VehicleListing
from apps.service_requests.models import ServiceRequest, ServiceRequestEvent
from apps.service_requests.services import update_service_request


class ServiceRequestCreateSerializer(serializers.ModelSerializer):
    details = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=3000,
    )
    listing = serializers.PrimaryKeyRelatedField(
        queryset=VehicleListing.objects.filter(
            status=VehicleListing.Status.ACTIVE
        ),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = ServiceRequest
        fields = (
            "service_type",
            "contact_name",
            "contact_phone",
            "vehicle_type",
            "details",
            "listing",
        )

    def validate_contact_name(self, value: str) -> str:
        return value.strip()

    def validate_contact_phone(self, value: str) -> str:
        return normalize_phone_number(value)

    @transaction.atomic
    def create(self, validated_data: dict) -> ServiceRequest:
        service_request = ServiceRequest.objects.create(**validated_data)
        ServiceRequestEvent.objects.create(
            service_request=service_request,
            actor=service_request.requester,
            from_status="",
            to_status=ServiceRequest.Status.NEW,
            note="Service request created.",
        )
        return service_request


class ServiceRequestSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(source="public_id", read_only=True)
    service_type_label = serializers.CharField(
        source="get_service_type_display",
        read_only=True,
    )
    status_label = serializers.CharField(
        source="get_status_display",
        read_only=True,
    )
    priority_label = serializers.CharField(
        source="get_priority_display",
        read_only=True,
    )
    requester_name = serializers.SerializerMethodField()
    assigned_expert_name = serializers.SerializerMethodField()
    listing_title = serializers.SerializerMethodField()

    class Meta:
        model = ServiceRequest
        fields = (
            "id",
            "service_type",
            "service_type_label",
            "contact_name",
            "contact_phone",
            "vehicle_type",
            "details",
            "listing",
            "listing_title",
            "requester_name",
            "assigned_expert",
            "assigned_expert_name",
            "status",
            "status_label",
            "priority",
            "priority_label",
            "scheduled_for",
            "admin_note",
            "expert_note",
            "completed_at",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields

    def get_requester_name(self, obj: ServiceRequest) -> str:
        return obj.requester.display_name if obj.requester else obj.contact_name

    def get_assigned_expert_name(self, obj: ServiceRequest) -> str:
        return obj.assigned_expert.display_name if obj.assigned_expert else ""

    def get_listing_title(self, obj: ServiceRequest) -> str:
        return str(obj.listing) if obj.listing else ""


class AdminServiceRequestUpdateSerializer(serializers.ModelSerializer):
    assigned_expert = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role=User.Role.EXPERT, is_active=True),
        required=False,
        allow_null=True,
    )
    admin_note = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=3000,
    )

    class Meta:
        model = ServiceRequest
        fields = (
            "status",
            "priority",
            "assigned_expert",
            "scheduled_for",
            "admin_note",
        )

    def update(
        self,
        instance: ServiceRequest,
        validated_data: dict,
    ) -> ServiceRequest:
        return update_service_request(
            request_id=instance.pk,
            changes=validated_data,
            actor=self.context["request"].user,
        )


class ExpertServiceRequestUpdateSerializer(serializers.ModelSerializer):
    status = serializers.ChoiceField(
        choices=(
            ServiceRequest.Status.IN_PROGRESS,
            ServiceRequest.Status.COMPLETED,
        ),
    )
    expert_note = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=5000,
    )

    class Meta:
        model = ServiceRequest
        fields = ("status", "expert_note")

    def update(
        self,
        instance: ServiceRequest,
        validated_data: dict,
    ) -> ServiceRequest:
        return update_service_request(
            request_id=instance.pk,
            changes=validated_data,
            actor=self.context["request"].user,
        )


class ExpertOptionSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="display_name", read_only=True)

    class Meta:
        model = User
        fields = ("id", "name", "phone_number")
        read_only_fields = fields

