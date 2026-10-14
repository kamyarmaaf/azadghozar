import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("content", "0006_support_chat")]

    operations = [
        migrations.AlterField(
            model_name="supportconversation",
            name="user",
            field=models.OneToOneField(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="support_conversation",
                to="accounts.user",
            ),
        ),
        migrations.AddField(
            model_name="supportconversation",
            name="guest_id",
            field=models.UUIDField(blank=True, editable=False, null=True, unique=True),
        ),
        migrations.AlterField(
            model_name="supportmessage",
            name="sender",
            field=models.CharField(
                choices=[
                    ("user", "کاربر"),
                    ("ai", "دستیار هوش مصنوعی"),
                    ("support", "پشتیبانی"),
                ],
                default="support",
                max_length=12,
            ),
        ),
        migrations.AddConstraint(
            model_name="supportconversation",
            constraint=models.CheckConstraint(
                condition=(
                    models.Q(guest_id__isnull=True, user__isnull=False)
                    | models.Q(guest_id__isnull=False, user__isnull=True)
                ),
                name="content_support_identity_ck",
            ),
        ),
    ]
