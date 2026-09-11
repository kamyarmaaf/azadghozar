from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.hashers import check_password, make_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import Q
from rest_framework import serializers

from apps.accounts.models import (
    Referral,
    RoleChangeRequest,
    User,
)
from apps.accounts.services.otp import normalize_phone_number
from apps.image_processing import (
    InvalidImageUpload,
    compress_uploaded_image,
)


PUBLIC_SIGNUP_ROLE_CHOICES = [
    (value, label)
    for value, label in User.Role.choices
    if value in User.PUBLIC_SIGNUP_ROLES
]

SELF_SERVICE_ROLE_TRANSITIONS = {
    User.Role.BUYER: {
        User.Role.SELLER,
        User.Role.GALLERY,
    },
    User.Role.SELLER: {
        User.Role.BUYER,
        User.Role.GALLERY,
    },
    User.Role.GALLERY: {
        User.Role.BUYER,
        User.Role.SELLER,
    },
}

DUMMY_PASSWORD_HASH = make_password("azadgozar-timing-protection")


class PhoneNumberSerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=20)

    def validate_phone_number(self, value: str) -> str:
        return normalize_phone_number(value)


class SignupRequestOTPSerializer(PhoneNumberSerializer):
    role = serializers.ChoiceField(
        choices=PUBLIC_SIGNUP_ROLE_CHOICES,
    )
    referral_code = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=16,
    )

    def validate_referral_code(self, value: str) -> str:
        code = value.strip().upper()
        if not code:
            return ""

        if not User.objects.filter(
            referral_code=code,
            is_active=True,
        ).exists():
            raise serializers.ValidationError(
                "Referral code is invalid."
            )

        return code


class VerifyOTPSerializer(PhoneNumberSerializer):
    otp = serializers.RegexField(
        regex=r"^\d{6}$",
        error_messages={
            "invalid": "OTP must contain exactly 6 digits."
        },
    )


class ResetPasswordSerializer(VerifyOTPSerializer):
    new_password = serializers.CharField(
        min_length=8,
        max_length=128,
        trim_whitespace=False,
        write_only=True,
    )
    password_confirmation = serializers.CharField(
        min_length=8,
        max_length=128,
        trim_whitespace=False,
        write_only=True,
    )

    def validate(self, attrs: dict) -> dict:
        if attrs["new_password"] != attrs["password_confirmation"]:
            raise serializers.ValidationError(
                {
                    "password_confirmation": (  # nosec B105
                        "تکرار رمز عبور یکسان نیست."
                    )
                }
            )
        return attrs


class PasswordLoginSerializer(serializers.Serializer):
    identifier = serializers.CharField(max_length=254)
    password = serializers.CharField(
        max_length=128,
        trim_whitespace=False,
        write_only=True,
    )

    def validate(self, attrs: dict) -> dict:
        identifier = attrs["identifier"].strip()
        query = Q(username__iexact=identifier) | Q(
            email__iexact=identifier
        )

        try:
            normalized_phone = normalize_phone_number(identifier)
        except serializers.ValidationError:
            normalized_phone = None

        if normalized_phone is not None:
            query |= Q(phone_number=normalized_phone)

        user = User.objects.filter(query, is_active=True).first()
        password_is_valid = (
            user.check_password(attrs["password"])
            if user is not None
            else check_password(attrs["password"], DUMMY_PASSWORD_HASH)
        )
        if user is None or not password_is_valid:
            raise serializers.ValidationError(
                {"detail": "نام کاربری یا رمز عبور نادرست است."}
            )

        attrs["user"] = user
        return attrs


class SignupCompleteSerializer(serializers.Serializer):
    full_name = serializers.CharField(
        min_length=2,
        max_length=300,
        trim_whitespace=True,
    )
    password = serializers.CharField(
        min_length=8,
        max_length=128,
        trim_whitespace=False,
        write_only=True,
    )
    password_confirmation = serializers.CharField(
        min_length=8,
        max_length=128,
        trim_whitespace=False,
        write_only=True,
    )
    accept_terms = serializers.BooleanField(write_only=True)

    def validate_password(self, value: str) -> str:
        user = self.context["request"].user
        try:
            validate_password(value, user=user)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.messages) from exc
        return value

    def validate_accept_terms(self, value: bool) -> bool:
        if not value:
            raise serializers.ValidationError(
                "پذیرش قوانین و مقررات الزامی است."
            )
        return value

    def validate(self, attrs: dict) -> dict:
        user = self.context["request"].user
        if user.profile_completed_at is not None:
            raise serializers.ValidationError(
                {"detail": "پروفایل ثبت‌نام قبلاً تکمیل شده است."}
            )
        if attrs["password"] != attrs["password_confirmation"]:
            raise serializers.ValidationError(
                {
                    "password_confirmation": (  # nosec B105
                        "تکرار رمز عبور یکسان نیست."
                    )
                }
            )
        return attrs


