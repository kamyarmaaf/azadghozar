from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

import pytest
from django.core.cache import cache
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.accounts.tasks import send_otp_sms


@dataclass
class OtpOutbox:
    messages: list[dict[str, Any]] = field(default_factory=list)

    def latest(self, purpose: str | None = None) -> dict[str, Any]:
        candidates = self.messages

        if purpose is not None:
            candidates = [
                message
                for message in candidates
                if message["purpose"] == purpose
            ]

        if not candidates:
            raise AssertionError("No OTP message was captured.")

        return candidates[-1]

    def latest_code(self, purpose: str | None = None) -> str:
        return str(self.latest(purpose)["code"])


@pytest.fixture(autouse=True)
def clear_default_cache() -> None:
    cache.clear()
    yield
    cache.clear()


@pytest.fixture
def api_client() -> APIClient:
    return APIClient()


@pytest.fixture
def otp_outbox(monkeypatch: pytest.MonkeyPatch) -> OtpOutbox:
    outbox = OtpOutbox()

    def fake_apply_async(
        *,
        kwargs: dict[str, Any] | None = None,
        **options: Any,
    ) -> None:
        del options
        outbox.messages.append(kwargs or {})

    monkeypatch.setattr(
        send_otp_sms,
        "apply_async",
        fake_apply_async,
    )
    return outbox


@pytest.fixture
def buyer_user(db: None) -> User:
    user = User.objects.create_user(
        username="+989121111111",
        phone_number="+989121111111",
        role=User.Role.BUYER,
        is_phone_verified=True,
    )
    user.set_unusable_password()
    user.save(update_fields=["password"])
    return user


@pytest.fixture
def inactive_user(db: None) -> User:
    return User.objects.create_user(
        username="+989122222222",
        phone_number="+989122222222",
        role=User.Role.BUYER,
        is_phone_verified=True,
        is_active=False,
    )


@pytest.fixture
def staff_user(db: None) -> User:
    user = User.objects.create_user(
        username="catalog-admin",
        phone_number="+989123456789",
        role=User.Role.SELLER,
        is_phone_verified=True,
        is_staff=True,
    )
    user.set_unusable_password()
    user.save(update_fields=["password"])
    return user
