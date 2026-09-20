from django.urls import path
from rest_framework.routers import SimpleRouter

from apps.content.views import (
    AboutPageAPIView,
    ArticleViewSet,
    ContactMessageCreateAPIView,
    ContactPageAPIView,
    EducationalVideoViewSet,
    FrequentlyAskedQuestionViewSet,
)


app_name = "content"

router = SimpleRouter()
router.register("videos", EducationalVideoViewSet, basename="educational-video")
router.register("faqs", FrequentlyAskedQuestionViewSet, basename="faq")
router.register("articles", ArticleViewSet, basename="article")

urlpatterns = [
    path("about/", AboutPageAPIView.as_view(), name="about"),
    path("contact/", ContactPageAPIView.as_view(), name="contact"),
    path("contact/messages/", ContactMessageCreateAPIView.as_view(), name="contact-message-create"),
    *router.urls,
]
