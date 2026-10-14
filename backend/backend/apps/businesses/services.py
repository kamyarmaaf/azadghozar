from django.db import transaction
from django.utils.text import slugify

from apps.accounts.models import User
from apps.businesses.models import BusinessProfile


def business_slug(user: User, name: str) -> str:
    base = slugify(name, allow_unicode=True)[:180] or "business"
    return f"{base}-{user.pk}"


@transaction.atomic
def ensure_business_profile(user: User) -> BusinessProfile | None:
    if user.role not in {User.Role.GALLERY, User.Role.AGENCY}:
        return None

    name = user.business_name.strip() or user.display_name
    kind = (
        BusinessProfile.Kind.AGENCY
        if user.role == User.Role.AGENCY
        else BusinessProfile.Kind.GALLERY
    )
    profile, _ = BusinessProfile.objects.get_or_create(
        owner=user,
        defaults={
            "kind": kind,
            "name": name,
            "slug": business_slug(user, name),
            "phone": user.business_phone,
            "province": user.province,
            "city": user.city,
            "address": user.address,
            "description": user.business_description,
        },
    )
    return profile
