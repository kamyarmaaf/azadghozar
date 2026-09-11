from django.db.models import Q
from rest_framework import generics, status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from apps.accounts.models import User
from apps.accounts.services.otp import normalize_phone_number
from apps.service_requests.models import ServiceRequest
from apps.service_requests.pagination import (
    ExpertCursorPagination,
    ServiceRequestCursorPagination,
)
from apps.service_requests.permissions import IsExpertOrAdmin
from apps.service_requests.serializers import (
    AdminServiceRequestUpdateSerializer,
    ExpertOptionSerializer,
    ExpertServiceRequestUpdateSerializer,
    ServiceRequestCreateSerializer,
    ServiceRequestSerializer,
)


def service_request_queryset():
    return ServiceRequest.objects.select_related(
        "requester",
        "listing",
        "assigned_expert",
    )


class ServiceRequestCreateView(generics.CreateAPIView):
    permission_classes = (AllowAny,)
    throttle_classes = (ScopedRateThrottle,)
    throttle_scope = "service_request_create"
    serializer_class = ServiceRequestCreateSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        requester = request.user if request.user.is_authenticated else None
        instance = serializer.save(requester=requester)
        output = ServiceRequestSerializer(instance)
        return Response(output.data, status=status.HTTP_201_CREATED)


class MyServiceRequestListView(generics.ListAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = ServiceRequestSerializer
    pagination_class = ServiceRequestCursorPagination

    def get_queryset(self):
        queryset = service_request_queryset().filter(
            requester=self.request.user
        )
        service_type = self.request.query_params.get("service_type")
        if service_type in ServiceRequest.ServiceType.values:
            queryset = queryset.filter(service_type=service_type)
        return queryset.order_by("-created_at", "-id")


class AdminServiceRequestListView(generics.ListAPIView):
    permission_classes = (IsAdminUser,)
    serializer_class = ServiceRequestSerializer
    pagination_class = ServiceRequestCursorPagination

    def get_queryset(self):
        queryset = service_request_queryset()
        service_type = self.request.query_params.get("service_type")
        if service_type in ServiceRequest.ServiceType.values:
            queryset = queryset.filter(service_type=service_type)
        request_status = self.request.query_params.get("status")
        if request_status in ServiceRequest.Status.values:
            queryset = queryset.filter(status=request_status)
        priority = self.request.query_params.get("priority")
        if priority in ServiceRequest.Priority.values:
            queryset = queryset.filter(priority=priority)
        query = self.request.query_params.get("q", "").strip()[:100]
        if query:
            try:
                phone_number = normalize_phone_number(query)
            except ValidationError:
                queryset = queryset.filter(contact_name__icontains=query)
            else:
                queryset = queryset.filter(contact_phone=phone_number)
        return queryset.order_by("-created_at", "-id")


class AdminServiceRequestDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = (IsAdminUser,)
    lookup_field = "public_id"
    lookup_url_kwarg = "request_id"

    def get_queryset(self):
        return service_request_queryset()

    def get_serializer_class(self):
        if self.request.method in {"PUT", "PATCH"}:
            return AdminServiceRequestUpdateSerializer
        return ServiceRequestSerializer

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(
            instance,
            data=request.data,
            partial=partial,
        )
        serializer.is_valid(raise_exception=True)
        updated = serializer.save()
        return Response(ServiceRequestSerializer(updated).data)


class ExpertServiceRequestListView(generics.ListAPIView):
    permission_classes = (IsExpertOrAdmin,)
    serializer_class = ServiceRequestSerializer
    pagination_class = ServiceRequestCursorPagination

    def get_queryset(self):
        queryset = service_request_queryset()
        if not self.request.user.is_staff:
            queryset = queryset.filter(assigned_expert=self.request.user)
        request_status = self.request.query_params.get("status")
        if request_status in ServiceRequest.Status.values:
            queryset = queryset.filter(status=request_status)
        return queryset.order_by("-created_at", "-id")


class ExpertServiceRequestDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = (IsExpertOrAdmin,)
    lookup_field = "public_id"
    lookup_url_kwarg = "request_id"

    def get_queryset(self):
        queryset = service_request_queryset()
        if not self.request.user.is_staff:
            queryset = queryset.filter(assigned_expert=self.request.user)
        return queryset

    def get_serializer_class(self):
        if self.request.method in {"PUT", "PATCH"}:
            return ExpertServiceRequestUpdateSerializer
        return ServiceRequestSerializer

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(
            instance,
            data=request.data,
            partial=partial,
        )
        serializer.is_valid(raise_exception=True)
        updated = serializer.save()
        return Response(ServiceRequestSerializer(updated).data)


class AdminExpertListView(generics.ListAPIView):
    permission_classes = (IsAdminUser,)
    serializer_class = ExpertOptionSerializer
    pagination_class = ExpertCursorPagination

    def get_queryset(self):
        queryset = User.objects.filter(
            role=User.Role.EXPERT,
            is_active=True,
        )
        query = self.request.query_params.get("q", "").strip()[:100]
        if query:
            queryset = queryset.filter(
                Q(first_name__icontains=query)
                | Q(last_name__icontains=query)
                | Q(phone_number__icontains=query)
            )
        return queryset.order_by("-id")
