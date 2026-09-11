from django.contrib import admin

from apps.service_requests.models import ServiceRequest, ServiceRequestEvent


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

