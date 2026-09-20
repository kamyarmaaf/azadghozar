from django.db.models import F, Q
from django.utils import timezone
from rest_framework import generics, mixins, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from apps.content.models import (
    AboutPage,
    Article,
    ContactPage,
    EducationalVideo,
    FrequentlyAskedQuestion,
)
from apps.content.pagination import (
    EducationalVideoPagination,
    FrequentlyAskedQuestionPagination,
    ArticlePagination,
)
from apps.content.serializers import (
    EducationalVideoSerializer,
    FrequentlyAskedQuestionSerializer,
    ArticleSerializer,
    AboutPageSerializer,
    ContactMessageCreateSerializer,
    ContactPageSerializer,
)


class AboutPageAPIView(APIView):
    permission_classes = (AllowAny,)

    def get(self, request):
        page = (
            AboutPage.objects.filter(site_key="main", is_published=True)
            .prefetch_related("statistics", "team_members", "trust_items")
            .first()
        )
        if page is None:
            raise NotFound("محتوای صفحه درباره ما هنوز منتشر نشده است.")
        return Response(AboutPageSerializer(page, context={"request": request}).data)


class ContactPageAPIView(APIView):
    permission_classes = (AllowAny,)

    def get(self, request):
        page = ContactPage.objects.filter(site_key="main", is_published=True).first()
        if page is None:
            raise NotFound("اطلاعات صفحه تماس با ما هنوز منتشر نشده است.")
        return Response(ContactPageSerializer(page).data)


class ContactMessageCreateAPIView(generics.CreateAPIView):
    permission_classes = (AllowAny,)
    throttle_classes = (ScopedRateThrottle,)
    throttle_scope = "contact_message_create"
    serializer_class = ContactMessageCreateSerializer


class EducationalVideoViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = EducationalVideoSerializer
    permission_classes = (AllowAny,)
    pagination_class = EducationalVideoPagination
    lookup_field = "slug"

    def get_queryset(self):
        queryset = EducationalVideo.objects.filter(
            is_published=True,
            published_at__lte=timezone.now(),
        )
        category = self.request.query_params.get("category", "").strip()
        query = self.request.query_params.get("q", "").strip()
        if category:
            queryset = queryset.filter(category=category)
        if query:
            queryset = queryset.filter(
                Q(title__icontains=query)
                | Q(description__icontains=query)
                | Q(author__icontains=query)
            )
        return queryset

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        EducationalVideo.objects.filter(pk=instance.pk).update(
            view_count=F("view_count") + 1,
        )
        instance.refresh_from_db(fields=("view_count",))
        return Response(self.get_serializer(instance).data)

    @action(detail=False, methods=("get",), url_path="categories")
    def categories(self, request):
        return Response(
            [
                {"value": value, "label": label}
                for value, label in EducationalVideo.Category.choices
            ]
        )


class FrequentlyAskedQuestionViewSet(
    mixins.ListModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = FrequentlyAskedQuestionSerializer
    permission_classes = (AllowAny,)
    pagination_class = FrequentlyAskedQuestionPagination

    def get_queryset(self):
        queryset = FrequentlyAskedQuestion.objects.filter(is_published=True)
        category = self.request.query_params.get("category", "").strip()
        query = self.request.query_params.get("q", "").strip()
        if category:
            queryset = queryset.filter(category=category)
        if query:
            queryset = queryset.filter(
                Q(question__icontains=query) | Q(answer__icontains=query)
            )
        return queryset

    @action(detail=False, methods=("get",), url_path="categories")
    def categories(self, request):
        return Response(
            [
                {"value": value, "label": label}
                for value, label in FrequentlyAskedQuestion.Category.choices
            ]
        )


class ArticleViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = ArticleSerializer
    permission_classes = (AllowAny,)
    pagination_class = ArticlePagination
    lookup_field = "slug"

    def get_queryset(self):
        queryset = Article.objects.filter(
            is_published=True,
            published_at__lte=timezone.now(),
        )
        category = self.request.query_params.get("category", "").strip()
        query = self.request.query_params.get("q", "").strip()
        if category:
            queryset = queryset.filter(category=category)
        if query:
            queryset = queryset.filter(
                Q(title__icontains=query)
                | Q(summary__icontains=query)
                | Q(content__icontains=query)
                | Q(author__icontains=query)
            )
        return queryset

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        Article.objects.filter(pk=instance.pk).update(
            view_count=F("view_count") + 1,
        )
        instance.refresh_from_db(fields=("view_count",))
        return Response(self.get_serializer(instance).data)

    @action(detail=False, methods=("get",), url_path="categories")
    def categories(self, request):
        return Response(
            [
                {"value": value, "label": label}
                for value, label in Article.Category.choices
            ]
        )
