import json
from unittest.mock import patch
from urllib.error import URLError

from django.test import SimpleTestCase, override_settings

from apps.accounts.services.smsir import SmsIrError, send_verification_sms


class FakeResponse:
    def __init__(self, data):
        self.data = data

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False

    def read(self, count):
        return json.dumps(self.data).encode()


@override_settings(SMSIR_API_KEY="test-key", SMSIR_TEMPLATE_ID="123", SMSIR_CODE_PARAMETER="code")
class SmsIrGatewayTests(SimpleTestCase):
    @patch("apps.accounts.services.smsir.urlopen")
    def test_success_and_e164_conversion(self, mocked):
        mocked.return_value = FakeResponse({"status": 1, "data": {"messageId": 123}})
        send_verification_sms(phone_number="+989121234567", code="012345")
        request = mocked.call_args.args[0]
        self.assertEqual(request.full_url, "https://api.sms.ir/v1/send/verify")
        self.assertEqual(request.get_header("X-api-key"), "test-key")
        self.assertEqual(json.loads(request.data), {
            "mobile": "09121234567", "templateId": 123,
            "parameters": [{"name": "code", "value": "012345"}],
        })

    @patch("apps.accounts.services.smsir.urlopen", return_value=FakeResponse({"status": 0}))
    def test_provider_rejection(self, mocked):
        with self.assertRaises(SmsIrError):
            send_verification_sms(phone_number="09121234567", code="123456")

    @patch("apps.accounts.services.smsir.urlopen", side_effect=URLError("network"))
    def test_network_error(self, mocked):
        with self.assertRaises(SmsIrError):
            send_verification_sms(phone_number="09121234567", code="123456")

    @override_settings(SMSIR_API_KEY="")
    def test_missing_key(self):
        with self.assertRaises(SmsIrError):
            send_verification_sms(phone_number="09121234567", code="123456")
