from django.conf import settings
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError, transaction
from django.db.models import F, Sum
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import (
    AllowAny,
    IsAdminUser,
    IsAuthenticated,
)
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.pagination import CursorPagination
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import (
    Referral,
    RoleChangeRequest,
    User,
)
from apps.accounts.serializers import (
    PasswordLoginSerializer,
    PhoneNumberSerializer,
    ReferralSerializer,
    ResetPasswordSerializer,
    RoleChangeRequestCreateSerializer,
    RoleChangeRequestSerializer,
    RoleChangeReviewSerializer,
    SignupRequestOTPSerializer,
    SignupCompleteSerializer,
    UserProfileUpdateSerializer,
    UserSerializer,
    VerifyOTPSerializer,
)
from apps.accounts.services.otp import (
    LOGIN_PURPOSE,
    PASSWORD_RESET_PURPOSE,
    SIGNUP_PURPOSE,
    request_otp,
    verify_otp,
)


def create_authentication_response(user: User) -> dict:
    refresh = RefreshToken.for_user(user)

    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "user": UserSerializer(user).data,
    }


class RoleChoicesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        roles = [
            {
                "value": value,
                "label": label,
                "can_self_register": (
                    value in User.PUBLIC_SIGNUP_ROLES
                ),
            }
            for value, label in User.Role.choices
        ]
        return Response({"roles": roles})


class SignupRequestOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SignupRequestOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        phone_number = serializer.validated_data["phone_number"]
        role = serializer.validated_data["role"]
        referral_code = serializer.validated_data.get(
            "referral_code",
            "",
        )

        if User.objects.filter(phone_number=phone_number).exists():
            raise ValidationError(
                {
                    "phone_number": (
                        "An account with this phone number already exists."
                    )
                }
            )

        otp_result = request_otp(
            phone_number=phone_number,
            purpose=SIGNUP_PURPOSE,
            metadata={
                "role": role,
                "referral_code": referral_code,
            },
        )

        return Response(
            {
                "detail": "OTP has been queued.",
                "phone_number": phone_number,
                **otp_result,
            },
            status=status.HTTP_202_ACCEPTED,
        )


class SignupVerifyOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        phone_number = serializer.validated_data["phone_number"]
        otp_code = serializer.validated_data["otp"]

        metadata = verify_otp(
            phone_number=phone_number,
            purpose=SIGNUP_PURPOSE,
            code=otp_code,
        )

        role = metadata.get("role")
        referral_code = metadata.get("referral_code", "")

        if role not in User.PUBLIC_SIGNUP_ROLES:
            raise ValidationError(
                {"role": "Registration role is invalid."}
            )

        try:
            with transaction.atomic():
                if User.objects.filter(
                    phone_number=phone_number
                ).exists():
                    raise ValidationError(
                        {
                            "phone_number": (
                                "An account with this phone number "
                                "already exists."
                            )
                        }
                    )

                referrer = None
                if referral_code:
                    referrer = (
                        User.objects.select_for_update()
                        .filter(
                            referral_code=referral_code,
                            is_active=True,
                        )
                        .first()
                    )
                    if referrer is None:
                        raise ValidationError(
                            {
                                "referral_code": (
                                    "Referral code is no longer valid."
                                )
                            }
                        )

                user = User.objects.create_user(
                    username=phone_number,
                    phone_number=phone_number,
                    role=role,
                    is_phone_verified=True,
                    referred_by=referrer,
                )

                from apps.businesses.services import ensure_business_profile

                ensure_business_profile(user)

                user.set_unusable_password()
                user.last_login = timezone.now()
                user.save(
                    update_fields=[
                        "password",
                        "last_login",
                    ]
                )

                if referrer is not None:
                    reward_value = settings.REFERRAL_REWARD_VALUE
                    Referral.objects.create(
                        referrer=referrer,
                        referee=user,
                        code=referral_code,
                        reward_value=reward_value,
                    )
                    User.objects.filter(pk=referrer.pk).update(
                        referral_earnings=(
                            F("referral_earnings") + reward_value
                        )
                    )

        except IntegrityError as exc:
            raise ValidationError(
                {
                    "phone_number": (
                        "An account with this phone number already exists."
                    )
                }
            ) from exc

        return Response(
            create_authentication_response(user),
            status=status.HTTP_201_CREATED,
        )


class SignupCompleteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = SignupCompleteSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)

        name_parts = serializer.validated_data["full_name"].split(
            maxsplit=1
        )
        request.user.first_name = name_parts[0]
        request.user.last_name = (
            name_parts[1] if len(name_parts) > 1 else ""
        )
        request.user.set_password(
            serializer.validated_data["password"]
        )
        now = timezone.now()
        request.user.terms_accepted_at = now
        request.user.profile_completed_at = now
        request.user.save(
            update_fields=[
                "first_name",
                "last_name",
                "password",
                "terms_accepted_at",
                "profile_completed_at",
            ]
        )
        if request.user.role in {User.Role.GALLERY, User.Role.AGENCY}:
            from apps.businesses.services import ensure_business_profile

            profile = ensure_business_profile(request.user)
            if profile is not None and not request.user.business_name:
                profile.name = request.user.display_name
                profile.save(update_fields=("name", "updated_at"))

        return Response(
            {"user": UserSerializer(request.user).data},
            status=status.HTTP_200_OK,
        )


class LoginRequestOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PhoneNumberSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        phone_number = serializer.validated_data["phone_number"]

        user = User.objects.filter(
            phone_number=phone_number,
            is_active=True,
        ).first()

        otp_result = request_otp(
            phone_number=phone_number,
            purpose=LOGIN_PURPOSE,
            dispatch_sms=user is not None,
        )

        return Response(
            {
                "detail": "OTP has been queued.",
                "phone_number": phone_number,
                **otp_result,
            },
            status=status.HTTP_202_ACCEPTED,
        )


class LoginVerifyOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        phone_number = serializer.validated_data["phone_number"]
        otp_code = serializer.validated_data["otp"]

        user = User.objects.filter(
            phone_number=phone_number,
            is_active=True,
        ).first()

        if user is None:
            raise ValidationError(
                {
                    "phone_number": (
                        "No active account was found for this phone number."
                    )
                }
            )

        verify_otp(
            phone_number=phone_number,
            purpose=LOGIN_PURPOSE,
            code=otp_code,
        )

        user.is_phone_verified = True
        user.last_login = timezone.now()
        user.save(
            update_fields=[
                "is_phone_verified",
                "last_login",
            ]
        )

        return Response(
            create_authentication_response(user),
            status=status.HTTP_200_OK,
        )


class PasswordLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]

        user.last_login = timezone.now()
        user.save(update_fields=["last_login"])

        return Response(
            create_authentication_response(user),
            status=status.HTTP_200_OK,
        )


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PhoneNumberSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone_number = serializer.validated_data["phone_number"]
        user_exists = User.objects.filter(
            phone_number=phone_number,
            is_active=True,
        ).exists()

        otp_result = request_otp(
            phone_number=phone_number,
            purpose=PASSWORD_RESET_PURPOSE,
            dispatch_sms=user_exists,
        )
        return Response(
            {
                "detail": "If the account exists, an OTP has been queued.",
                "phone_number": phone_number,
                **otp_result,
            },
            status=status.HTTP_202_ACCEPTED,
        )


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone_number = serializer.validated_data["phone_number"]

        verify_otp(
            phone_number=phone_number,
            purpose=PASSWORD_RESET_PURPOSE,
            code=serializer.validated_data["otp"],
        )

        user = User.objects.filter(
            phone_number=phone_number,
            is_active=True,
        ).first()
        if user is None:
            raise ValidationError(
                {"otp": "OTP is invalid or has expired."}
            )

        try:
            validate_password(
                serializer.validated_data["new_password"],
                user=user,
            )
        except DjangoValidationError as exc:
            raise ValidationError(
                {"new_password": exc.messages}
            ) from exc

        user.set_password(serializer.validated_data["new_password"])
        user.save(update_fields=["password"])

        return Response(
            {"detail": "Password has been reset successfully."},
            status=status.HTTP_200_OK,
        )


class MeView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        return Response(
            UserSerializer(request.user).data,
            status=status.HTTP_200_OK,
        )

    def patch(self, request):
        serializer = UserProfileUpdateSerializer(
            request.user,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            UserSerializer(user).data,
            status=status.HTTP_200_OK,
        )


class ReferralVerifyView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        code = request.query_params.get("code", "").strip().upper()
        if not code:
            raise ValidationError({"code": "Referral code is required."})

        user = User.objects.filter(
            referral_code=code,
            is_active=True,
        ).only("first_name", "last_name", "phone_number", "username").first()

        if user is None:
            return Response({"valid": False})

        return Response(
            {
                "valid": True,
                "referrer_name": user.display_name,
            }
        )


class ReferralStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        records = request.user.referral_rewards.select_related(
            "referee"
        )
        unclaimed_value = (
            records.filter(reward_claimed=False).aggregate(
                total=Sum("reward_value")
            )["total"]
            or 0
        )

        return Response(
            {
                "referral_code": request.user.referral_code,
                "referral_count": records.count(),
                "total_earnings": request.user.referral_earnings,
                "available_credit": request.user.referral_credit,
                "unclaimed_rewards": unclaimed_value,
                "records": ReferralSerializer(records, many=True).data,
            }
        )


class ReferralClaimView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk: int):
        with transaction.atomic():
            referral = get_object_or_404(
                Referral.objects.select_for_update(),
                pk=pk,
                referrer=request.user,
            )
            if referral.reward_claimed:
                return Response(
                    {"detail": "This reward was already claimed."},
                    status=status.HTTP_409_CONFLICT,
                )

            referral.reward_claimed = True
            referral.claimed_at = timezone.now()
            referral.save(
                update_fields=["reward_claimed", "claimed_at"]
            )
            User.objects.filter(pk=request.user.pk).update(
                referral_credit=(
                    F("referral_credit") + referral.reward_value
                )
            )

        request.user.refresh_from_db(fields=["referral_credit"])
        return Response(
            {
                "detail": "Reward claimed successfully.",
                "referral_credit": request.user.referral_credit,
                "reward": ReferralSerializer(referral).data,
            }
        )


class RoleChangeRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        requests = request.user.role_change_requests.select_related(
            "reviewed_by"
        )
        return Response(
            {
                "requests": RoleChangeRequestSerializer(
                    requests,
                    many=True,
                ).data
            }
        )

    def post(self, request):
        serializer = RoleChangeRequestCreateSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)

        try:
            role_request = RoleChangeRequest.objects.create(
                user=request.user,
                from_role=request.user.role,
                to_role=serializer.validated_data["to_role"],
                reason=serializer.validated_data["reason"],
            )
        except IntegrityError as exc:
            raise ValidationError(
                {
                    "detail": (
                        "You already have a pending role change request."
                    )
                }
            ) from exc

        return Response(
            RoleChangeRequestSerializer(role_request).data,
            status=status.HTTP_201_CREATED,
        )


class RoleChangePendingPagination(CursorPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 50
    ordering = ("-created_at", "-id")


class RoleChangePendingView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        requests = RoleChangeRequest.objects.filter(
            status=RoleChangeRequest.Status.PENDING,
        ).select_related("user", "reviewed_by")
        paginator = RoleChangePendingPagination()
        page = paginator.paginate_queryset(requests, request, view=self)
        return Response(
            {
                "next": paginator.get_next_link(),
                "requests": RoleChangeRequestSerializer(
                    page,
                    many=True,
                ).data
            }
        )


class RoleChangeReviewView(APIView):
    permission_classes = [IsAdminUser]
    decision: str

    def post(self, request, pk: int):
        serializer = RoleChangeReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            role_request = get_object_or_404(
                RoleChangeRequest.objects.select_for_update().select_related(
                    "user"
                ),
                pk=pk,
            )
            if role_request.status != RoleChangeRequest.Status.PENDING:
                return Response(
                    {"detail": "This request was already reviewed."},
                    status=status.HTTP_409_CONFLICT,
                )

            role_request.status = self.decision
            role_request.admin_note = serializer.validated_data.get(
                "admin_note",
                "",
            )
            role_request.reviewed_by = request.user
            role_request.reviewed_at = timezone.now()
            role_request.save(
                update_fields=[
                    "status",
                    "admin_note",
                    "reviewed_by",
                    "reviewed_at",
                    "updated_at",
                ]
            )

            if self.decision == RoleChangeRequest.Status.APPROVED:
                role_request.user.role = role_request.to_role
                role_request.user.save(update_fields=["role"])
                from apps.businesses.services import ensure_business_profile
                from apps.businesses.models import BusinessProfile

                profile = ensure_business_profile(role_request.user)
                if profile is None:
                    BusinessProfile.objects.filter(
                        owner=role_request.user
                    ).update(
                        verification_status=(
                            BusinessProfile.VerificationStatus.SUSPENDED
                        ),
                        verification_note="Role changed by account owner.",
                        verified_at=None,
                    )

        return Response(RoleChangeRequestSerializer(role_request).data)


class RoleChangeApproveView(RoleChangeReviewView):
    decision = RoleChangeRequest.Status.APPROVED


class RoleChangeRejectView(RoleChangeReviewView):
    decision = RoleChangeRequest.Status.REJECTED
