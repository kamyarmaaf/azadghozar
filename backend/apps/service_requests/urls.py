from django.urls import path

from apps.service_requests.views import (
    AdminExpertListView,
    AdminServiceRequestDetailView,
    AdminServiceRequestListView,
    ExpertServiceRequestDetailView,
    ExpertServiceRequestListView,
    ListingVisitAvailabilityView,
    ListingVisitRequestCreateView,
    ManagedListingVisitRequestDetailView,
    ManagedListingVisitRequestListView,
    MyListingVisitRequestCancelView,
    MyListingVisitRequestListView,
    MyServiceRequestListView,
    ServiceRequestCreateView,
)


app_name = "service_requests"

urlpatterns = [
    path("", ServiceRequestCreateView.as_view(), name="create"),
    path("mine/", MyServiceRequestListView.as_view(), name="mine"),
    path("admin/", AdminServiceRequestListView.as_view(), name="admin-list"),
    path("admin/experts/", AdminExpertListView.as_view(), name="admin-experts"),
    path(
        "admin/<uuid:request_id>/",
        AdminServiceRequestDetailView.as_view(),
        name="admin-detail",
    ),
    path("expert/", ExpertServiceRequestListView.as_view(), name="expert-list"),
    path(
        "expert/<uuid:request_id>/",
        ExpertServiceRequestDetailView.as_view(),
        name="expert-detail",
    ),
    path(
        "visits/availability/",
        ListingVisitAvailabilityView.as_view(),
        name="visit-availability",
    ),
    path("visits/", ListingVisitRequestCreateView.as_view(), name="visit-create"),
    path("visits/mine/", MyListingVisitRequestListView.as_view(), name="visit-mine"),
    path(
        "visits/mine/<uuid:request_id>/cancel/",
        MyListingVisitRequestCancelView.as_view(),
        name="visit-cancel",
    ),
    path(
        "visits/managed/",
        ManagedListingVisitRequestListView.as_view(),
        name="visit-managed-list",
    ),
    path(
        "visits/managed/<uuid:request_id>/",
        ManagedListingVisitRequestDetailView.as_view(),
        name="visit-managed-detail",
    ),
]
