from rest_framework.pagination import CursorPagination, PageNumberPagination


class CatalogPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = "page_size"
    max_page_size = 100


class ComparisonCandidatePagination(CursorPagination):
    """Fast pagination for a listing stream that may contain millions of rows."""

    page_size = 16
    page_size_query_param = "page_size"
    max_page_size = 24
    ordering = ("-created_at", "-id")
