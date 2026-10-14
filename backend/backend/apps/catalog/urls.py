from rest_framework.routers import SimpleRouter

from apps.catalog.views import (
    BrandViewSet,
    BodyTypeViewSet,
    ListingFavoriteViewSet,
    VehicleListingViewSet,
    VehicleModelViewSet,
    VehicleTrimViewSet,
)
from apps.catalog.messaging import ListingConversationViewSet


app_name = "catalog"

router = SimpleRouter()
router.register("brands", BrandViewSet, basename="brand")
router.register("body-types", BodyTypeViewSet, basename="body-type")
router.register("models", VehicleModelViewSet, basename="vehicle-model")
router.register("trims", VehicleTrimViewSet, basename="vehicle-trim")
router.register("listings", VehicleListingViewSet, basename="vehicle-listing")
router.register("favorites", ListingFavoriteViewSet, basename="listing-favorite")
router.register("conversations", ListingConversationViewSet, basename="listing-conversation")

urlpatterns = router.urls