class UserSerializer(serializers.ModelSerializer):
    display_name = serializers.CharField(read_only=True)
    role_label = serializers.CharField(
        source="get_role_display",
        read_only=True,
    )
    business_access = serializers.SerializerMethodField()

    def get_business_access(self, obj: User) -> dict | None:
        from apps.businesses.models import BusinessMembership, BusinessProfile

        business_roles = {User.Role.GALLERY, User.Role.AGENCY}
        profile = (
            BusinessProfile.objects.filter(owner=obj).first()
            if obj.role in business_roles
            else None
        )
        if profile is not None:
            return {
                "id": profile.pk,
                "slug": profile.slug,
                "name": profile.name,
                "kind": profile.kind,
                "verification_status": profile.verification_status,
                "is_owner": True,
                "can_manage_listings": True,
                "can_manage_members": True,
            }
        membership = (
            BusinessMembership.objects.filter(
                user=obj,
                status=BusinessMembership.Status.ACTIVE,
            )
            .select_related("business")
            .first()
        )
        if membership is None:
            return None
        return {
            "id": membership.business_id,
            "slug": membership.business.slug,
            "name": membership.business.name,
            "kind": membership.business.kind,
            "verification_status": membership.business.verification_status,
            "is_owner": False,
            "can_manage_listings": membership.can_manage_listings,
            "can_manage_members": membership.can_manage_members,
        }

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "phone_number",
            "role",
            "role_label",
            "display_name",
            "first_name",
            "last_name",
            "email",
            "is_phone_verified",
            "referral_code",
            "referral_credit",
            "referral_earnings",
            "terms_accepted_at",
            "profile_completed_at",
            "province",
            "city",
            "address",
            "preferred_contact_method",
            "business_name",
            "business_phone",
            "business_description",
            "business_logo",
            "business_cover",
            "business_access",
            "date_joined",
        )
        read_only_fields = fields


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "first_name",
            "last_name",
            "email",
            "province",
            "city",
            "address",
            "preferred_contact_method",
            "business_name",
            "business_phone",
            "business_description",
            "business_logo",
            "business_cover",
        )
        extra_kwargs = {
            "first_name": {"required": False, "allow_blank": True},
            "last_name": {"required": False, "allow_blank": True},
            "email": {"required": False, "allow_blank": True},
            "province": {"required": False, "allow_blank": True},
            "city": {"required": False, "allow_blank": True},
            "address": {"required": False, "allow_blank": True},
            "business_name": {"required": False, "allow_blank": True},
            "business_phone": {"required": False, "allow_blank": True},
            "business_description": {
                "required": False,
                "allow_blank": True,
            },
            "business_logo": {"required": False},
            "business_cover": {"required": False},
        }

    def validate_email(self, value: str) -> str:
        email = value.strip().lower()
        if not email:
            return ""

        queryset = User.objects.filter(email__iexact=email)
        if self.instance is not None:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError(
                "An account with this email already exists."
            )
        return email

    def validate_first_name(self, value: str) -> str:
        return value.strip()

    def validate_last_name(self, value: str) -> str:
        return value.strip()

    def validate(self, attrs):
        attrs = super().validate(attrs)
        business_fields = {
            "business_name",
            "business_phone",
            "business_description",
            "business_logo",
            "business_cover",
        }
        if business_fields.intersection(attrs):
            user = self.instance
            business_roles = {User.Role.GALLERY, User.Role.AGENCY}
            if user is None or user.role not in business_roles:
                raise serializers.ValidationError(
                    {
                        "business_name": (
                            "Business profile fields are only available "
                            "for galleries and agencies."
                        )
                    }
                )
        return attrs

    def validate_province(self, value: str) -> str:
        return value.strip()

    def validate_city(self, value: str) -> str:
        return value.strip()

    def validate_address(self, value: str) -> str:
        return value.strip()

    def validate_business_name(self, value: str) -> str:
        return value.strip()

    def validate_business_phone(self, value: str) -> str:
        return value.strip()

    def validate_business_description(self, value: str) -> str:
        return value.strip()

    def validate_business_logo(self, upload):
        try:
            return compress_uploaded_image(
                upload,
                max_input_bytes=5 * 1024 * 1024,
                target_bytes=300 * 1024,
                max_dimension=800,
                preserve_transparency=True,
            )
        except InvalidImageUpload as exc:
            raise serializers.ValidationError(str(exc)) from exc

    def validate_business_cover(self, upload):
        try:
            return compress_uploaded_image(
                upload,
                max_input_bytes=10 * 1024 * 1024,
                target_bytes=700 * 1024,
                max_dimension=1920,
            )
        except InvalidImageUpload as exc:
            raise serializers.ValidationError(str(exc)) from exc

    def update(self, instance: User, validated_data: dict) -> User:
        review_fields = {
            "business_name",
            "business_phone",
            "province",
            "city",
            "address",
        }
        review_data_changed = any(
            field in validated_data
            and validated_data[field] != getattr(instance, field)
            for field in review_fields
        )
        user = super().update(instance, validated_data)
        if user.role in {User.Role.GALLERY, User.Role.AGENCY}:
            from apps.businesses.services import ensure_business_profile

            profile = ensure_business_profile(user)
            if profile is not None:
                profile.name = user.business_name.strip() or user.display_name
                profile.phone = user.business_phone
                profile.description = user.business_description
                profile.province = user.province
                profile.city = user.city
                profile.address = user.address
                profile.save(
                    update_fields=(
                        "name",
                        "phone",
                        "description",
                        "province",
                        "city",
                        "address",
                        "updated_at",
                    )
                )
                if review_data_changed and profile.verification_status == "verified":
                    profile.verification_status = "pending"
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
        return user


