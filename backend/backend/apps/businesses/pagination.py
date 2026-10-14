from rest_framework.pagination import CursorPagination


class BusinessCursorPagination(CursorPagination):
    page_size = 12
    page_size_query_param = "page_size"
    max_page_size = 24
    ordering = ("-verified_at", "-id")


class BusinessMemberCursorPagination(CursorPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 50
    ordering = ("-created_at", "-id")


class BusinessListingCursorPagination(CursorPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 50
    ordering = ("-created_at", "-id")
