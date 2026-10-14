from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import serializers

from apps.businesses.models import (
    BusinessMembership,
    BusinessProfile,
    BusinessSubscription,
)

User = get_user_model()


class PublicBusinessSerializer(serializers.ModelSerializer):
    logo = serializers.ImageField(source="owner.business_logo", read_only=True)
    cover = serializers.ImageField(source="owner.business_cover", read_only=True)
    listing_count = serializers.IntegerField(read_only=True, default=0)
    total_views = serializers.IntegerField(read_only=True, default=0)
    brands = serializers.SerializerMethodField()

    class Meta:
        model = BusinessProfile
        fields = (
            "id",
            "kind",
            "name",
            "slug",
            "phone",
            "province",
            "city",
            "address",
            "description",
            "established_year",
            "working_hours",
            "website",
            "verification_status",
            "verified_at",
            "logo",
            "cover",
            "listing_count",
            "total_views",
            "brands",
            "represented_brands",
        )
        read_only_fields = fields

    def get_brands(self, obj: BusinessProfile) -> list[str]:
        if not self.context.get("include_brands", False):
            return []
        return list(
            obj.listings.filter(status="active")
            .order_by("brand_name")
            .values_list("brand_name", flat=True)
            .distinct()[:24]
        )


class BusinessProfileSerializer(PublicBusinessSerializer):
    class Meta:
        model = BusinessProfile
        fields = PublicBusinessSerializer.Meta.fields + (
            "license_number",
            "national_id",
            "postal_code",
            "license_issuer",
            "license_expires_at",
            "company_registration_number",
            "economic_code",
            "authorized_representative_name",
            "import_license_number",
            "import_license_issuer",
            "import_license_expires_at",
            "business_card_number",
            "verification_note",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "slug",
            "kind",
            "verification_status",
            "verification_note",
            "verified_at",
            "logo",
            "cover",
            "listing_count",
            "total_views",
            "brands",
            "created_at",
            "updated_at",
        )

    def validate(self, attrs: dict) -> dict:
        attrs = super().validate(attrs)
        instance = self.instance
        if instance is None:
            return attrs

        def value(field: str):
            return attrs.get(field, getattr(instance, field))

        common_fields = {
            "name": "نام کسب‌وکار الزامی است.",
            "phone": "تلفن ثابت کسب‌وکار الزامی است.",
            "province": "استان محل فعالیت الزامی است.",
            "city": "شهر محل فعالیت الزامی است.",
            "address": "آدرس کامل کسب‌وکار الزامی است.",
            "postal_code": "کد پستی کسب‌وکار الزامی است.",
        }
        errors = {
            field: message
            for field, message in common_fields.items()
            if not str(value(field) or "").strip()
        }
        if instance.kind == BusinessProfile.Kind.GALLERY:
            agency_only_fields = {
                "company_registration_number",
                "economic_code",
                "authorized_representative_name",
                "import_license_number",
                "import_license_issuer",
                "import_license_expires_at",
                "business_card_number",
                "represented_brands",
            }
            forbidden = agency_only_fields.intersection(self.initial_data)
            if forbidden:
                errors.update(
                    {
                        field: "این فیلد فقط برای شرکت واردکننده خودرو است."
                        for field in forbidden
                    }
                )
            gallery_fields = {
                "license_number": "شماره پروانه کسب نمایشگاه الزامی است.",
                "license_issuer": "مرجع صادرکننده پروانه کسب الزامی است.",
            }
            errors.update(
                {
                    field: message
                    for field, message in gallery_fields.items()
                    if not str(value(field) or "").strip()
                }
            )
        else:
            gallery_only_fields = {
                "license_number",
                "license_issuer",
                "license_expires_at",
            }
            forbidden = gallery_only_fields.intersection(self.initial_data)
            if forbidden:
                errors.update(
                    {
                        field: "این فیلد فقط برای نمایشگاه خودرو است."
                        for field in forbidden
                    }
                )
            agency_fields = {
                "national_id": "شناسه ملی شرکت الزامی است.",
                "company_registration_number": "شماره ثبت شرکت الزامی است.",
                "authorized_representative_name": "نام نماینده قانونی شرکت الزامی است.",
                "import_license_number": "شماره مجوز واردات الزامی است.",
                "import_license_issuer": "مرجع صادرکننده مجوز واردات الزامی است.",
            }
            errors.update(
                {
                    field: message
                    for field, message in agency_fields.items()
                    if not str(value(field) or "").strip()
                }
            )
            if not value("represented_brands"):
                errors["represented_brands"] = (
                    "حداقل یک برند وارداتی را وارد کنید."
                )
        if errors:
            raise serializers.ValidationError(errors)
        return attrs

    @transaction.atomic
    def update(
        self,
        instance: BusinessProfile,
        validated_data: dict,
    ) -> BusinessProfile:
        review_fields = {
            "name",
            "phone",
            "province",
            "city",
            "address",
            "license_number",
            "national_id",
            "postal_code",
            "license_issuer",
            "license_expires_at",
            "company_registration_number",
            "economic_code",
            "authorized_representative_name",
            "import_license_number",
            "import_license_issuer",
            "import_license_expires_at",
            "business_card_number",
            "represented_brands",
        }
        changed_review_data = any(
            field in validated_data
            and validated_data[field] != getattr(instance, field)
            for field in review_fields
        )
        profile = super().update(instance, validated_data)
        should_return_to_review = (
            profile.verification_status
            == BusinessProfile.VerificationStatus.REJECTED
            and bool(validated_data)
        ) or (
            profile.verification_status
            == BusinessProfile.VerificationStatus.VERIFIED
            and changed_review_data
        )
        if should_return_to_review:
            profile.verification_status = (
                BusinessProfile.VerificationStatus.PENDING
            )
            profile.verification_note = ""
            profile.verified_at = None
            profile.save(
                update_fields=(
                    "verification_status",
                    "verification_note",
                    "verified_at",
                    "updated_at",
                )
            )

        owner = profile.owner
        owner.business_name = profile.name
        owner.business_phone = profile.phone
        owner.business_description = profile.description
        owner.province = profile.province
        owner.city = profile.city
        owner.address = profile.address
        owner.save(
            update_fields=(
                "business_name",
                "business_phone",
                "business_description",
                "province",
                "city",
                "address",
            )
        )
        return profile


class BusinessMembershipSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.display_name", read_only=True)
    phone_number = serializers.CharField(
        source="user.phone_number",
        read_only=True,
    )

    class Meta:
        model = BusinessMembership
        fields = (
            "id",
            "user",
            "user_name",
            "phone_number",
            "role",
            "status",
            "can_manage_listings",
            "can_manage_members",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "user",
            "user_name",
            "phone_number",
            "created_at",
            "updated_at",
        )


class BusinessMembershipCreateSerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=20)
    role = serializers.ChoiceField(choices=BusinessMembership.Role.choices)
    can_manage_listings = serializers.BooleanField(default=True)
    can_manage_members = serializers.BooleanField(default=False)

    def validate_phone_number(self, value: str) -> str:
        return value.strip().replace(" ", "").replace("-", "")

    def create(self, validated_data: dict) -> BusinessMembership:
        business: BusinessProfile = self.context["business"]
        actor = self.context["request"].user
        try:
            user = User.objects.get(
                phone_number=validated_data.pop("phone_number"),
                is_active=True,
            )
        except User.DoesNotExist as exc:
            raise serializers.ValidationError(
                {"phone_number": "کاربر فعالی با این شماره یافت نشد."}
            ) from exc
        if user.pk == business.owner_id:
            raise serializers.ValidationError(
                {"phone_number": "مالک کسب‌وکار نیاز به عضویت جداگانه ندارد."}
            )
        if BusinessMembership.objects.filter(
            user=user,
            status=BusinessMembership.Status.ACTIVE,
        ).exclude(business=business).exists():
            raise serializers.ValidationError(
                {"phone_number": "این کاربر عضو فعال کسب‌وکار دیگری است."}
            )
        membership, created = BusinessMembership.objects.update_or_create(
            business=business,
            user=user,
            defaults={**validated_data, "status": "active", "created_by": actor},
        )
        if not created and membership.status != BusinessMembership.Status.ACTIVE:
            membership.status = BusinessMembership.Status.ACTIVE
            membership.save(update_fields=("status", "updated_at"))
        return membership


class BusinessSubscriptionSerializer(serializers.ModelSerializer):
    business_name = serializers.CharField(source="business.name", read_only=True)
    business_verification_status = serializers.CharField(
        source="business.verification_status",
        read_only=True,
    )
    plan_label = serializers.CharField(source="get_plan_display", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = BusinessSubscription
        fields = (
            "id",
            "business",
            "business_name",
            "business_verification_status",
            "plan",
            "plan_label",
            "status",
            "status_label",
            "starts_at",
            "ends_at",
            "admin_note",
            "reviewed_at",
            "created_at",
        )
        read_only_fields = fields


class BusinessSubscriptionCreateSerializer(serializers.Serializer):
    plan = serializers.ChoiceField(choices=BusinessSubscription.Plan.choices)

    def create(self, validated_data: dict) -> BusinessSubscription:
        business: BusinessProfile = self.context["business"]
        if business.verification_status != BusinessProfile.VerificationStatus.VERIFIED:
            raise serializers.ValidationError(
                {"detail": "ابتدا باید کسب‌وکار تأیید شود."}
            )
        expected_prefix = f"{business.kind}_"
        if not validated_data["plan"].startswith(expected_prefix):
            raise serializers.ValidationError(
                {"plan": "پلن انتخاب‌شده با نوع کسب‌وکار سازگار نیست."}
            )
        return BusinessSubscription.objects.create(
            business=business,
            requested_by=self.context["request"].user,
            **validated_data,
        )


class BusinessReviewSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=("verify", "reject", "suspend"))
    note = serializers.CharField(required=False, allow_blank=True, max_length=2000)

    def validate(self, attrs: dict) -> dict:
        note = attrs.get("note", "").strip()
        if attrs["action"] in {"reject", "suspend"} and not note:
            raise serializers.ValidationError(
                {"note": "ثبت علت رد یا تعلیق الزامی است."}
            )
        attrs["note"] = note
        return attrs


class SubscriptionReviewSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=("approve", "reject", "cancel"))
    note = serializers.CharField(required=False, allow_blank=True, max_length=2000)

    def validate(self, attrs: dict) -> dict:
        note = attrs.get("note", "").strip()
        if attrs["action"] == "reject" and not note:
            raise serializers.ValidationError(
                {"note": "ثبت علت رد درخواست اشتراک الزامی است."}
            )
        attrs["note"] = note
        return attrs
