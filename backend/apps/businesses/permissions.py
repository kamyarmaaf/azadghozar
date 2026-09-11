from rest_framework.exceptions import PermissionDenied

from apps.businesses.models import BusinessMembership, BusinessProfile


def owned_business(user) -> BusinessProfile:
    try:
        return BusinessProfile.objects.get(owner=user)
    except BusinessProfile.DoesNotExist as exc:
        raise PermissionDenied("Only a business owner can perform this action.") from exc


def accessible_business(
    user,
    *,
    manage_listings: bool = False,
    manage_members: bool = False,
) -> BusinessProfile:
    profile = BusinessProfile.objects.filter(owner=user).first()
    if profile is not None:
        return profile

    memberships = BusinessMembership.objects.filter(
        user=user,
        status=BusinessMembership.Status.ACTIVE,
    ).select_related("business")
    if manage_listings:
        memberships = memberships.filter(can_manage_listings=True)
    if manage_members:
        memberships = memberships.filter(can_manage_members=True)
    membership = memberships.first()
    if membership is None:
        raise PermissionDenied("You do not have access to a business profile.")
    return membership.business
