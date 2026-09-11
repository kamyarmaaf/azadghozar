import os

from .settings import *  # noqa: F403


if os.getenv("TEST_USE_SQLITE", "0") == "1":
    DATABASES = {  # noqa: F405
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": str(BASE_DIR / "test.sqlite3"),  # noqa: F405
        }
    }


# Unit/API tests should be deterministic and must not depend on shared Redis state.
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "karvo-test-cache",
    }
}

# Celery tasks run synchronously only when a test explicitly calls apply().
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

OTP_CONSOLE_MODE = True

# Keep the production password hasher behavior instead of using weak test-only hashes.
