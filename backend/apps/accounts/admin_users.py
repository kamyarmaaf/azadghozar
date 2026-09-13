"""Read-only, bounded administrative access to large user tables."""

from rest_framework import generics, serializers
from rest_framework.exceptions import ValidationError
from rest_framework.pagination import CursorPagination
from rest_framework.permissions import IsAdminUser

from apps.accounts.models import User
from apps.accounts.services.otp import normalize_phone_number

ADMIN_USER_COLUMNS = (
    "id",
    "username",
    "first_name",
    "last_name",
    "phone_number",
    "role",
    "is_phone_verified",
    "is_active",
    "is_staff",
    "date_joined",
)


class AdminUserCursorPagination(CursorPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 50
    ordering = "-id"


class AdminUserSerializer(serializers.ModelSerializer):
    display_name = serializers.CharField(read_only=True)
    role_label = serializers.CharField(source="get_role_display", read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "display_name",
            "phone_number",
            "role",
            "role_label",
            "is_phone_verified",
            "is_active",
            "is_staff",
            "date_joined",
        )
        read_only_fields = fields


class AdminUserListView(generics.ListAPIView):
    permission_classes = (IsAdminUser,)
    serializer_class = AdminUserSerializer
    pagination_class = AdminUserCursorPagination

    def get_queryset(self):
        queryset = User.objects.only(*ADMIN_USER_COLUMNS)
        role = self.request.query_params.get("role", "").strip()
        if role:
            if role not in User.Role.values:
                raise ValidationError({"role": "Unknown role."})
            queryset = queryset.filter(role=role)

        active = self.request.query_params.get("active", "").strip()
        if active:
            if active not in {"true", "false"}:
                raise ValidationError({"active": "Use true or false."})
            queryset = queryset.filter(is_active=(active == "true"))

        phone = self.request.query_params.get("phone", "").strip()
        if phone:
            if len(phone) > 20:
                raise ValidationError({"phone": "Invalid mobile number."})
            try:
                normalized_phone = normalize_phone_number(phone)
            except ValidationError as exc:
                raise ValidationError({"phone": "Invalid mobile number."}) from exc
            queryset = queryset.filter(phone_number=normalized_phone)
        return queryset.order_by("-id")


class AdminUserDetailView(generics.RetrieveAPIView):
    permission_classes = (IsAdminUser,)
    serializer_class = AdminUserSerializer
    queryset = User.objects.only(*ADMIN_USER_COLUMNS)
