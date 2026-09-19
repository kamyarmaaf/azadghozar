from rest_framework.routers import SimpleRouter

from apps.content.views import EducationalVideoViewSet, FrequentlyAskedQuestionViewSet


app_name = "content"

router = SimpleRouter()
router.register("videos", EducationalVideoViewSet, basename="educational-video")
router.register("faqs", FrequentlyAskedQuestionViewSet, basename="faq")

urlpatterns = router.urls
