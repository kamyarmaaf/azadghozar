from django.contrib import admin

from apps.service_requests.models import (
    ListingVisitRequest,
    ServiceRequest,
    ServiceRequestEvent,
)


@admin.register(ServiceRequest)
class ServiceRequestAdmin(admin.ModelAdmin):
    list_display = (
        "public_id",
        "service_type",
        "contact_name",
        "status",
        "priority",
        "assigned_expert",
        "created_at",
    )
    list_filter = ("service_type", "status", "priority")
    search_fields = ("contact_name", "contact_phone", "public_id")
    raw_id_fields = ("requester", "listing", "assigned_expert")
    readonly_fields = ("public_id", "completed_at", "created_at", "updated_at")


@admin.register(ServiceRequestEvent)
class ServiceRequestEventAdmin(admin.ModelAdmin):
    list_display = (
        "service_request",
        "actor",
        "from_status",
        "to_status",
        "created_at",
    )
    raw_id_fields = ("service_request", "actor")
    readonly_fields = (
        "service_request",
        "actor",
        "from_status",
        "to_status",
        "note",
        "created_at",
    )

    def has_add_permission(self, request) -> bool:
        return False


@admin.register(ListingVisitRequest)
class ListingVisitRequestAdmin(admin.ModelAdmin):
    list_display = (
        "public_id",
        "listing",
        "contact_name",
        "scheduled_for",
        "status",
        "created_at",
    )
    list_filter = ("status", "scheduled_for", "created_at")
    search_fields = (
        "public_id",
        "contact_name",
        "contact_phone",
        "listing__brand_name",
        "listing__model_name",
    )
    raw_id_fields = ("listing", "requester")
    readonly_fields = ("public_id", "created_at", "updated_at", "responded_at")
    date_hierarchy = "scheduled_for"
