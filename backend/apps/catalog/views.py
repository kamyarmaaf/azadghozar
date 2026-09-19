from typing import cast

from django.db import IntegrityError, transaction
from django.db.models import (
    Case,
    Count,
    F,
    IntegerField,
    OuterRef,
    Q,
    Subquery,
    Value,
    When,
)
from django.db.models.functions import Coalesce
from django.db.models.deletion import ProtectedError
from django.utils import timezone
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.decorators import action
from rest_framework import mixins
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet, ModelViewSet

from apps.accounts.models import User
from apps.businesses.models import BusinessMembership, BusinessProfile
from apps.businesses.services import ensure_business_profile
from apps.catalog.models import (
    Brand,
    ListingFavorite,
    VehicleListing,
    VehicleListingImage,
    VehicleModel,
    VehicleTrim,
)
from apps.catalog.pagination import (
    AdminPendingListingPagination,
    CatalogPagination,
    ComparisonCandidatePagination,
)
from apps.catalog.permissions import IsListingOwnerOrReadOnly, IsStaffOrReadOnly
from apps.catalog.selectors import (
    get_brands_queryset,
    get_vehicle_models_queryset,
    get_vehicle_trims_queryset,
)
from apps.catalog.serializers import (
    AdminPendingListingSerializer,
    BrandSerializer,
    ListingFavoriteSerializer,
    VehicleModelSerializer,
    VehicleListingCandidateSerializer,
    VehicleListingComparisonSerializer,
    VehicleListingSerializer,
    VehicleListingSummarySerializer,
    VehicleTrimSerializer,
)


class CatalogModelViewSet(ModelViewSet):
    permission_classes = (IsStaffOrReadOnly,)
    pagination_class = CatalogPagination
    lookup_field = "slug"

    def _include_inactive(self) -> bool:
        return bool(
            self.request.user.is_authenticated
            and self.request.user.is_staff
        )

    def perform_create(self, serializer) -> None:
        try:
            with transaction.atomic():
                serializer.save()
        except IntegrityError as exc:
            raise ValidationError(
                {"detail": "A conflicting catalog record already exists."}
            ) from exc

    def perform_update(self, serializer) -> None:
        try:
            with transaction.atomic():
                serializer.save()
        except IntegrityError as exc:
            raise ValidationError(
                {"detail": "A conflicting catalog record already exists."}
            ) from exc

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        try:
            with transaction.atomic():
                self.perform_destroy(instance)
        except ProtectedError as exc:
            raise ValidationError(
                {
                    "detail": (
                        "This catalog record is referenced by child records "
                        "and cannot be deleted. Deactivate it instead."
                    )
                }
            ) from exc
        return Response(status=status.HTTP_204_NO_CONTENT)


class BrandViewSet(CatalogModelViewSet):
    serializer_class = BrandSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_queryset(self):
        active_listing_count_by_name = (
            VehicleListing.objects.filter(
                status=VehicleListing.Status.ACTIVE,
                brand_name__iexact=OuterRef("name"),
            )
            .values("brand_name")
            .annotate(total=Count("id"))
            .values("total")[:1]
        )
        active_listing_count_by_fa_name = (
            VehicleListing.objects.filter(
                status=VehicleListing.Status.ACTIVE,
                brand_name__iexact=OuterRef("name_fa"),
            )
            .values("brand_name")
            .annotate(total=Count("id"))
            .values("total")[:1]
        )
        queryset = get_brands_queryset(
            include_inactive=self._include_inactive()
        ).annotate(
            listing_count=Coalesce(
                Subquery(active_listing_count_by_name, output_field=IntegerField()),
                Value(0),
            )
            + Coalesce(
                Case(
                    When(name_fa=F("name"), then=Value(0)),
                    default=Subquery(
                        active_listing_count_by_fa_name,
                        output_field=IntegerField(),
                    ),
                    output_field=IntegerField(),
                ),
                Value(0),
            )
        )
        query = self.request.query_params.get("q", "").strip()
        if query:
            queryset = queryset.filter(
                Q(name__icontains=query)
                | Q(name_fa__icontains=query)
            )
        return queryset


class VehicleModelViewSet(CatalogModelViewSet):
    serializer_class = VehicleModelSerializer

    def get_queryset(self):
        return get_vehicle_models_queryset(
            include_inactive=self._include_inactive(),
            brand=self.request.query_params.get("brand"),
            query=self.request.query_params.get("q"),
        )


class VehicleTrimViewSet(CatalogModelViewSet):
    serializer_class = VehicleTrimSerializer

    def get_queryset(self):
        return get_vehicle_trims_queryset(
            include_inactive=self._include_inactive(),
            vehicle_model=self.request.query_params.get("model"),
            query=self.request.query_params.get("q"),
        )


