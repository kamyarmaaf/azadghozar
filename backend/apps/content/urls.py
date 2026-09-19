from rest_framework.routers import SimpleRouter

from apps.content.views import EducationalVideoViewSet


app_name = "content"

router = SimpleRouter()
router.register("videos", EducationalVideoViewSet, basename="educational-video")

urlpatterns = router.urls
