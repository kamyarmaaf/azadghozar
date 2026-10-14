# گزارش ادغام بک‌اند آزادگذر — ۱۳ اکتبر ۲۰۲۶

## انجام‌شده
- نسخهٔ فعال `backend/apps` با قابلیت‌های `service_requests` نسخهٔ تو در تو به‌روزرسانی شد؛ مدل، سریالایزر، ویو، آدرس‌ها و پنل ادمین درخواست بازدید منتقل شد.
- مدل و View پشتیبانی گفت‌وگوی هوش مصنوعی، سرویس پاسخ‌دهی و Migration `content/0007_support_ai_guest_chat.py` منتقل شد.
- نرخ‌های `support_chat` و `visit_request_create` به تنظیمات DRF افزوده شد.
- تست‌های مرتبط با بازدید و چت پشتیبانی به پوشهٔ اصلی تست‌ها منتقل شدند.
- `backend/backend` حذف شد؛ کد اصلی در `backend/apps` و `backend/config` باقی ماند.
- سینتکس فایل‌های Python با compileall کنترل شد.

## موارد ضروری پس از جایگزینی
1. ابتدا از پروژه، دیتابیس و متغیرهای محیطی واقعی بکاپ بگیرید. از این بسته تنها در محیط توسعه استفاده کنید و بعد از تست به سرور ببرید.
2. از پوشهٔ ریشهٔ پروژهٔ Django (`backend/`) اجرا کنید:
   `python manage.py check`
3. وضعیت Migration را بررسی کنید:
   `python manage.py showmigrations service_requests content`
   `python manage.py makemigrations --check --dry-run`
4. سپس `python manage.py migrate` را اجرا کنید.
5. تست‌ها را اجرا کنید:
   `pytest tests/api/test_listing_visit_requests_api.py tests/api/test_support_chat_api.py -q`
6. APIهای `/api/v1/service-requests/visits/` و `/api/v1/content/chat/` و سایر مسیرهای مرتبط را در محیط اجرا بررسی کنید.
7. برای فعال‌سازی پاسخ‌دهی آنلاین AI کلید `AI_SUPPORT_API_KEY` را فقط روی بک‌اند تنظیم کنید؛ بدون کلید، پاسخ جایگزین داخلی برگردانده می‌شود.

## محدودهٔ تأیید
در محیط بسته‌بندی Django نصب نبود؛ بنابراین تست‌های Django و مهاجرت دیتابیس عملاً اجرا نشده‌اند. فقط سینتکس و ساختار ادغام بررسی شده است.
