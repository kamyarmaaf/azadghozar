from django.db.models import Q, QuerySet

from apps.catalog.models import Brand, VehicleModel, VehicleTrim


def get_brands_queryset(*, include_inactive: bool = False) -> QuerySet[Brand]:
    queryset = Brand.objects.all()
    if not include_inactive:
        queryset = queryset.filter(is_active=True)
    return queryset


def get_vehicle_models_queryset(
    *,
    include_inactive: bool = False,
    brand: str | None = None,
    query: str | None = None,
) -> QuerySet[VehicleModel]:
    queryset = VehicleModel.objects.select_related("brand")

    if not include_inactive:
        queryset = queryset.filter(
            is_active=True,
            brand__is_active=True,
        )

    if brand:
        if brand.isdigit():
            queryset = queryset.filter(brand_id=int(brand))
        else:
            queryset = queryset.filter(brand__slug=brand)

    if query:
        queryset = queryset.filter(
            Q(name__icontains=query)
            | Q(name_fa__icontains=query)
            | Q(brand__name__icontains=query)
            | Q(brand__name_fa__icontains=query)
        )

    return queryset


def get_vehicle_trims_queryset(
    *,
    include_inactive: bool = False,
    vehicle_model: str | None = None,
    query: str | None = None,
) -> QuerySet[VehicleTrim]:
    queryset = VehicleTrim.objects.select_related(
        "vehicle_model",
        "vehicle_model__brand",
    )

    if not include_inactive:
        queryset = queryset.filter(
            is_active=True,
            vehicle_model__is_active=True,
            vehicle_model__brand__is_active=True,
        )

    if vehicle_model:
        if vehicle_model.isdigit():
            queryset = queryset.filter(vehicle_model_id=int(vehicle_model))
        else:
            queryset = queryset.filter(vehicle_model__slug=vehicle_model)

    if query:
        queryset = queryset.filter(
            Q(name__icontains=query)
            | Q(name_fa__icontains=query)
            | Q(vehicle_model__name__icontains=query)
            | Q(vehicle_model__name_fa__icontains=query)
            | Q(vehicle_model__brand__name__icontains=query)
            | Q(vehicle_model__brand__name_fa__icontains=query)
        )

    return queryset
