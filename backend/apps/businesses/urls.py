from django.urls import path

from apps.businesses.views import (
    AdminBusinessListView,
    AdminBusinessReviewView,
    AdminSubscriptionListView,
    AdminSubscriptionReviewView,
    BusinessDashboardView,
    BusinessMemberDetailView,
    BusinessMemberListCreateView,
    BusinessSubscriptionListCreateView,
    MyBusinessListingView,
    MyBusinessView,
    PublicBusinessDetailView,
    PublicBusinessListView,
    PublicBusinessListingView,
)

app_name = "businesses"

urlpatterns = [
    path("", PublicBusinessListView.as_view(), name="business-list"),
    path("me/profile/", MyBusinessView.as_view(), name="my-business"),
    path("me/dashboard/", BusinessDashboardView.as_view(), name="business-dashboard"),
    path("me/listings/", MyBusinessListingView.as_view(), name="my-business-listings"),
    path("me/members/", BusinessMemberListCreateView.as_view(), name="business-members"),
    path(
        "me/members/<int:member_id>/",
        BusinessMemberDetailView.as_view(),
        name="business-member-detail",
    ),
    path(
        "me/subscriptions/",
        BusinessSubscriptionListCreateView.as_view(),
        name="business-subscriptions",
    ),
    path("admin/profiles/", AdminBusinessListView.as_view(), name="admin-business-list"),
    path(
        "admin/profiles/<int:pk>/review/",
        AdminBusinessReviewView.as_view(),
        name="admin-business-review",
    ),
    path(
        "admin/subscriptions/",
        AdminSubscriptionListView.as_view(),
        name="admin-subscription-list",
    ),
    path(
        "admin/subscriptions/<int:pk>/review/",
        AdminSubscriptionReviewView.as_view(),
        name="admin-subscription-review",
    ),
    path(
        "<str:slug>/listings/",
        PublicBusinessListingView.as_view(),
        name="business-listings",
    ),
    path("<str:slug>/", PublicBusinessDetailView.as_view(), name="business-detail"),
]
