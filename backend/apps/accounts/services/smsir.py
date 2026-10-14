"""SMS.ir V2 verification-template gateway. Never log codes or API keys."""
import json
import logging
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from django.conf import settings

logger = logging.getLogger(__name__)


class SmsIrError(RuntimeError):
    """SMS provider failed or rejected a verification message."""


def send_verification_sms(*, phone_number: str, code: str) -> None:
    api_key = getattr(settings, "SMSIR_API_KEY", "").strip()
    template_id = getattr(settings, "SMSIR_TEMPLATE_ID", "")
    parameter = getattr(settings, "SMSIR_CODE_PARAMETER", "code").strip()
    if not api_key or not str(template_id).isdigit() or not parameter:
        raise SmsIrError("SMS.ir API key, numeric template ID, or code parameter is missing")

    # Normalize E.164 (+989...) to domestic 09... accepted by SMS.ir.
    mobile = phone_number.strip()
    if mobile.startswith("+98"):
        mobile = "0" + mobile[3:]
    elif mobile.startswith("98"):
        mobile = "0" + mobile[2:]
    if len(mobile) != 11 or not mobile.startswith("09") or not mobile.isdigit():
        raise SmsIrError("Invalid Iranian mobile number")

    body = json.dumps({
        "mobile": mobile,
        "templateId": int(template_id),
        "parameters": [{"name": parameter, "value": str(code)}],
    }).encode("utf-8")
    request = Request(
        "https://api.sms.ir/v1/send/verify",
        data=body,
        headers={
            "x-api-key": api_key,
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        method="POST",
    )
    try:
        with urlopen(request, timeout=10) as response:
            response_body = response.read(65536)
            result = json.loads(response_body)
    except (HTTPError, URLError, TimeoutError, ValueError, OSError) as exc:
        logger.warning("SMS.ir verification request failed (%s)", type(exc).__name__)
        raise SmsIrError("SMS.ir verification service unavailable") from exc
    if not isinstance(result, dict) or result.get("status") != 1:
        logger.warning("SMS.ir rejected verification: status=%s", result.get("status") if isinstance(result, dict) else "invalid-response")
        raise SmsIrError("SMS.ir rejected verification request")
