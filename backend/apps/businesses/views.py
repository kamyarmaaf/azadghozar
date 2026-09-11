from datetime import timedelta

from django.db import IntegrityError, transaction
from django.db.models import (
    BigIntegerField,
    Count,
    IntegerField,
    OuterRef,
    Q,
    Subquery,
    Sum,
)
from django.db.models.functions import Coalesce
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import User
from apps.businesses.models import (
    BusinessMembership,
    BusinessProfile,
    BusinessSubscription,
)
from apps.businesses.pagination import (
    BusinessCursorPagination,
    BusinessListingCursorPagination,
    BusinessMemberCursorPagination,
)
from apps.businesses.permissions import accessible_business, owned_business
from apps.businesses.serializers import (
    BusinessMembershipCreateSerializer,
    BusinessMembershipSerializer,
    BusinessProfileSerializer,
    BusinessReviewSerializer,
    BusinessSubscriptionCreateSerializer,
    BusinessSubscriptionSerializer,
    PublicBusinessSerializer,
    SubscriptionReviewSerializer,
)
from apps.catalog.models import VehicleListing, VehicleListingImage
from apps.catalog.serializers import VehicleListingSummarySerializer


def public_businesses():
    active_listings = VehicleListing.objects.filter(
        business_id=OuterRef("pk"),
        status=VehicleListing.Status.ACTIVE,
    ).values("business_id")
    return (
        BusinessProfile.objects.filter(
            verification_status=BusinessProfile.VerificationStatus.VERIFIED
        )
        .select_related("owner")
        .annotate(
            listing_count=Coalesce(
                Subquery(
                    active_listings.annotate(total=Count("id"))
                    .values("total")[:1],
                    output_field=IntegerField(),
                ),
                0,
            ),
            total_views=Coalesce(
                Subquery(
                    active_listings.annotate(total=Sum("view_count"))
                    .values("total")[:1],
                    output_field=BigIntegerField(),
                ),
                0,
                output_field=BigIntegerField(),
            ),
        )
    )


class PublicBusinessListView(generics.ListAPIView):
    permission_classes = (AllowAny,)
    serializer_class = PublicBusinessSerializer
    pagination_class = BusinessCursorPagination

    def get_queryset(self):
        queryset = public_businesses()
        kind = self.request.query_params.get("kind")
        if kind in {BusinessProfile.Kind.GALLERY, BusinessProfile.Kind.AGENCY}:
            queryset = queryset.filter(kind=kind)
        city = self.request.query_params.get("city", "").strip()
        if city:
            queryset = queryset.filter(city__iexact=city)
        query = self.request.query_params.get("q", "").strip()[:100]
        if query:
            queryset = queryset.filter(
                Q(name__icontains=query)
                | Q(city__icontains=query)
                | Q(description__icontains=query)
            )
        return queryset.order_by("-verified_at", "-id")


class PublicBusinessDetailView(generics.RetrieveAPIView):
    permission_classes = (AllowAny,)
    serializer_class = PublicBusinessSerializer
    lookup_field = "slug"

    def get_queryset(self):
        return public_businesses()

    def get_serializer_context(self) -> dict:
        context = super().get_serializer_context()
        context["include_brands"] = True
        return context


class PublicBusinessListingView(generics.ListAPIView):
    permission_classes = (AllowAny,)
    serializer_class = VehicleListingSummarySerializer
    pagination_class = BusinessListingCursorPagination

    def get_queryset(self):
        business = get_object_or_404(
            BusinessProfile,
            slug=self.kwargs["slug"],
            verification_status=BusinessProfile.VerificationStatus.VERIFIED,
        )
        first_image = VehicleListingImage.objects.filter(
            listing_id=OuterRef("pk")
        ).order_by("sort_order", "id")
        return VehicleListing.objects.filter(
            business=business,
            status=VehicleListing.Status.ACTIVE,
        ).annotate(
            cover_image_path=Subquery(first_image.values("file")[:1])
        ).order_by("-created_at", "-id")


