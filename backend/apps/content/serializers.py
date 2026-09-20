from rest_framework import serializers

from apps.accounts.services.otp import normalize_phone_number
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


class FrequentlyAskedQuestionSerializer(serializers.ModelSerializer):
    category_label = serializers.CharField(
        source="get_category_display",
        read_only=True,
    )

    class Meta:
        model = FrequentlyAskedQuestion
        fields = (
            "id",
            "question",
            "answer",
            "category",
            "category_label",
        )


class ArticleSerializer(serializers.ModelSerializer):
    category_label = serializers.CharField(
        source="get_category_display",
        read_only=True,
    )
    cover_image_url = serializers.SerializerMethodField()

    class Meta:
        model = Article
        fields = (
            "id",
            "title",
            "slug",
            "summary",
            "content",
            "category",
            "category_label",
            "author",
            "read_time",
            "cover_image_url",
            "meta_title",
            "meta_description",
            "view_count",
            "published_at",
        )

    def get_cover_image_url(self, obj: Article) -> str:
        if not obj.cover_image:
            return ""
        try:
            url = obj.cover_image.url
        except ValueError:
            return ""
        request = self.context.get("request")
        return request.build_absolute_uri(url) if request else url


class AboutStatisticSerializer(serializers.ModelSerializer):
    class Meta:
        model = AboutStatistic
        fields = ("id", "label", "value", "suffix", "icon")


class TeamMemberSerializer(serializers.ModelSerializer):
    photo_url = serializers.SerializerMethodField()

    class Meta:
        model = TeamMember
        fields = ("id", "name", "role", "description", "photo_url")

    def get_photo_url(self, obj: TeamMember) -> str:
        if not obj.photo:
            return ""
        try:
            url = obj.photo.url
        except ValueError:
            return ""
        request = self.context.get("request")
        return request.build_absolute_uri(url) if request else url


class AboutTrustItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = AboutTrustItem
        fields = ("id", "title", "description", "icon")


class AboutPageSerializer(serializers.ModelSerializer):
    hero_image_url = serializers.SerializerMethodField()
    statistics = AboutStatisticSerializer(many=True, read_only=True)
    team_members = serializers.SerializerMethodField()
    trust_items = serializers.SerializerMethodField()

    class Meta:
        model = AboutPage
        fields = (
            "hero_title",
            "intro",
            "hero_image_url",
            "why_title",
            "mission_title",
            "mission_text",
            "vision_title",
            "vision_text",
            "values_title",
            "values_text",
            "team_title",
            "trust_title",
            "show_statistics",
            "show_team",
            "show_trust_items",
            "statistics",
            "team_members",
            "trust_items",
            "meta_title",
            "meta_description",
            "updated_at",
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

    def get_hero_image_url(self, obj: AboutPage) -> str:
        return self._absolute_file_url(obj.hero_image)

    def get_team_members(self, obj: AboutPage):
        queryset = obj.team_members.filter(is_active=True)
        return TeamMemberSerializer(queryset, many=True, context=self.context).data

    def get_trust_items(self, obj: AboutPage):
        queryset = obj.trust_items.filter(is_active=True)
        return AboutTrustItemSerializer(queryset, many=True).data


class ContactPageSerializer(serializers.ModelSerializer):
    subjects = serializers.SerializerMethodField()

    class Meta:
        model = ContactPage
        fields = (
            "title",
            "subtitle",
            "form_title",
            "information_title",
            "address",
            "phone",
            "email",
            "working_hours",
            "social_title",
            "instagram_url",
            "whatsapp_url",
            "map_embed_url",
            "map_link",
            "meta_title",
            "meta_description",
            "subjects",
            "updated_at",
        )

    def get_subjects(self, obj: ContactPage):
        return [
            {"value": value, "label": label}
            for value, label in ContactMessage.Subject.choices
        ]


class ContactMessageCreateSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(source="public_id", read_only=True)

    class Meta:
        model = ContactMessage
        fields = (
            "id",
            "name",
            "email",
            "phone",
            "subject",
            "message",
            "created_at",
        )
        read_only_fields = ("id", "created_at")

    def validate_name(self, value: str) -> str:
        value = value.strip()
        if len(value) < 2:
            raise serializers.ValidationError("نام و نام خانوادگی را کامل وارد کنید.")
        return value

    def validate_email(self, value: str) -> str:
        return value.strip().lower()

    def validate_phone(self, value: str) -> str:
        value = value.strip()
        return normalize_phone_number(value) if value else ""

    def validate_message(self, value: str) -> str:
        value = value.strip()
        if len(value) < 10:
            raise serializers.ValidationError("متن پیام باید حداقل ۱۰ نویسه باشد.")
        return value
