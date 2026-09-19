from rest_framework import serializers

from apps.content.models import EducationalVideo


class EducationalVideoSerializer(serializers.ModelSerializer):
    category_label = serializers.CharField(
        source="get_category_display",
        read_only=True,
    )
    thumbnail_url = serializers.SerializerMethodField()
    video_url = serializers.SerializerMethodField()

    class Meta:
        model = EducationalVideo
        fields = (
            "id",
            "title",
            "slug",
            "category",
            "category_label",
            "description",
            "content",
            "author",
            "duration",
            "thumbnail_url",
            "video_url",
            "view_count",
            "published_at",
        )

    def _absolute_file_url(self, field) -> str:
        if not field:
            return ""
        try:
            url = field.url
        except ValueError:
            return ""
        request = self.context.get("request")
        return request.build_absolute_uri(url) if request else url

    def get_thumbnail_url(self, obj: EducationalVideo) -> str:
        return self._absolute_file_url(obj.thumbnail)

    def get_video_url(self, obj: EducationalVideo) -> str:
        return self._absolute_file_url(obj.video)
