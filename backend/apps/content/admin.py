from django import forms
from django.contrib import admin
from django.core.files.uploadedfile import UploadedFile

from apps.content.models import (
    AboutPage,
    AboutStatistic,
    AboutTrustItem,
    Article,
    ContactMessage,
    ContactPage,
    EducationalVideo,
    FrequentlyAskedQuestion,
    TeamMember,
)
from apps.image_processing import InvalidImageUpload, compress_uploaded_image


ALLOWED_VIDEO_TYPES = {"video/mp4", "video/webm", "video/quicktime"}
MAX_EDUCATIONAL_VIDEO_BYTES = 500 * 1024 * 1024


class EducationalVideoAdminForm(forms.ModelForm):
    class Meta:
        model = EducationalVideo
        fields = "__all__"

    def clean_thumbnail(self):
        upload = self.cleaned_data.get("thumbnail")
        if not isinstance(upload, UploadedFile):
            return upload
        try:
            return compress_uploaded_image(
                upload,
                max_input_bytes=10 * 1024 * 1024,
                target_bytes=600 * 1024,
                max_dimension=1920,
            )
        except InvalidImageUpload as exc:
            raise forms.ValidationError(str(exc)) from exc

    def clean_video(self):
        upload = self.cleaned_data.get("video")
        if not isinstance(upload, UploadedFile):
            return upload
        if upload.size > MAX_EDUCATIONAL_VIDEO_BYTES:
            raise forms.ValidationError("حجم ویدیو نباید بیشتر از ۵۰۰ مگابایت باشد.")
        if getattr(upload, "content_type", "") not in ALLOWED_VIDEO_TYPES:
            raise forms.ValidationError("فقط فایل MP4، WebM یا MOV قابل قبول است.")
        return upload


@admin.register(EducationalVideo)
class EducationalVideoAdmin(admin.ModelAdmin):
    form = EducationalVideoAdminForm
    list_display = (
        "title",
        "category",
        "is_published",
        "view_count",
        "sort_order",
        "published_at",
    )
    list_filter = ("is_published", "category", "published_at")
    search_fields = ("title", "description", "author")
    list_editable = ("is_published", "sort_order")
    readonly_fields = ("view_count", "created_at", "updated_at")
    prepopulated_fields = {"slug": ("title",)}
    ordering = ("sort_order", "-published_at", "-id")
    date_hierarchy = "published_at"


@admin.register(FrequentlyAskedQuestion)
class FrequentlyAskedQuestionAdmin(admin.ModelAdmin):
    list_display = (
        "question",
        "category",
        "is_published",
        "sort_order",
        "updated_at",
    )
    list_filter = ("is_published", "category")
    search_fields = ("question", "answer")
    list_editable = ("is_published", "sort_order")
    readonly_fields = ("created_at", "updated_at")
    ordering = ("sort_order", "id")


class ArticleAdminForm(forms.ModelForm):
    class Meta:
        model = Article
        fields = "__all__"

    def clean_cover_image(self):
        upload = self.cleaned_data.get("cover_image")
        if not isinstance(upload, UploadedFile):
            return upload
        try:
            return compress_uploaded_image(
                upload,
                max_input_bytes=12 * 1024 * 1024,
                target_bytes=900 * 1024,
                max_dimension=2400,
            )
        except InvalidImageUpload as exc:
            raise forms.ValidationError(str(exc)) from exc


@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    form = ArticleAdminForm
    list_display = (
        "title",
        "category",
        "author",
        "is_published",
        "view_count",
        "sort_order",
        "published_at",
    )
    list_filter = ("is_published", "category", "published_at")
    search_fields = ("title", "summary", "content", "author")
    list_editable = ("is_published", "sort_order")
    readonly_fields = ("view_count", "created_at", "updated_at")
    prepopulated_fields = {"slug": ("title",)}
    ordering = ("sort_order", "-published_at", "-id")
    date_hierarchy = "published_at"


class AboutPageAdminForm(forms.ModelForm):
    class Meta:
        model = AboutPage
        fields = "__all__"

    def clean_hero_image(self):
        upload = self.cleaned_data.get("hero_image")
        if not isinstance(upload, UploadedFile):
            return upload
        try:
            return compress_uploaded_image(
                upload,
                max_input_bytes=12 * 1024 * 1024,
                target_bytes=900 * 1024,
                max_dimension=2400,
            )
        except InvalidImageUpload as exc:
            raise forms.ValidationError(str(exc)) from exc


