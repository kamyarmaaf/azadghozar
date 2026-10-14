from rest_framework.permissions import BasePermission

from apps.accounts.models import User


class IsExpertOrAdmin(BasePermission):
    message = "Only an assigned expert can access this request."

    def has_permission(self, request, view) -> bool:
        user = request.user
        return bool(
            user.is_authenticated
            and (user.is_staff or user.role == User.Role.EXPERT)
        )

