from django.conf import settings
from django.http import HttpRequest, HttpResponse
from django.shortcuts import render
from django.views.static import serve


def spa_index(request: HttpRequest, *args, **kwargs) -> HttpResponse:
    """Return the exported Next.js shell for every recognized client route."""
    return render(request, "frontend/index.html")


def frontend_public_asset(request: HttpRequest, path: str) -> HttpResponse:
    """Serve Next public assets; a reverse proxy can replace this in production."""
    return serve(
        request,
        path,
        document_root=settings.FRONTEND_PUBLIC_ROOT,
        show_indexes=False,
    )
