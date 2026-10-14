from django.db.models import F, Q
from django.utils import timezone
from uuid import UUID
from rest_framework import generics, mixins, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.permissions import AllowAny
from django.db import transaction
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from apps.content.models import (
    AboutPage,
    Article,
    ContactPage,
    EducationalVideo,
    FrequentlyAskedQuestion,
    SupportConversation,
    SupportMessage,
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
    SupportMessageSerializer,
)
from apps.content.support_ai import ai_support_enabled, generate_support_reply


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


class SupportChatAPIView(APIView):
    permission_classes = (AllowAny,)
    throttle_classes = (ScopedRateThrottle,)
    throttle_scope = "support_chat"

    def _guest_id(self, request) -> UUID:
        raw_value = request.query_params.get("session_id") or request.data.get("session_id")
        if not raw_value:
            raise ValidationError({"session_id": "شناسه نشست پشتیبانی ارسال نشده است."})
        try:
            return UUID(str(raw_value))
        except (TypeError, ValueError, AttributeError) as exc:
            raise ValidationError({"session_id": "شناسه نشست پشتیبانی معتبر نیست."}) from exc

    def _conversation(self, request, *, create: bool = False):
        if request.user.is_authenticated:
            query = {"user": request.user}
        else:
            query = {"guest_id": self._guest_id(request)}
        if create:
            return SupportConversation.objects.get_or_create(**query)[0]
        return SupportConversation.objects.filter(**query).first()

    def get(self, request):
        conversation = self._conversation(request)
        messages = conversation.messages.all() if conversation else SupportMessage.objects.none()
        return Response(
            {
                "conversation_id": str(conversation.public_id) if conversation else None,
                "messages": SupportMessageSerializer(messages, many=True).data,
                "ai_enabled": ai_support_enabled(),
            }
        )

    def post(self, request):
        serializer = SupportMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            conversation = self._conversation(request, create=True)
            history = list(conversation.messages.order_by("-created_at", "-id")[:10])
            history.reverse()
            if conversation.status == SupportConversation.Status.CLOSED:
                conversation.status = SupportConversation.Status.OPEN
            conversation.save(update_fields=("status", "updated_at"))
            message = serializer.save(conversation=conversation, sender=SupportMessage.Sender.USER)

        reply_text = generate_support_reply(question=message.text, history=history)
        reply = SupportMessage.objects.create(
            conversation=conversation,
            sender=SupportMessage.Sender.AI,
            text=reply_text,
        )
        return Response(
            {
                **SupportMessageSerializer(message).data,
                "reply": SupportMessageSerializer(reply).data,
                "conversation_id": str(conversation.public_id),
                "ai_enabled": ai_support_enabled(),
            },
            status=201,
        )


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
