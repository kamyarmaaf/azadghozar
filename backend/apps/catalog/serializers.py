from django.db import transaction
from django.db.models import F
from django.core.files.storage import Storage, default_storage
from rest_framework import serializers

from apps.image_processing import (
    InvalidImageUpload,
    compress_uploaded_image,
)

from apps.catalog.models import (
    Brand,
    ListingFavorite,
    VehicleListing,
    VehicleListingImage,
    VehicleModel,
    VehicleTrim,
)


class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = (
            "id",
            "name",
            "name_fa",
            "slug",
            "logo_url",
            "country",
            "is_active",
            "sort_order",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def validate_name(self, value: str) -> str:
        queryset = Brand.objects.filter(name__iexact=value.strip())
        if self.instance is not None:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError(
                "A brand with this name already exists."
            )
        return value.strip()


class VehicleModelSerializer(serializers.ModelSerializer):
    brand_slug = serializers.CharField(source="brand.slug", read_only=True)
    brand_name = serializers.CharField(source="brand.name", read_only=True)

    class Meta:
        model = VehicleModel
        fields = (
            "id",
            "brand",
            "brand_slug",
            "brand_name",
            "name",
            "name_fa",
            "slug",
            "body_type",
            "is_active",
            "sort_order",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "brand_slug",
            "brand_name",
            "created_at",
            "updated_at",
        )

    def validate(self, attrs: dict) -> dict:
        brand = attrs.get("brand")
        name = str(attrs.get("name", "")).strip()

        if self.instance is not None:
            brand = brand or self.instance.brand
            name = name or self.instance.name

        if brand is not None and name:
            queryset = VehicleModel.objects.filter(
                brand=brand,
                name__iexact=name,
            )
            if self.instance is not None:
                queryset = queryset.exclude(pk=self.instance.pk)
            if queryset.exists():
                raise serializers.ValidationError(
                    {"name": "This model already exists for the brand."}
                )
            attrs["name"] = name

        return attrs


class VehicleTrimSerializer(serializers.ModelSerializer):
    model_slug = serializers.CharField(
        source="vehicle_model.slug",
        read_only=True,
    )
    model_name = serializers.CharField(
        source="vehicle_model.name",
        read_only=True,
    )
    brand_slug = serializers.CharField(
        source="vehicle_model.brand.slug",
        read_only=True,
    )
    brand_name = serializers.CharField(
        source="vehicle_model.brand.name",
        read_only=True,
    )

    class Meta:
        model = VehicleTrim
        fields = (
            "id",
            "vehicle_model",
            "model_slug",
            "model_name",
            "brand_slug",
            "brand_name",
            "name",
            "name_fa",
            "slug",
            "production_start_year",
            "production_end_year",
            "engine_displacement_cc",
            "power_hp",
            "torque_nm",
            "transmission",
            "fuel_type",
            "drivetrain",
            "is_active",
            "sort_order",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "model_slug",
            "model_name",
            "brand_slug",
            "brand_name",
            "created_at",
            "updated_at",
        )

    def validate(self, attrs: dict) -> dict:
        vehicle_model = attrs.get("vehicle_model")
        name = str(attrs.get("name", "")).strip()
        start_year = attrs.get("production_start_year")
        end_year = attrs.get("production_end_year")

        if self.instance is not None:
            vehicle_model = vehicle_model or self.instance.vehicle_model
            name = name or self.instance.name
            if "production_start_year" not in attrs:
                start_year = self.instance.production_start_year
            if "production_end_year" not in attrs:
                end_year = self.instance.production_end_year

        if vehicle_model is not None and name:
            queryset = VehicleTrim.objects.filter(
                vehicle_model=vehicle_model,
                name__iexact=name,
            )
            if self.instance is not None:
                queryset = queryset.exclude(pk=self.instance.pk)
            if queryset.exists():
                raise serializers.ValidationError(
                    {"name": "This trim already exists for the model."}
                )
            attrs["name"] = name

        if (
            start_year is not None
            and end_year is not None
            and end_year < start_year
        ):
            raise serializers.ValidationError(
                {
                    "production_end_year": (
                        "Production end year cannot be earlier than "
                        "production start year."
                    )
                }
            )

        return attrs


MAX_LISTING_IMAGE_BYTES = 1536 * 1024
TARGET_LISTING_IMAGE_BYTES = 1024 * 1024
MAX_LISTING_VIDEO_BYTES = 200 * 1024 * 1024
ALLOWED_VIDEO_TYPES = {
    "video/mp4",
    "video/webm",
    "video/quicktime",
}


class VehicleListingImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = VehicleListingImage
        fields = (
            "id",
            "file",
            "sort_order",
            "file_size",
            "mime_type",
        )
        read_only_fields = fields


class ListingCoverMixin:
    def get_cover_image(self, obj: VehicleListing) -> str | None:
        path = getattr(obj, "cover_image_path", None)
        if not path:
            return None
        url = default_storage.url(path)
        request = getattr(self, "context", {}).get("request")
        return request.build_absolute_uri(url) if request else url


class VehicleListingCandidateSerializer(
    ListingCoverMixin,
    serializers.ModelSerializer,
):
    cover_image = serializers.SerializerMethodField()
    price_type_label = serializers.CharField(
        source="get_price_type_display",
        read_only=True,
    )

    class Meta:
        model = VehicleListing
        fields = (
            "id",
            "brand_name",
            "model_name",
            "trim_name",
            "production_year",
            "city",
            "mileage",
            "price_type",
            "price_type_label",
            "price",
            "cover_image",
        )
        read_only_fields = fields


class VehicleListingSummarySerializer(
    ListingCoverMixin,
    serializers.ModelSerializer,
):
    cover_image = serializers.SerializerMethodField()
    plate_type_label = serializers.CharField(
        source="get_plate_type_display",
        read_only=True,
    )
    transmission_label = serializers.CharField(
        source="get_transmission_display",
        read_only=True,
    )

    class Meta:
        model = VehicleListing
        fields = (
            "id",
            "brand_name",
            "model_name",
            "trim_name",
            "production_year",
            "plate_type",
            "plate_type_label",
            "city",
            "transmission",
            "transmission_label",
            "mileage",
            "price_type",
            "price",
            "is_instant_sale",
            "is_special_sale",
            "is_inspected",
            "cover_image",
        )
        read_only_fields = fields


class AdminPendingListingSerializer(
    ListingCoverMixin,
    serializers.ModelSerializer,
):
    """Only the fields needed to render a moderation row."""

    owner_name = serializers.CharField(source="owner.display_name", read_only=True)
    cover_image = serializers.SerializerMethodField()

    class Meta:
        model = VehicleListing
        fields = (
            "id",
            "owner_name",
            "brand_name",
            "model_name",
            "trim_name",
            "production_year",
            "price",
            "created_at",
            "cover_image",
        )
        read_only_fields = fields


class VehicleListingComparisonSerializer(
    ListingCoverMixin,
    serializers.ModelSerializer,
):
    cover_image = serializers.SerializerMethodField()
    plate_type_label = serializers.CharField(
        source="get_plate_type_display",
        read_only=True,
    )
    transmission_label = serializers.CharField(
        source="get_transmission_display",
        read_only=True,
    )
    fuel_type_label = serializers.CharField(
        source="get_fuel_type_display",
        read_only=True,
    )
    drivetrain_label = serializers.CharField(
        source="get_drivetrain_display",
        read_only=True,
    )
    condition_label = serializers.CharField(
        source="get_condition_display",
        read_only=True,
    )
    body_condition_label = serializers.CharField(
        source="get_body_condition_display",
        read_only=True,
    )
    chassis_condition_label = serializers.CharField(
        source="get_chassis_condition_display",
        read_only=True,
    )
    engine_condition_label = serializers.CharField(
        source="get_engine_condition_display",
        read_only=True,
    )
    price_type_label = serializers.CharField(
        source="get_price_type_display",
        read_only=True,
    )

    class Meta:
        model = VehicleListing
        fields = (
            "id",
            "brand_name",
            "model_name",
            "trim_name",
            "production_year",
            "plate_type",
            "plate_type_label",
            "city",
            "color",
            "body_type",
            "engine_description",
            "transmission",
            "transmission_label",
            "fuel_type",
            "fuel_type_label",
            "drivetrain",
            "drivetrain_label",
            "mileage",
            "condition",
            "condition_label",
            "body_condition",
            "body_condition_label",
            "chassis_condition",
            "chassis_condition_label",
            "engine_condition",
            "engine_condition_label",
            "insurance_months",
            "price_type",
            "price_type_label",
            "price",
            "is_inspected",
            "cover_image",
        )
        read_only_fields = fields


class VehicleListingSerializer(serializers.ModelSerializer):
    images = serializers.ListField(
        child=serializers.FileField(),
        write_only=True,
        required=False,
        max_length=10,
    )
    retained_image_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        write_only=True,
        required=False,
    )
    remove_video = serializers.BooleanField(write_only=True, required=False)
    image_files = VehicleListingImageSerializer(
        source="images",
        many=True,
        read_only=True,
    )
    owner_name = serializers.CharField(
        source="owner.display_name",
        read_only=True,
    )
    owner_role = serializers.CharField(source="owner.role", read_only=True)
    owner_role_label = serializers.CharField(
        source="owner.get_role_display",
        read_only=True,
    )
    owner_business_logo = serializers.ImageField(
        source="owner.business_logo",
        read_only=True,
    )
    business_slug = serializers.CharField(source="business.slug", read_only=True)
    business_name = serializers.CharField(source="business.name", read_only=True)
    business_kind = serializers.CharField(source="business.kind", read_only=True)
    status_label = serializers.CharField(
        source="get_status_display",
        read_only=True,
    )
    plate_type_label = serializers.CharField(
        source="get_plate_type_display", read_only=True
    )
    transmission_label = serializers.CharField(
        source="get_transmission_display", read_only=True
    )
    fuel_type_label = serializers.CharField(
        source="get_fuel_type_display", read_only=True
    )
    drivetrain_label = serializers.CharField(
        source="get_drivetrain_display", read_only=True
    )
    condition_label = serializers.CharField(
        source="get_condition_display", read_only=True
    )
    body_condition_label = serializers.CharField(
        source="get_body_condition_display", read_only=True
    )
    chassis_condition_label = serializers.CharField(
        source="get_chassis_condition_display", read_only=True
    )
    engine_condition_label = serializers.CharField(
        source="get_engine_condition_display", read_only=True
    )
    ownership_status_label = serializers.CharField(
        source="get_ownership_status_display", read_only=True
    )
    price_type_label = serializers.CharField(
        source="get_price_type_display", read_only=True
    )
    contact_preference_label = serializers.CharField(
        source="get_contact_preference_display", read_only=True
    )

    class Meta:
        model = VehicleListing
        fields = (
            "id",
            "owner",
            "owner_name",
            "owner_role",
            "owner_role_label",
            "owner_business_logo",
            "business_slug",
            "business_name",
            "business_kind",
            "status",
            "status_label",
            "brand_name",
            "model_name",
            "trim_name",
            "production_year",
            "plate_type",
            "plate_type_label",
            "free_zone",
            "province",
            "city",
            "color",
            "body_type",
            "engine_description",
            "transmission",
            "transmission_label",
            "fuel_type",
            "fuel_type_label",
            "drivetrain",
            "drivetrain_label",
            "mileage",
            "condition",
            "condition_label",
            "body_condition",
            "body_condition_label",
            "chassis_condition",
            "chassis_condition_label",
            "engine_condition",
            "engine_condition_label",
            "insurance_months",
            "ownership_status",
            "ownership_status_label",
            "description",
            "price_type",
            "price_type_label",
            "price",
            "trade_possible",
            "is_instant_sale",
            "is_special_sale",
            "is_inspected",
            "view_count",
            "contact_number",
            "contact_preference",
            "contact_preference_label",
            "video",
            "images",
            "retained_image_ids",
            "remove_video",
            "image_files",
            "rejection_reason",
            "published_at",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "owner",
            "owner_name",
            "owner_role",
            "owner_role_label",
            "owner_business_logo",
            "business_slug",
            "business_name",
            "business_kind",
            "status",
            "status_label",
            "plate_type_label",
            "transmission_label",
            "fuel_type_label",
            "drivetrain_label",
            "condition_label",
            "body_condition_label",
            "chassis_condition_label",
            "engine_condition_label",
            "ownership_status_label",
            "price_type_label",
            "contact_preference_label",
            "is_instant_sale",
            "is_special_sale",
            "is_inspected",
            "view_count",
            "image_files",
            "rejection_reason",
            "published_at",
            "created_at",
            "updated_at",
        )

    def validate_images(self, uploads: list) -> list:
        compressed = []
        for upload in uploads:
            try:
                compressed.append(
                    compress_uploaded_image(
                        upload,
                        max_input_bytes=MAX_LISTING_IMAGE_BYTES,
                        target_bytes=TARGET_LISTING_IMAGE_BYTES,
                        max_dimension=1920,
                    )
                )
            except InvalidImageUpload as exc:
                raise serializers.ValidationError(str(exc)) from exc
        return compressed

    def validate_video(self, upload):
        if not upload:
            return upload
        if upload.size > MAX_LISTING_VIDEO_BYTES:
            raise serializers.ValidationError(
                "Video must be no larger than 200 MB."
            )
        if getattr(upload, "content_type", "") not in ALLOWED_VIDEO_TYPES:
            raise serializers.ValidationError(
                "Only MP4, WebM, and MOV videos are accepted."
            )
        return upload

    def validate_contact_number(self, value: str) -> str:
        normalized = value.strip().replace(" ", "").replace("-", "")
        digits = normalized.lstrip("+")
        if not digits.isdigit() or not 10 <= len(digits) <= 12:
            raise serializers.ValidationError(
                "Enter a valid Iranian phone number."
            )
        return normalized

    def validate(self, attrs: dict) -> dict:
        attrs = super().validate(attrs)
        uploads = attrs.get("images", [])
        retained_image_ids = attrs.get("retained_image_ids")
        plate_type = attrs.get("plate_type")
        free_zone = str(attrs.get("free_zone", "")).strip()
        price_type = attrs.get("price_type")
        price = attrs.get("price")

        if self.instance is not None:
            plate_type = plate_type or self.instance.plate_type
            if "free_zone" not in attrs:
                free_zone = self.instance.free_zone
            price_type = price_type or self.instance.price_type
            if "price" not in attrs:
                price = self.instance.price

        if plate_type == VehicleListing.PlateType.FREE_ZONE and not free_zone:
            raise serializers.ValidationError(
                {"free_zone": "Free-zone name is required for this plate."}
            )
        if price_type != VehicleListing.PriceType.CONTACT and price is None:
            raise serializers.ValidationError(
                {"price": "Price is required unless contact pricing is used."}
            )
        if price_type == VehicleListing.PriceType.CONTACT:
            attrs["price"] = None

        if self.instance is None:
            if retained_image_ids:
                raise serializers.ValidationError(
                    {"retained_image_ids": "Existing images cannot be used for a new listing."}
                )
            image_count = len(uploads)
        else:
            existing_ids = list(
                self.instance.images.order_by("sort_order", "id").values_list(
                    "id", flat=True
                )
            )
            if retained_image_ids is None:
                retained_image_ids = existing_ids
            else:
                retained_image_ids = list(dict.fromkeys(retained_image_ids))
                invalid_ids = set(retained_image_ids) - set(existing_ids)
                if invalid_ids:
                    raise serializers.ValidationError(
                        {
                            "retained_image_ids": (
                                "One or more retained images do not belong to this listing."
                            )
                        }
                    )
            attrs["retained_image_ids"] = retained_image_ids
            image_count = len(retained_image_ids) + len(uploads)

        if not 5 <= image_count <= 10:
            raise serializers.ValidationError(
                {"images": "A listing must contain between 5 and 10 images."}
            )

        if attrs.get("remove_video") and attrs.get("video"):
            raise serializers.ValidationError(
                {"video": "Upload a new video or remove the current one, not both."}
            )

        for field in (
            "brand_name",
            "model_name",
            "trim_name",
            "free_zone",
            "province",
            "city",
            "color",
            "body_type",
            "engine_description",
            "description",
        ):
            if field in attrs:
                attrs[field] = str(attrs[field]).strip()
        return attrs

    @transaction.atomic
    def create(self, validated_data: dict) -> VehicleListing:
        uploads = validated_data.pop("images", [])
        validated_data.pop("retained_image_ids", None)
        validated_data.pop("remove_video", None)
        listing = VehicleListing.objects.create(**validated_data)
        for index, upload in enumerate(uploads):
            VehicleListingImage.objects.create(
                listing=listing,
                file=upload,
                sort_order=index,
                file_size=upload.size,
                mime_type="image/webp",
            )
        return listing
    @transaction.atomic
    def update(self, instance, validated_data: dict) -> VehicleListing:
        uploads = validated_data.pop("images", [])
        retained_image_ids = validated_data.pop("retained_image_ids", None)
        remove_video = validated_data.pop("remove_video", False)

        files_to_delete: list[tuple[Storage, str]] = []
        if retained_image_ids is not None:
            retained_set = set(retained_image_ids)
            removed_images = list(instance.images.exclude(id__in=retained_set))
            files_to_delete.extend(
                (image.file.storage, image.file.name)
                for image in removed_images
                if image.file.name
            )
            instance.images.exclude(id__in=retained_set).delete()

            instance.images.update(sort_order=F("sort_order") + 100)
            retained_images = {
                image.id: image
                for image in instance.images.filter(id__in=retained_set)
            }
            for sort_order, image_id in enumerate(retained_image_ids):
                image = retained_images[image_id]
                image.sort_order = sort_order
                image.save(update_fields=["sort_order"])

        next_sort_order = instance.images.count()
        for offset, upload in enumerate(uploads):
            VehicleListingImage.objects.create(
                listing=instance,
                file=upload,
                sort_order=next_sort_order + offset,
                file_size=upload.size,
                mime_type="image/webp",
            )

        replacing_video = bool(validated_data.get("video"))
        if (remove_video or replacing_video) and instance.video:
            files_to_delete.append((instance.video.storage, instance.video.name))
        if remove_video:
            validated_data["video"] = None

        listing = super().update(instance, validated_data)
        request = self.context.get("request")
        if not getattr(getattr(request, "user", None), "is_staff", False):
            listing.status = VehicleListing.Status.PENDING
            listing.rejection_reason = ""
            listing.published_at = None
            listing.save(
                update_fields=[
                    "status",
                    "rejection_reason",
                    "published_at",
                    "updated_at",
                ]
            )

        if files_to_delete:
            def delete_files_after_commit() -> None:
                for storage, name in files_to_delete:
                    storage.delete(name)

            transaction.on_commit(delete_files_after_commit)
        return listing


class ListingFavoriteSerializer(serializers.ModelSerializer):
    listing = VehicleListingSerializer(read_only=True)
    listing_id = serializers.PrimaryKeyRelatedField(
        source="listing",
        queryset=VehicleListing.objects.all(),
        write_only=True,
    )

    class Meta:
        model = ListingFavorite
        fields = ("id", "listing_id", "listing", "created_at")
        read_only_fields = ("id", "listing", "created_at")

    def validate_listing_id(self, listing: VehicleListing) -> VehicleListing:
        if listing.status != VehicleListing.Status.ACTIVE:
            raise serializers.ValidationError(
                "Only active listings can be added to favorites."
            )
        return listing

    def create(self, validated_data: dict) -> ListingFavorite:
        favorite, _ = ListingFavorite.objects.get_or_create(
            user=validated_data["user"],
            listing=validated_data["listing"],
        )
        return favorite