class MyBusinessView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        business = accessible_business(request.user)
        return Response(BusinessProfileSerializer(business).data)

    def patch(self, request):
        business = owned_business(request.user)
        serializer = BusinessProfileSerializer(
            business,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class BusinessDashboardView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        business = accessible_business(request.user)
        stats = business.listings.aggregate(
            listing_count=Count("id"),
            active_listing_count=Count(
                "id", filter=Q(status=VehicleListing.Status.ACTIVE)
            ),
            pending_listing_count=Count(
                "id", filter=Q(status=VehicleListing.Status.PENDING)
            ),
            sold_listing_count=Count(
                "id", filter=Q(status=VehicleListing.Status.SOLD)
            ),
            total_views=Coalesce(Sum("view_count"), 0),
        )
        stats["member_count"] = business.memberships.filter(
            status=BusinessMembership.Status.ACTIVE
        ).count()
        subscription = business.subscriptions.filter(
            status__in=(
                BusinessSubscription.Status.PENDING,
                BusinessSubscription.Status.ACTIVE,
            )
        ).first()
        return Response(
            {
                "business": BusinessProfileSerializer(business).data,
                "stats": stats,
                "subscription": (
                    BusinessSubscriptionSerializer(subscription).data
                    if subscription
                    else None
                ),
            }
        )


class MyBusinessListingView(generics.ListAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = VehicleListingSummarySerializer
    pagination_class = BusinessListingCursorPagination

    def get_queryset(self):
        business = accessible_business(
            self.request.user,
            manage_listings=True,
        )
        first_image = VehicleListingImage.objects.filter(
            listing_id=OuterRef("pk")
        ).order_by("sort_order", "id")
        queryset = business.listings.annotate(
            cover_image_path=Subquery(first_image.values("file")[:1])
        )
        listing_status = self.request.query_params.get("status")
        if listing_status in VehicleListing.Status.values:
            queryset = queryset.filter(status=listing_status)
        return queryset.order_by("-created_at", "-id")


class BusinessMemberListCreateView(generics.ListCreateAPIView):
    permission_classes = (IsAuthenticated,)
    pagination_class = BusinessMemberCursorPagination

    def get_business(self) -> BusinessProfile:
        return accessible_business(self.request.user, manage_members=True)

    def get_queryset(self):
        return self.get_business().memberships.select_related("user").order_by(
            "-created_at", "-id"
        )

    def get_serializer_class(self):
        if self.request.method == "POST":
            return BusinessMembershipCreateSerializer
        return BusinessMembershipSerializer

    def get_serializer_context(self) -> dict:
        context = super().get_serializer_context()
        context["business"] = self.get_business()
        return context

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        membership = serializer.save()
        return Response(
            BusinessMembershipSerializer(membership).data,
            status=status.HTTP_201_CREATED,
        )


class BusinessMemberDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = BusinessMembershipSerializer
    lookup_url_kwarg = "member_id"

    def get_queryset(self):
        business = accessible_business(self.request.user, manage_members=True)
        return business.memberships.select_related("user")


class BusinessSubscriptionListCreateView(generics.ListCreateAPIView):
    permission_classes = (IsAuthenticated,)
    pagination_class = BusinessMemberCursorPagination

    def get_business(self) -> BusinessProfile:
        return owned_business(self.request.user)

    def get_queryset(self):
        return self.get_business().subscriptions.select_related("business")

    def get_serializer_class(self):
        if self.request.method == "POST":
            return BusinessSubscriptionCreateSerializer
        return BusinessSubscriptionSerializer

    def get_serializer_context(self) -> dict:
        context = super().get_serializer_context()
        context["business"] = self.get_business()
        return context

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            subscription = serializer.save()
        except IntegrityError as exc:
            raise ValidationError(
                {"detail": "یک درخواست یا اشتراک باز از قبل وجود دارد."}
            ) from exc
        return Response(
            BusinessSubscriptionSerializer(subscription).data,
            status=status.HTTP_201_CREATED,
        )


class AdminBusinessListView(generics.ListAPIView):
    permission_classes = (IsAdminUser,)
    serializer_class = BusinessProfileSerializer
    pagination_class = BusinessMemberCursorPagination

    def get_queryset(self):
        queryset = BusinessProfile.objects.select_related("owner")
        verification_status = self.request.query_params.get("status")
        if verification_status in BusinessProfile.VerificationStatus.values:
            queryset = queryset.filter(verification_status=verification_status)
        kind = self.request.query_params.get("kind")
        if kind in BusinessProfile.Kind.values:
            queryset = queryset.filter(kind=kind)
        query = self.request.query_params.get("q", "").strip()[:100]
        if query:
            queryset = queryset.filter(Q(name__icontains=query) | Q(city__icontains=query))
        return queryset.order_by("-created_at", "-id")


class AdminBusinessReviewView(APIView):
    permission_classes = (IsAdminUser,)

    @transaction.atomic
    def post(self, request, pk: int):
        serializer = BusinessReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        business = get_object_or_404(
            BusinessProfile.objects.select_for_update(), pk=pk
        )
        action = serializer.validated_data["action"]
        status_by_action = {
            "verify": BusinessProfile.VerificationStatus.VERIFIED,
            "reject": BusinessProfile.VerificationStatus.REJECTED,
            "suspend": BusinessProfile.VerificationStatus.SUSPENDED,
        }
        business.verification_status = status_by_action[action]
        business.verification_note = serializer.validated_data.get("note", "")
        business.reviewed_by = request.user
        business.verified_at = timezone.now() if action == "verify" else None
        business.save(
            update_fields=(
                "verification_status",
                "verification_note",
                "reviewed_by",
                "verified_at",
                "updated_at",
            )
        )
        return Response(BusinessProfileSerializer(business).data)


class AdminSubscriptionListView(generics.ListAPIView):
    permission_classes = (IsAdminUser,)
    serializer_class = BusinessSubscriptionSerializer
    pagination_class = BusinessMemberCursorPagination

    def get_queryset(self):
        queryset = BusinessSubscription.objects.select_related("business")
        subscription_status = self.request.query_params.get("status")
        if subscription_status in BusinessSubscription.Status.values:
            queryset = queryset.filter(status=subscription_status)
        return queryset.order_by("-created_at", "-id")


class AdminSubscriptionReviewView(APIView):
    permission_classes = (IsAdminUser,)

    @transaction.atomic
    def post(self, request, pk: int):
        serializer = SubscriptionReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        subscription = get_object_or_404(
            BusinessSubscription.objects.select_for_update().select_related(
                "business__owner"
            ),
            pk=pk,
        )
        action = serializer.validated_data["action"]
        now = timezone.now()
        if action == "approve":
            subscription.status = BusinessSubscription.Status.ACTIVE
            subscription.starts_at = now
            duration = 365 if subscription.plan.endswith("yearly") else 30
            subscription.ends_at = now + timedelta(days=duration)
            subscription.business.kind = BusinessProfile.Kind.AGENCY
            subscription.business.save(update_fields=("kind", "updated_at"))
            owner = subscription.business.owner
            owner.role = User.Role.AGENCY
            owner.save(update_fields=("role",))
        elif action == "reject":
            subscription.status = BusinessSubscription.Status.REJECTED
        else:
            subscription.status = BusinessSubscription.Status.CANCELLED
        subscription.admin_note = serializer.validated_data.get("note", "")
        subscription.reviewed_by = request.user
        subscription.reviewed_at = now
        subscription.save(
            update_fields=(
                "status",
                "starts_at",
                "ends_at",
                "admin_note",
                "reviewed_by",
                "reviewed_at",
                "updated_at",
            )
        )
        return Response(BusinessSubscriptionSerializer(subscription).data)
