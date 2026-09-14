# نسخه V11 — صف تأیید آگهی برای حجم بالا

این بسته روی V10 نصب می‌شود. اگر نسخهٔ قدیمی‌تری دارید، بسته‌های V9 و V10 را به‌ترتیب اعمال کنید. فرانت و بک‌اند V11 باید با هم به‌روزرسانی شوند. تغییر migration یا دادهٔ PostgreSQL در این نسخه نداریم.

## تغییرات واقعی

- مسیر مدیر `GET /api/v1/catalog/listings/pending-queue/` فقط برای کاربر دارای `is_staff` باز است. هر صفحه پیش‌فرض ۲۰ و حداکثر ۵۰ آگهی در انتظار دارد و `next`/`previous` را با cursor بازمی‌گرداند؛ شمارش کل (`COUNT`) و صفحات عمیق مبتنی بر `OFFSET` انجام نمی‌شود.
- پاسخ صف فقط شناسه، نام مالک، خلاصه آگهی، قیمت، تاریخ ثبت و کاور را دارد؛ تصویرهای متعدد، متن کامل و اطلاعات تماس تنها در جزئیات آگهی دریافت می‌شوند. از ایندکس موجود وضعیت/زمان ایجاد استفاده می‌شود؛ migration جدید لازم نیست.
- در پنل مدیر، دکمه‌های صفحهٔ قبل/بعد/اول به این مسیر وصل‌اند. عدد کنار صف **تعداد همین صفحه** است، نه تعداد کل آگهی‌ها. پس از بررسی یک آگهی، صف دوباره از سرور به‌روز می‌شود؛ در صورت خالی‌شدن صفحه، به صفحهٔ مجاور می‌رود.
- بازکردن آگهی توسط مدیر یا مالک، و بازکردن آگهیِ منتشرنشده، شمارندهٔ بازدید عمومی را افزایش نمی‌دهد. بازدید عمومی آگهی فعال همچنان ثبت می‌شود.
- مسیرهای عمومی فهرست، خرید، مقایسه، ورود و OTP تغییر نکرده‌اند. مدیریت محتوا/تنظیمات همچنان «به‌زودی» است. پرداخت اشتراک نمایندگی همچنان متصل نیست؛ هشدار پنل مدیر نسخه V10 پابرجاست.

## نصب امن در Windows / PowerShell

فایل `karvo-v11-admin-cursor-patch.zip` را ابتدا در پوشه‌ای جدا باز کنید؛ پس از مقایسه و پشتیبان‌گیری از تغییرات محلی، فایل‌های `backend` و `frontend` داخل آن را با ساختار مشابه در پروژه V10 ادغام کنید. `.env.dev`، داده‌ها و volumeهای Docker را بازنویسی یا حذف نکنید. بستهٔ کامل برای بررسی پروژه است؛ آن را مستقیم روی پروژهٔ فعال باز نکنید.

```powershell
Set-Location D:\zeroteam\karvo
Test-Path .\frontend\tests\admin-queues.test.mjs  # روی V10 باید True باشد
$archive = 'D:\Downloads\karvo-v11-admin-cursor-patch.zip'  # مسیر واقعی دانلود
$stage = 'D:\zeroteam\karvo-v11-review'
Expand-Archive -LiteralPath $archive -DestinationPath $stage
Test-Path -LiteralPath "$stage\backend\apps\catalog\pagination.py"
```

پس از اعمال فایل‌ها، سرویس‌های بک‌اند را با دستورات انتهای پاسخ یا همان دستورات بخش «راه‌اندازی با Docker» در پایان این فایل روشن کنید. در پنجرهٔ جداگانهٔ فرانت:

```powershell
Set-Location D:\zeroteam\karvo\frontend
npm ci
npm test
npm run lint
npx tsc --noEmit
npm run build
npm run dev
```

پنل اختصاصی مدیر: `http://localhost:3000/#admin-dashboard`؛ مدیر Django: `http://localhost:8000/admin/`.

## تست‌ها

- آزمون API: محدودیت دسترسی مدیر، صفحه‌های cursor بدون تکرار/شمارش، سقف صفحه و خروجی کاور؛ آزمون جلوگیری از افزایش بازدید داخلی.
- ۱۲۲ تست مستقل بک‌اند با SQLite و ۱۰ تست واحد فرانت موفق؛ mypy، `manage.py check`، lint، TypeScript و build نیز بدون خطا. ۹ آزمون integration/migration وابسته به Docker در این محیط اجرا نشدند؛ آن‌ها را روی سیستم خودتان اجرا کنید.

## راه‌اندازی با Docker — در ریشهٔ پروژه

```powershell
Set-Location D:\zeroteam\karvo
if (-not (Test-Path .env.dev)) { Copy-Item .env.dev.example .env.dev }
docker compose -f compose.yaml -f compose.dev.yaml up -d db redis
docker compose -f compose.yaml -f compose.dev.yaml build backend celery_worker
docker compose -f compose.yaml -f compose.dev.yaml run --rm backend python manage.py migrate
docker compose -f compose.yaml -f compose.dev.yaml up -d backend celery_worker
docker compose -f compose.yaml -f compose.dev.yaml ps
docker compose -f compose.yaml -f compose.dev.yaml exec backend python manage.py check
Invoke-RestMethod http://localhost:8000/api/health/
```

برای مشاهدهٔ لاگ‌ها: `docker compose -f compose.yaml -f compose.dev.yaml logs --tail=100 backend celery_worker`. از `down -v` استفاده نکنید؛ volume دیتابیس را حذف می‌کند.