class TeamMemberAdminForm(forms.ModelForm):
    class Meta:
        model = TeamMember
        fields = "__all__"

    def clean_photo(self):
        upload = self.cleaned_data.get("photo")
        if not isinstance(upload, UploadedFile):
            return upload
        try:
            return compress_uploaded_image(
                upload,
                max_input_bytes=8 * 1024 * 1024,
                target_bytes=450 * 1024,
                max_dimension=1200,
            )
        except InvalidImageUpload as exc:
            raise forms.ValidationError(str(exc)) from exc


class AboutStatisticInline(admin.TabularInline):
    model = AboutStatistic
    extra = 0


class TeamMemberInline(admin.StackedInline):
    model = TeamMember
    form = TeamMemberAdminForm
    extra = 0


class AboutTrustItemInline(admin.TabularInline):
    model = AboutTrustItem
    extra = 0


@admin.register(AboutPage)
class AboutPageAdmin(admin.ModelAdmin):
    form = AboutPageAdminForm
    list_display = ("hero_title", "is_published", "updated_at")
    list_editable = ("is_published",)
    readonly_fields = ("created_at", "updated_at")
    inlines = (AboutStatisticInline, TeamMemberInline, AboutTrustItemInline)
    fieldsets = (
        ("معرفی", {"fields": ("hero_title", "intro", "hero_image", "is_published")}),
        (
            "مأموریت، چشم‌انداز و ارزش‌ها",
            {
                "fields": (
                    "why_title",
                    "mission_title",
                    "mission_text",
                    "vision_title",
                    "vision_text",
                    "values_title",
                    "values_text",
                )
            },
        ),
        (
            "عنوان و نمایش بخش‌ها",
            {"fields": ("team_title", "trust_title", "show_statistics", "show_team", "show_trust_items")},
        ),
        ("سئو", {"fields": ("meta_title", "meta_description"), "classes": ("collapse",)}),
        ("زمان‌ها", {"fields": ("created_at", "updated_at"), "classes": ("collapse",)}),
    )

    def has_add_permission(self, request) -> bool:
        return not AboutPage.objects.exists()


@admin.register(ContactPage)
class ContactPageAdmin(admin.ModelAdmin):
    list_display = ("title", "phone", "email", "is_published", "updated_at")
    list_editable = ("is_published",)
    readonly_fields = ("created_at", "updated_at")
    fieldsets = (
        ("معرفی صفحه", {"fields": ("title", "subtitle", "is_published")}),
        ("فرم و اطلاعات تماس", {"fields": ("form_title", "information_title", "address", "phone", "email", "working_hours")}),
        ("شبکه‌های اجتماعی", {"fields": ("social_title", "instagram_url", "whatsapp_url")}),
        ("نقشه", {"fields": ("map_embed_url", "map_link")}),
        ("سئو", {"fields": ("meta_title", "meta_description"), "classes": ("collapse",)}),
        ("زمان‌ها", {"fields": ("created_at", "updated_at"), "classes": ("collapse",)}),
    )

    def has_add_permission(self, request) -> bool:
        return not ContactPage.objects.exists()


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ("public_id", "name", "subject", "status", "email", "phone", "created_at")
    list_display_links = ("public_id", "name")
    list_filter = ("status", "subject", "created_at")
    search_fields = ("public_id", "name", "email", "phone", "message")
    list_editable = ("status",)
    readonly_fields = ("public_id", "name", "email", "phone", "subject", "message", "created_at", "updated_at")
    ordering = ("-created_at", "-id")
    date_hierarchy = "created_at"
    actions = ("mark_in_review", "mark_replied", "mark_closed")
    fieldsets = (
        ("فرستنده", {"fields": ("public_id", "name", "email", "phone")}),
        ("پیام", {"fields": ("subject", "message")}),
        ("رسیدگی", {"fields": ("status", "admin_note")}),
        ("زمان‌ها", {"fields": ("created_at", "updated_at")}),
    )

    def has_add_permission(self, request) -> bool:
        return False

    @admin.action(description="انتقال پیام‌های انتخاب‌شده به در حال بررسی")
    def mark_in_review(self, request, queryset) -> None:
        queryset.update(status=ContactMessage.Status.IN_REVIEW)

    @admin.action(description="علامت‌گذاری پیام‌های انتخاب‌شده به‌عنوان پاسخ داده شده")
    def mark_replied(self, request, queryset) -> None:
        queryset.update(status=ContactMessage.Status.REPLIED)

    @admin.action(description="بستن پیام‌های انتخاب‌شده")
    def mark_closed(self, request, queryset) -> None:
        queryset.update(status=ContactMessage.Status.CLOSED)
