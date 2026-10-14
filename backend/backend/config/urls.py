from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path, re_path
from rest_framework.decorators import (
    api_view,
    permission_classes,
)
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from config.frontend import frontend_public_asset, spa_index


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
        "api/v1/content/",
        include("apps.content.urls"),
    ),
    path(
        "api/v1/service-requests/",
        include("apps.service_requests.urls"),
    ),
    re_path(
        r"^(?P<path>(?:images/.+|logo\.(?:png|svg)|robots\.txt))$",
        frontend_public_asset,
        name="frontend-public-asset",
    ),
    path("", spa_index, name="frontend-home"),
    re_path(
        r"^(?:"
        r"cars(?:/[^/]+(?:/edit)?)?|buy|sell|compare|instant-sale|special-sale|"
        r"favorites|brands(?:/[^/]+)?|agencies(?:/[^/]+)?|"
        r"dealerships(?:/[^/]+)?|galleries(?:/[^/]+)?|"
        r"services(?:/(?:ownership-transfer|transportation|inspection|consultation))?|"
        r"videos(?:/[^/]+)?|magazine(?:/[^/]+)?|blog(?:/[^/]+)?|faq|about|contact|"
        r"login|register|forgot-password|account-type|"
        r"dashboard/(?:buyer|seller|gallery|agency|expert|admin)|"
        r"pricing|organization|smart-id|terms|privacy"
        r")/?$",
        spa_index,
        name="frontend-spa",
    ),
]

if settings.DEBUG or settings.SERVE_MEDIA_FILES:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT,
    )