class ReferralSerializer(serializers.ModelSerializer):
    referee_name = serializers.CharField(
        source="referee.display_name",
        read_only=True,
    )
    referee_phone = serializers.CharField(
        source="referee.phone_number",
        read_only=True,
    )

    class Meta:
        model = Referral
        fields = (
            "id",
            "referee_name",
            "referee_phone",
            "code",
            "reward_type",
            "reward_value",
            "reward_claimed",
            "claimed_at",
            "created_at",
        )
        read_only_fields = fields


class RoleChangeRequestCreateSerializer(serializers.Serializer):
    to_role = serializers.ChoiceField(
        choices=PUBLIC_SIGNUP_ROLE_CHOICES,
    )
    reason = serializers.CharField(
        min_length=10,
        max_length=2000,
        trim_whitespace=True,
    )

    def validate_to_role(self, value: str) -> str:
        user = self.context["request"].user
        allowed_roles = SELF_SERVICE_ROLE_TRANSITIONS.get(
            user.role,
            set(),
        )
        if value not in allowed_roles:
            raise serializers.ValidationError(
                "This role transition is not allowed."
            )
        return value

    def validate(self, attrs: dict) -> dict:
        user = self.context["request"].user
        if RoleChangeRequest.objects.filter(
            user=user,
            status=RoleChangeRequest.Status.PENDING,
        ).exists():
            raise serializers.ValidationError(
                {
                    "detail": (
                        "You already have a pending role change request."
                    )
                }
            )
        return attrs


class RoleChangeRequestSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(
        source="user.display_name",
        read_only=True,
    )
    user_phone = serializers.CharField(
        source="user.phone_number",
        read_only=True,
    )
    from_role_label = serializers.CharField(
        source="get_from_role_display",
        read_only=True,
    )
    to_role_label = serializers.CharField(
        source="get_to_role_display",
        read_only=True,
    )
    status_label = serializers.CharField(
        source="get_status_display",
        read_only=True,
    )
    reviewed_by_name = serializers.CharField(
        source="reviewed_by.display_name",
        read_only=True,
        allow_null=True,
    )

    class Meta:
        model = RoleChangeRequest
        fields = (
            "id",
            "user_name",
            "user_phone",
            "from_role",
            "from_role_label",
            "to_role",
            "to_role_label",
            "reason",
            "status",
            "status_label",
            "admin_note",
            "reviewed_by_name",
            "reviewed_at",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class RoleChangeReviewSerializer(serializers.Serializer):
    admin_note = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=2000,
        trim_whitespace=True,
    )
