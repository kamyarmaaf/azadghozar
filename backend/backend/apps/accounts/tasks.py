import logging

from celery import shared_task
from django.conf import settings


logger = logging.getLogger(__name__)


def send_otp_sms_now(
    *,
    phone_number: str,
    code: str,
    purpose: str,
) -> None:
    """Send an OTP immediately, without requiring Celery or Redis."""

    if settings.OTP_CONSOLE_MODE:
        logger.warning(
            (
                "DEVELOPMENT OTP | "
                "purpose=%s | phone=%s | code=%s"
            ),
            purpose,
            phone_number,
            code,
        )
        return

    # The real SMS provider will be called here later.
    raise RuntimeError(
        "SMS provider is not configured."
    )


@shared_task(
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_kwargs={"max_retries": 3},
)
def send_otp_sms(
    *,
    phone_number: str,
    code: str,
    purpose: str,
) -> None:
    """
    Send OTP through the configured SMS provider.

    In development, the OTP is printed in Celery logs.
    """

    send_otp_sms_now(
        phone_number=phone_number,
        code=code,
        purpose=purpose,
    )
