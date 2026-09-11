from typing import Any, cast

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import OtpChallenge, Referral, RoleChangeRequest, User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = (
        "username",
        "phone_number",
        "role",
        "is_phone_verified",
        "referral_code",
        "is_staff",
        "is_active",
    )

    list_filter = (
        "role",
        "is_phone_verified",
        "is_staff",
        "is_active",
    )

    search_fields = (
        "username",
        "phone_number",
        "first_name",
        "last_name",
        "email",
        "referral_code",
    )

    fieldsets = cast(
        Any,
        [
            *(UserAdmin.fieldsets or ()),
            (
                "Additional information",
                {
                    "fields": (
                        "phone_number",
                        "role",
                        "is_phone_verified",
                        "referral_code",
                        "referred_by",
                        "referral_credit",
                        "referral_earnings",
                        "province",
                        "city",
                        "address",
                        "preferred_contact_method",
                        "business_name",
                        "business_phone",
                        "business_description",
                        "business_logo",
                        "business_cover",
                    ),
                },
            ),
        ],
    )

    add_fieldsets = cast(
        Any,
        [
            *(UserAdmin.add_fieldsets or ()),
            (
                "Additional information",
                {
                    "fields": (
                        "phone_number",
                        "role",
                        "is_phone_verified",
                    ),
                },
            ),
        ],
    )


@admin.register(Referral)
class ReferralAdmin(admin.ModelAdmin):
    list_display = (
        "referrer",
        "referee",
        "reward_type",
        "reward_value",
        "reward_claimed",
        "created_at",
    )
    list_filter = ("reward_type", "reward_claimed", "created_at")
    search_fields = (
        "referrer__phone_number",
        "referee__phone_number",
        "code",
    )
    readonly_fields = ("created_at", "claimed_at")


@admin.register(OtpChallenge)
class OtpChallengeAdmin(admin.ModelAdmin):
    list_display = (
        "phone_number",
        "purpose",
        "attempts",
        "request_count",
        "expires_at",
        "updated_at",
    )
    list_filter = ("purpose", "expires_at")
    search_fields = ("phone_number",)
    readonly_fields = (
        "code_hash",
        "metadata",
        "created_at",
        "updated_at",
    )


@admin.register(RoleChangeRequest)
class RoleChangeRequestAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "from_role",
        "to_role",
        "status",
        "reviewed_by",
        "created_at",
    )
    list_filter = ("status", "from_role", "to_role", "created_at")
    search_fields = (
        "user__phone_number",
        "user__first_name",
        "user__last_name",
        "reason",
    )
    readonly_fields = ("created_at", "updated_at", "reviewed_at")
