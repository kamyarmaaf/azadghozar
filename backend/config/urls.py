from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from rest_framework.decorators import (
    api_view,
    permission_classes,
)
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request):
    return Response(
        {
            "status": "ok",
            "message": "Karvo backend is running.",
        }
    )


urlpatterns = [
    path(
        "admin/",
        admin.site.urls,
    ),
    path(
        "api/health/",
        health_check,
        name="health-check",
    ),
    path(
        "api/v1/auth/",
        include("apps.accounts.urls"),
    ),
    path(
        "api/v1/catalog/",
        include("apps.catalog.urls"),
    ),
    path(
        "api/v1/businesses/",
        include("apps.businesses.urls"),
    ),
    path(
        "api/v1/service-requests/",
        include("apps.service_requests.urls"),
    ),
]

if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT,
    )
