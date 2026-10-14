from django.contrib import admin

from apps.businesses.models import (
    BusinessMembership,
    BusinessProfile,
    BusinessSubscription,
)


@admin.register(BusinessProfile)
class BusinessProfileAdmin(admin.ModelAdmin):
    list_display = ("name", "kind", "verification_status", "city", "owner")
    list_filter = ("kind", "verification_status", "province")
    search_fields = (
        "name",
        "phone",
        "license_number",
        "national_id",
        "company_registration_number",
        "import_license_number",
        "owner__phone_number",
    )
    raw_id_fields = ("owner", "reviewed_by")
    readonly_fields = ("slug", "verified_at", "created_at", "updated_at")


@admin.register(BusinessMembership)
class BusinessMembershipAdmin(admin.ModelAdmin):
    list_display = ("business", "user", "role", "status")
    list_filter = ("role", "status")
    raw_id_fields = ("business", "user", "created_by")


@admin.register(BusinessSubscription)
class BusinessSubscriptionAdmin(admin.ModelAdmin):
    list_display = ("business", "plan", "status", "starts_at", "ends_at")
    list_filter = ("plan", "status")
    raw_id_fields = ("business", "requested_by", "reviewed_by")