class VehicleListingViewSet(ModelViewSet):
    serializer_class = VehicleListingSerializer
    permission_classes = (IsListingOwnerOrReadOnly,)
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    pagination_class = CatalogPagination

    @staticmethod
    def _with_cover_image(queryset):
        first_image = VehicleListingImage.objects.filter(
            listing_id=OuterRef("pk")
        ).order_by("sort_order", "id")
        return queryset.annotate(
            cover_image_path=Subquery(first_image.values("file")[:1])
        )

    @staticmethod
    def _parse_listing_ids(raw_values: list[str]) -> list[int]:
        if sum(len(value) for value in raw_values) > 100:
            raise ValidationError(
                {"ids": "Provide one to four valid listing IDs."}
            )
        values: list[str] = []
        for raw_value in raw_values:
            values.extend(part.strip() for part in raw_value.split(","))
        if not values or any(not value.isdigit() for value in values):
            raise ValidationError(
                {"ids": "Provide one to four valid listing IDs."}
            )
        ids = list(dict.fromkeys(int(value) for value in values))
        if len(ids) > 4 or any(value < 1 for value in ids):
            raise ValidationError(
                {"ids": "Provide one to four valid listing IDs."}
            )
        return ids

    def get_serializer_class(self):
        if (
            self.action == "list"
            and self.request.query_params.get("summary") == "true"
            and self.request.query_params.get("mine") != "true"
        ):
            return VehicleListingSummarySerializer
        return VehicleListingSerializer

    def get_queryset(self):
        summary = (
            self.action == "list"
            and self.request.query_params.get("summary") == "true"
            and self.request.query_params.get("mine") != "true"
        )
        if summary:
            queryset = self._with_cover_image(VehicleListing.objects.all())
        else:
            queryset = VehicleListing.objects.select_related(
                "owner", "business"
            ).prefetch_related("images")
        user = self.request.user
        mine = self.request.query_params.get("mine") == "true"
        if mine:
            if not user.is_authenticated:
                return queryset.none()
            managed_businesses = BusinessMembership.objects.filter(
                user=user,
                status=BusinessMembership.Status.ACTIVE,
                can_manage_listings=True,
            ).values("business_id")
            queryset = queryset.filter(
                Q(owner=user) | Q(business_id__in=managed_businesses)
            )
        elif user.is_authenticated and user.is_staff:
            pass
        elif user.is_authenticated:
            accessible_businesses = BusinessMembership.objects.filter(
                user=user,
                status=BusinessMembership.Status.ACTIVE,
                can_manage_listings=True,
            ).values("business_id")
            queryset = queryset.filter(
                Q(status=VehicleListing.Status.ACTIVE)
                | Q(owner=user)
                | Q(business_id__in=accessible_businesses)
            )
        else:
            queryset = queryset.filter(status=VehicleListing.Status.ACTIVE)

        query = self.request.query_params.get("q", "").strip()
        if query:
            queryset = queryset.filter(
                Q(brand_name__icontains=query)
                | Q(model_name__icontains=query)
                | Q(trim_name__icontains=query)
                | Q(city__icontains=query)
            )

        campaign = self.request.query_params.get("campaign", "").strip().lower()
        if campaign:
            campaign_filters = {
                "regular": {
                    "is_instant_sale": False,
                    "is_special_sale": False,
                },
                "instant": {
                    "is_instant_sale": True,
                },
                "special": {
                    "is_special_sale": True,
                },
            }
            if campaign not in campaign_filters:
                raise ValidationError(
                    {"campaign": "Choose regular, instant, or special."}
                )
            queryset = queryset.filter(
                status=VehicleListing.Status.ACTIVE,
                **campaign_filters[campaign],
            )

        exact_filters = {
            "status": "status",
            "plate_type": "plate_type",
            "brand": "brand_name__iexact",
            "model": "model_name__icontains",
            "body_type": "body_type__iexact",
            "color": "color__iexact",
            "transmission": "transmission",
            "fuel_type": "fuel_type",
            "condition": "condition",
            "is_instant_sale": "is_instant_sale",
            "is_special_sale": "is_special_sale",
            "is_inspected": "is_inspected",
        }
        for parameter, lookup in exact_filters.items():
            value = self.request.query_params.get(parameter)
            if value not in (None, ""):
                queryset = queryset.filter(**{lookup: value})

        for parameter, lookup in (
            ("brands", "brand_name__iexact"),
            ("body_types", "body_type__iexact"),
        ):
            values = self.request.query_params.getlist(parameter)
            if values:
                if len(values) > 20 or any(
                    not value.strip() or len(value) > 80 for value in values
                ):
                    raise ValidationError({parameter: "Provide 1 to 20 short values."})
                choices = Q()
                for value in values:
                    choices |= Q(**{lookup: value.strip()})
                queryset = queryset.filter(choices)

        city = self.request.query_params.get("city", "").strip()
        if city:
            if len(city) > 80:
                raise ValidationError({"city": "City must be at most 80 characters."})
            queryset = queryset.filter(city__iexact=city)

        range_filters = {
            "year_min": "production_year__gte",
            "year_max": "production_year__lte",
            "price_min": "price__gte",
            "price_max": "price__lte",
            "mileage_min": "mileage__gte",
            "mileage_max": "mileage__lte",
        }
        for parameter, lookup in range_filters.items():
            value = self.request.query_params.get(parameter)
            if value and value.isdigit():
                queryset = queryset.filter(**{lookup: int(value)})

        seller_type = self.request.query_params.get("seller_type")
        if seller_type == "personal":
            queryset = queryset.filter(
                business__isnull=True,
                owner__role=User.Role.SELLER,
            )
        elif seller_type in {User.Role.GALLERY, User.Role.AGENCY}:
            queryset = queryset.filter(
                business__kind=seller_type,
                business__verification_status=(
                    BusinessProfile.VerificationStatus.VERIFIED
                ),
            )

        business_slug = self.request.query_params.get("business", "").strip()
        if business_slug:
            queryset = queryset.filter(
                business__slug=business_slug,
                business__verification_status=(
                    BusinessProfile.VerificationStatus.VERIFIED
                ),
            )

        ordering = {
            "newest": ("-created_at", "-id"),
            "cheapest": ("price", "-created_at"),
            "priciest": ("-price", "-created_at"),
            "lowest-mileage": ("mileage", "-created_at"),
        }.get(self.request.query_params.get("ordering", "newest"))
        if summary:
            queryset = queryset.only(
                "id",
                "brand_name",
                "model_name",
                "trim_name",
                "production_year",
                "plate_type",
                "city",
                "transmission",
                "mileage",
                "price_type",
                "price",
                "is_instant_sale",
                "is_special_sale",
                "is_inspected",
                "created_at",
            )
        return queryset.order_by(*(ordering or ("-created_at", "-id")))

    def perform_create(self, serializer) -> None:
        allowed_roles = {
            User.Role.SELLER,
            User.Role.GALLERY,
            User.Role.AGENCY,
        }
        user = cast(User, self.request.user)
        user_role = user.role
        business = None
        if user_role in {User.Role.GALLERY, User.Role.AGENCY}:
            business = ensure_business_profile(user)
        else:
            membership = (
                BusinessMembership.objects.filter(
                    user=user,
                    status=BusinessMembership.Status.ACTIVE,
                    can_manage_listings=True,
                )
                .select_related("business")
                .first()
            )
            if membership is not None:
                business = membership.business
        if user_role not in allowed_roles and business is None:
            raise ValidationError(
                {
                    "role": (
                        "Only sellers, galleries, and agencies can "
                        "publish vehicle listings."
                    )
                }
            )
        if (
            business is not None
            and business.verification_status
            != BusinessProfile.VerificationStatus.VERIFIED
        ):
            raise ValidationError(
                {
                    "business": (
                        "Business verification must be completed before "
                        "publishing vehicle listings."
                    )
                }
            )
        serializer.save(owner=user, business=business)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.status == VehicleListing.Status.ACTIVE and not (
            request.user.is_authenticated
            and (request.user.is_staff or instance.owner_id == request.user.pk)
        ):
            VehicleListing.objects.filter(pk=instance.pk).update(
                view_count=F("view_count") + 1
            )
            instance.refresh_from_db(fields=["view_count"])
        return Response(self.get_serializer(instance).data)

    @action(
        detail=False,
        methods=("get",),
        url_path="pending-queue",
        permission_classes=(IsAdminUser,),
        pagination_class=AdminPendingListingPagination,
    )
    def pending_queue(self, request):
        queryset = self._with_cover_image(
            VehicleListing.objects.filter(
                status=VehicleListing.Status.PENDING,
            ).select_related("owner")
        ).only(
            "id",
            "owner_id",
            "owner__username",
            "owner__first_name",
            "owner__last_name",
            "owner__phone_number",
            "brand_name",
            "model_name",
            "trim_name",
            "production_year",
            "price",
            "created_at",
        ).order_by("-created_at", "-id")
        page = self.paginate_queryset(queryset)
        serializer = AdminPendingListingSerializer(
            page,
            many=True,
            context=self.get_serializer_context(),
        )
        return self.get_paginated_response(serializer.data)

    @action(
        detail=False,
        methods=("get",),
        url_path="comparison-candidates",
        pagination_class=ComparisonCandidatePagination,
    )
    def comparison_candidates(self, request):
        queryset = VehicleListing.objects.filter(
            status=VehicleListing.Status.ACTIVE
        )
        query = request.query_params.get("q", "").strip()[:100]
        if query and len(query) < 2:
            raise ValidationError(
                {"q": "Search with at least two characters."}
            )
        if query:
            queryset = queryset.filter(
                Q(brand_name__icontains=query)
                | Q(model_name__icontains=query)
                | Q(trim_name__icontains=query)
                | Q(city__icontains=query)
            )

        queryset = self._with_cover_image(queryset).only(
            "id",
            "brand_name",
            "model_name",
            "trim_name",
            "production_year",
            "city",
            "mileage",
            "price_type",
            "price",
            "created_at",
        ).order_by("-created_at", "-id")
        page = self.paginate_queryset(queryset)
        serializer = VehicleListingCandidateSerializer(
            page,
            many=True,
            context=self.get_serializer_context(),
        )
        return self.get_paginated_response(serializer.data)

    @action(
        detail=False,
        methods=("get",),
        url_path="comparison",
    )
    def comparison(self, request):
        listing_ids = self._parse_listing_ids(
            request.query_params.getlist("ids")
        )
        queryset = self._with_cover_image(
            VehicleListing.objects.filter(
                status=VehicleListing.Status.ACTIVE,
                id__in=listing_ids,
            )
        ).only(
            "id",
            "brand_name",
            "model_name",
            "trim_name",
            "production_year",
            "plate_type",
            "city",
            "color",
            "body_type",
            "engine_description",
            "transmission",
            "fuel_type",
            "drivetrain",
            "mileage",
            "condition",
            "body_condition",
            "chassis_condition",
            "engine_condition",
            "insurance_months",
            "price_type",
            "price",
            "is_inspected",
        )
        by_id = {listing.id: listing for listing in queryset}
        ordered_listings = [
            by_id[listing_id]
            for listing_id in listing_ids
            if listing_id in by_id
        ]
        serializer = VehicleListingComparisonSerializer(
            ordered_listings,
            many=True,
            context=self.get_serializer_context(),
        )
        return Response(serializer.data)

    @action(
        detail=True,
        methods=("post",),
        permission_classes=(IsAdminUser,),
    )
    def approve(self, request, pk=None):
        listing = self.get_object()
        campaign = request.data.get("campaign")
        campaign_flags = {
            "regular": (False, False),
            "instant": (True, False),
            "special": (False, True),
        }
        if campaign is not None:
            normalized_campaign = str(campaign).strip().lower()
            if normalized_campaign not in campaign_flags:
                raise ValidationError(
                    {
                        "campaign": (
                            "Choose regular, instant, or special."
                        )
                    }
                )
            (
                listing.is_instant_sale,
                listing.is_special_sale,
            ) = campaign_flags[normalized_campaign]
        listing.status = VehicleListing.Status.ACTIVE
        listing.rejection_reason = ""
        listing.published_at = timezone.now()
        update_fields = [
            "status",
            "rejection_reason",
            "published_at",
            "updated_at",
        ]
        if campaign is not None:
            update_fields.extend(
                ["is_instant_sale", "is_special_sale"]
            )
        listing.save(update_fields=update_fields)
        return Response(self.get_serializer(listing).data)

    @action(
        detail=True,
        methods=("post",),
        permission_classes=(IsAdminUser,),
    )
    def reject(self, request, pk=None):
        reason = str(request.data.get("reason", "")).strip()
        if len(reason) < 5:
            raise ValidationError(
                {"reason": "A rejection reason of at least 5 characters is required."}
            )
        listing = self.get_object()
        listing.status = VehicleListing.Status.REJECTED
        listing.rejection_reason = reason
        listing.save(
            update_fields=["status", "rejection_reason", "updated_at"]
        )
        return Response(self.get_serializer(listing).data)


class ListingFavoriteViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.DestroyModelMixin,
    GenericViewSet,
):
    serializer_class = ListingFavoriteSerializer
    permission_classes = (IsAuthenticated,)
    pagination_class = CatalogPagination
    lookup_field = "listing_id"

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return ListingFavorite.objects.none()
        queryset = ListingFavorite.objects.filter(user=user)
        if self.action != "destroy":
            queryset = queryset.filter(
                listing__status=VehicleListing.Status.ACTIVE
            )
        return (
            queryset
            .select_related("listing", "listing__owner")
            .prefetch_related("listing__images")
        )

    def perform_create(self, serializer) -> None:
        serializer.save(user=self.request.user)
