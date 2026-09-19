from django import forms
from django.contrib import admin
from django.core.files.uploadedfile import UploadedFile

from apps.content.models import EducationalVideo, FrequentlyAskedQuestion
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
