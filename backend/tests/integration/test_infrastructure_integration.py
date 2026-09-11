import os
from uuid import uuid4

import pytest
import redis
from celery import Celery
from django.conf import settings
from django.db import connection

from apps.accounts.models import User
from apps.accounts.tasks import send_otp_sms
from config.celery import app as celery_app


@pytest.mark.integration
@pytest.mark.django_db
def test_postgresql_round_trip() -> None:
    user = User.objects.create_user(
        username="+989123333333",
        phone_number="+989123333333",
        role=User.Role.SELLER,
    )

    loaded = User.objects.get(pk=user.pk)

    assert loaded.phone_number == "+989123333333"
    assert connection.vendor == "postgresql"


@pytest.mark.integration
def test_real_redis_round_trip_and_expiry() -> None:
    redis_url = os.getenv(
        "REDIS_CACHE_URL",
        "redis://redis:6379/2",
    )
    client = redis.Redis.from_url(
        redis_url,
        decode_responses=True,
    )
    key = f"karvo:test:{uuid4()}"

    client.setex(key, 10, "works")

    assert client.get(key) == "works"
    ttl = client.ttl(key)
    assert 0 < ttl <= 10

    client.delete(key)


@pytest.mark.integration
def test_celery_broker_connection() -> None:
    app: Celery = celery_app

    with app.connection_for_write() as broker_connection:
        broker_connection.ensure_connection(max_retries=1)

    assert app.conf.broker_url == settings.CELERY_BROKER_URL


@pytest.mark.integration
def test_otp_task_runs_in_console_mode(settings) -> None:
    settings.OTP_CONSOLE_MODE = True

    result = send_otp_sms.apply(
        kwargs={
            "phone_number": "+989121234567",
            "code": "123456",
            "purpose": "signup",
        },
        throw=True,
    )

    assert result.successful()
