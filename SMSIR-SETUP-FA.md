# اتصال SMS.ir به آزادگذر

برای OTP ثبت‌نام، ورود و بازیابی رمز، از API نسخه دوم SMS.ir استفاده شده است: `POST https://api.sms.ir/v1/send/verify`.

## تنظیمات
در فایل `.env.dev` یا تنظیمات محیط سرور، مقدارها را قرار دهید:

```dotenv
SMSIR_API_KEY=YOUR_REAL_API_KEY
SMSIR_TEMPLATE_ID=YOUR_APPROVED_NUMERIC_TEMPLATE_ID
SMSIR_CODE_PARAMETER=code
OTP_CONSOLE_MODE=0
```

**نکته:** علاوه بر کلید API، باید در پنل SMS.ir یک قالب تأیید بسازید/تأیید کنید و شناسه عددی آن را بگذارید. نام متغیر قالب باید با `SMSIR_CODE_PARAMETER` یکسان باشد (پیش‌فرض `code`). هیچ کلیدی را در فرانت یا مخزن Git قرار ندهید.

## اجرای Docker

```powershell
cd D:\zeroteam\karvo
docker compose -f compose.yaml -f compose.dev.yaml up -d --build backend celery_worker
docker compose -f compose.yaml -f compose.dev.yaml exec backend python manage.py check
docker compose -f compose.yaml -f compose.dev.yaml exec backend python manage.py test apps.accounts.tests.test_smsir_gateway
docker compose -f compose.yaml -f compose.dev.yaml logs -f backend celery_worker
```

با کلیک روی ارسال OTP از صفحات فعلی فرانت، باید پیامک به شماره مربوطه ارسال شود. با کلید جایگزین‌نشده یا شناسه قالب نامعتبر، ارسال واقعی انجام نمی‌شود. اگر Celery فعال باشد، نتیجه ارسال به‌صورت ناهمزمان دریافت می‌شود؛ برای اثبات تحویل باید گزارش SMS.ir را بررسی کنید. تغییر schema دیتابیس یا migration لازم نیست.
