from django.db.models import F, Q
from django.utils import timezone
from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.content.models import EducationalVideo
from apps.content.pagination import EducationalVideoPagination
from apps.content.serializers import EducationalVideoSerializer


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
