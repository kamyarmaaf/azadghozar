"""Role-aware dashboard summaries backed by real application data."""

from django.db.models import Avg, BigIntegerField, Count, Q, Sum
from django.db.models.functions import Coalesce
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import RoleChangeRequest, User
from apps.businesses.models import BusinessMembership, BusinessProfile
from apps.catalog.models import ListingFavorite, VehicleListing
from apps.service_requests.models import ServiceRequest


OPEN_SERVICE_STATUSES = (
    ServiceRequest.Status.NEW,
    ServiceRequest.Status.REVIEWING,
    ServiceRequest.Status.ASSIGNED,
    ServiceRequest.Status.IN_PROGRESS,
)


def _listing_metrics(queryset):
    result = queryset.aggregate(
        listing_count=Count("id"),
        active_listing_count=Count(
            "id", filter=Q(status=VehicleListing.Status.ACTIVE)
        ),
        pending_listing_count=Count(
            "id", filter=Q(status=VehicleListing.Status.PENDING)
        ),
        rejected_listing_count=Count(
            "id", filter=Q(status=VehicleListing.Status.REJECTED)
        ),
        sold_listing_count=Count(
            "id", filter=Q(status=VehicleListing.Status.SOLD)
        ),
        total_views=Coalesce(
            Sum("view_count"),
            0,
            output_field=BigIntegerField(),
        ),
        average_price=Avg("price", filter=Q(price__isnull=False)),
    )
    result["average_price"] = int(result["average_price"] or 0)
    return result


def _business_for(user):
    business = BusinessProfile.objects.filter(owner=user).first()
    if business is not None:
        return business
    membership = (
        BusinessMembership.objects.filter(
            user=user,
            status=BusinessMembership.Status.ACTIVE,
        )
        .select_related("business")
        .first()
    )
    return membership.business if membership is not None else None


class DashboardSummaryView(APIView):
    """Return bounded aggregate metrics for the authenticated user's role."""

    permission_classes = (IsAuthenticated,)

    def get(self, request):
        user = request.user
        role = user.role or User.Role.BUYER
        payload = {
            "role": role,
            "role_label": user.get_role_display() if user.role else "کاربر",
            "scope": "personal",
            "metrics": {},
            "business": None,
        }

        if role == User.Role.BUYER:
            requests = ServiceRequest.objects.filter(requester=user)
            payload["metrics"] = {
                "favorite_count": ListingFavorite.objects.filter(user=user).count(),
                "service_request_count": requests.count(),
                "open_service_request_count": requests.filter(
                    status__in=OPEN_SERVICE_STATUSES
                ).count(),
            }
            return Response(payload)

        if role == User.Role.SELLER:
            metrics = _listing_metrics(VehicleListing.objects.filter(owner=user))
            requests = ServiceRequest.objects.filter(requester=user)
            metrics.update(
                service_request_count=requests.count(),
                open_service_request_count=requests.filter(
                    status__in=OPEN_SERVICE_STATUSES
                ).count(),
            )
            payload["metrics"] = metrics
            return Response(payload)

        if role in (User.Role.GALLERY, User.Role.AGENCY):
            business = _business_for(user)
            payload["scope"] = "business"
            if business is None:
                payload["metrics"] = _listing_metrics(
                    VehicleListing.objects.none()
                )
                return Response(payload)
            metrics = _listing_metrics(business.listings.all())
            metrics["member_count"] = business.memberships.filter(
                status=BusinessMembership.Status.ACTIVE
            ).count()
            payload["metrics"] = metrics
            payload["business"] = {
                "id": business.pk,
                "name": business.name,
                "slug": business.slug,
                "kind": business.kind,
                "kind_label": business.get_kind_display(),
                "verification_status": business.verification_status,
                "verification_status_label": (
                    business.get_verification_status_display()
                ),
            }
            return Response(payload)

        if role == User.Role.EXPERT:
            assigned = ServiceRequest.objects.filter(assigned_expert=user)
            payload["scope"] = "assigned"
            payload["metrics"] = {
                "assigned_request_count": assigned.filter(
                    status=ServiceRequest.Status.ASSIGNED
                ).count(),
                "in_progress_request_count": assigned.filter(
                    status=ServiceRequest.Status.IN_PROGRESS
                ).count(),
                "completed_request_count": assigned.filter(
                    status=ServiceRequest.Status.COMPLETED
                ).count(),
                "total_request_count": assigned.count(),
            }
            return Response(payload)

        if role == User.Role.ADMIN:
            if not (user.is_staff or user.is_superuser):
                raise PermissionDenied("Admin dashboard requires staff access.")
            payload["scope"] = "platform"
            payload["metrics"] = {
                "user_count": User.objects.count(),
                "pending_listing_count": VehicleListing.objects.filter(
                    status=VehicleListing.Status.PENDING
                ).count(),
                "pending_role_change_count": RoleChangeRequest.objects.filter(
                    status=RoleChangeRequest.Status.PENDING
                ).count(),
                "pending_gallery_count": BusinessProfile.objects.filter(
                    kind=BusinessProfile.Kind.GALLERY,
                    verification_status=(
                        BusinessProfile.VerificationStatus.PENDING
                    ),
                ).count(),
                "pending_agency_count": BusinessProfile.objects.filter(
                    kind=BusinessProfile.Kind.AGENCY,
                    verification_status=(
                        BusinessProfile.VerificationStatus.PENDING
                    ),
                ).count(),
                "open_service_request_count": ServiceRequest.objects.filter(
                    status__in=OPEN_SERVICE_STATUSES
                ).count(),
            }
            return Response(payload)

        if role in (User.Role.ORG, User.Role.FREE_ZONE_SUPERVISOR):
            metrics = _listing_metrics(VehicleListing.objects.all())
            metrics.update(
                free_zone_listing_count=VehicleListing.objects.filter(
                    plate_type=VehicleListing.PlateType.FREE_ZONE
                ).count(),
                temporary_import_listing_count=VehicleListing.objects.filter(
                    plate_type=VehicleListing.PlateType.TEMPORARY_IMPORT
                ).count(),
                verified_gallery_count=BusinessProfile.objects.filter(
                    kind=BusinessProfile.Kind.GALLERY,
                    verification_status=(
                        BusinessProfile.VerificationStatus.VERIFIED
                    ),
                ).count(),
                verified_agency_count=BusinessProfile.objects.filter(
                    kind=BusinessProfile.Kind.AGENCY,
                    verification_status=(
                        BusinessProfile.VerificationStatus.VERIFIED
                    ),
                ).count(),
                pending_business_count=BusinessProfile.objects.filter(
                    verification_status=(
                        BusinessProfile.VerificationStatus.PENDING
                    )
                ).count(),
                open_service_request_count=ServiceRequest.objects.filter(
                    status__in=OPEN_SERVICE_STATUSES
                ).count(),
            )
            payload["scope"] = "platform_read_only"
            payload["metrics"] = metrics
            return Response(payload)

        if role == User.Role.SMART_ID_OPERATOR:
            active = VehicleListing.objects.filter(
                status=VehicleListing.Status.ACTIVE
            )
            payload["scope"] = "inspection_operations"
            payload["metrics"] = {
                "active_listing_count": active.count(),
                "inspected_listing_count": active.filter(
                    is_inspected=True
                ).count(),
                "uninspected_listing_count": active.filter(
                    is_inspected=False
                ).count(),
                "inspection_waiting_count": ServiceRequest.objects.filter(
                    service_type=ServiceRequest.ServiceType.INSPECTION,
                    status__in=OPEN_SERVICE_STATUSES,
                ).count(),
            }
            return Response(payload)

        return Response(payload)
