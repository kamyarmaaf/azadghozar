import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("content", "0005_contactpage_contactmessage"), migrations.swappable_dependency(settings.AUTH_USER_MODEL)]
    operations = [
        migrations.CreateModel(
            name="SupportConversation",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("public_id", models.UUIDField(default=uuid.uuid4, editable=False, unique=True)),
                ("status", models.CharField(choices=[("open", "باز"), ("closed", "بسته")], db_index=True, default="open", max_length=12)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="support_conversation", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ("-updated_at", "-id"), "verbose_name": "گفتگوی پشتیبانی", "verbose_name_plural": "گفتگوهای پشتیبانی"},
        ),
        migrations.CreateModel(
            name="SupportMessage",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("sender", models.CharField(choices=[("user", "کاربر"), ("support", "پشتیبانی")], default="support", max_length=12)),
                ("text", models.TextField(max_length=2000)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("conversation", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="messages", to="content.supportconversation")),
            ],
            options={"ordering": ("created_at", "id"), "verbose_name": "پیام پشتیبانی", "verbose_name_plural": "پیام‌های پشتیبانی"},
        ),
        migrations.AddIndex(model_name="supportmessage", index=models.Index(fields=["conversation", "created_at", "id"], name="content_chat_feed_idx")),
    ]
