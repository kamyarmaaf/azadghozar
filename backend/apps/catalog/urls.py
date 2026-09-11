from rest_framework.routers import SimpleRouter

from apps.catalog.views import (
    BrandViewSet,
    ListingFavoriteViewSet,
    VehicleListingViewSet,
    VehicleModelViewSet,
    VehicleTrimViewSet,
)


app_name = "catalog"

router = SimpleRouter()
router.register("brands", BrandViewSet, basename="brand")
router.register("models", VehicleModelViewSet, basename="vehicle-model")
router.register("trims", VehicleTrimViewSet, basename="vehicle-trim")
router.register("listings", VehicleListingViewSet, basename="vehicle-listing")
router.register("favorites", ListingFavoriteViewSet, basename="listing-favorite")

urlpatterns = router.urls
