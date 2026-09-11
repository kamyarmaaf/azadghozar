from rest_framework.permissions import SAFE_METHODS, BasePermission


class IsStaffOrReadOnly(BasePermission):
    def has_permission(self, request, view) -> bool:
        if request.method in SAFE_METHODS:
            return True

        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_staff
        )


class IsListingOwnerOrReadOnly(BasePermission):
    def has_permission(self, request, view) -> bool:
        if request.method in SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj) -> bool:
        if request.method in SAFE_METHODS:
            return True
        if bool(
            request.user
            and request.user.is_authenticated
            and (request.user.is_staff or obj.owner_id == request.user.id)
        ):
            return True
        return bool(
            request.user
            and request.user.is_authenticated
            and obj.business_id
            and obj.business.memberships.filter(
                user=request.user,
                status="active",
                can_manage_listings=True,
            ).exists()
        )
