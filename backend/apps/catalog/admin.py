from django import forms
from django.contrib import admin
from django.core.files.uploadedfile import UploadedFile
from django.utils import timezone

from apps.image_processing import InvalidImageUpload, compress_uploaded_image

from apps.catalog.models import (
    Brand,
    ListingFavorite,
    VehicleListing,
    VehicleListingImage,
    VehicleModel,
    VehicleTrim,
)


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ("name", "name_fa", "country", "is_active", "sort_order")
    list_filter = ("is_active", "country")
    search_fields = ("name", "name_fa", "slug")
    ordering = ("sort_order", "name")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(VehicleModel)
class VehicleModelAdmin(admin.ModelAdmin):
    list_display = ("name", "brand", "body_type", "is_active", "sort_order")
    list_filter = ("is_active", "body_type", "brand")
    search_fields = ("name", "name_fa", "slug", "brand__name")
    autocomplete_fields = ("brand",)
    ordering = ("brand__name", "sort_order", "name")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(VehicleTrim)
class VehicleTrimAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "vehicle_model",
        "production_start_year",
        "production_end_year",
        "transmission",
        "fuel_type",
        "is_active",
    )
    list_filter = (
        "is_active",
        "transmission",
        "fuel_type",
        "drivetrain",
    )
    search_fields = (
        "name",
        "name_fa",
        "slug",
        "vehicle_model__name",
        "vehicle_model__brand__name",
    )
    autocomplete_fields = ("vehicle_model",)
    ordering = ("vehicle_model__brand__name", "vehicle_model__name", "name")
    prepopulated_fields = {"slug": ("name",)}


class VehicleListingImageAdminForm(forms.ModelForm):
    class Meta:
        model = VehicleListingImage
        fields = "__all__"

    def clean_file(self):
        upload = self.cleaned_data.get("file")
        if not isinstance(upload, UploadedFile):
            return upload
        try:
            compressed = compress_uploaded_image(
                upload,
                max_input_bytes=1536 * 1024,
                target_bytes=1024 * 1024,
                max_dimension=1920,
            )
        except InvalidImageUpload as exc:
            raise forms.ValidationError(str(exc)) from exc
        self.instance.file_size = compressed.size
        self.instance.mime_type = "image/webp"
        return compressed


class VehicleListingImageInline(admin.TabularInline):
    model = VehicleListingImage
    form = VehicleListingImageAdminForm
    extra = 0
    readonly_fields = ("file_size", "mime_type", "created_at")


@admin.register(VehicleListing)
class VehicleListingAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "brand_name",
        "model_name",
        "owner",
        "business",
        "city",
        "price",
        "status",
        "view_count",
        "created_at",
    )
    list_display_links = ("id", "brand_name", "model_name")
    list_editable = ("status",)
    list_filter = (
        "status",
        "plate_type",
        "province",
        "is_instant_sale",
        "is_special_sale",
        "is_inspected",
        "created_at",
    )
    search_fields = (
        "brand_name",
        "model_name",
        "trim_name",
        "owner__phone_number",
        "contact_number",
    )
    readonly_fields = ("view_count", "created_at", "updated_at")
    autocomplete_fields = ("owner", "business")
    inlines = (VehicleListingImageInline,)
    list_select_related = ("owner", "business")
    date_hierarchy = "created_at"
    actions = ("approve_selected", "mark_pending", "mark_sold")

    def save_model(self, request, obj, form, change) -> None:
        if obj.status == VehicleListing.Status.ACTIVE:
            obj.published_at = obj.published_at or timezone.now()
            obj.rejection_reason = ""
        elif obj.status in {
            VehicleListing.Status.PENDING,
            VehicleListing.Status.REJECTED,
        }:
            obj.published_at = None
        super().save_model(request, obj, form, change)

    @admin.action(description="تایید و انتشار آگهی‌های انتخاب‌شده")
    def approve_selected(self, request, queryset) -> None:
        updated = queryset.update(
            status=VehicleListing.Status.ACTIVE,
            rejection_reason="",
            published_at=timezone.now(),
            updated_at=timezone.now(),
        )
        self.message_user(request, f"{updated} آگهی تایید و منتشر شد.")

    @admin.action(description="بازگرداندن آگهی‌های انتخاب‌شده به صف بررسی")
    def mark_pending(self, request, queryset) -> None:
        updated = queryset.update(
            status=VehicleListing.Status.PENDING,
            rejection_reason="",
            published_at=None,
            updated_at=timezone.now(),
        )
        self.message_user(request, f"{updated} آگهی در انتظار بررسی قرار گرفت.")

    @admin.action(description="علامت‌گذاری آگهی‌های انتخاب‌شده به‌عنوان فروخته‌شده")
    def mark_sold(self, request, queryset) -> None:
        updated = queryset.update(
            status=VehicleListing.Status.SOLD,
            updated_at=timezone.now(),
        )
        self.message_user(request, f"{updated} آگهی فروخته‌شده ثبت شد.")


@admin.register(ListingFavorite)
class ListingFavoriteAdmin(admin.ModelAdmin):
    list_display = ("user", "listing", "created_at")
    search_fields = (
        "user__phone_number",
        "listing__brand_name",
        "listing__model_name",
    )
    autocomplete_fields = ("user", "listing")
    list_select_related = ("user", "listing")
    readonly_fields = ("created_at", "updated_at")
