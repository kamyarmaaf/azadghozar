# نسخه V8 — فهرست واقعی کاربران مدیریت

این نسخه روی V7 ساخته شده است. تب کاربران دیگر نمونهٔ ساختگی نیست: اطلاعات از API فقط‌خواندنی مخصوص کاربران `is_staff=True` دریافت می‌شود. کارت‌های آمار و فعالیت ساختگی و فرم تنظیماتی که هیچ‌چیز ذخیره نمی‌کرد نیز حذف شده‌اند.

## رفتار و مقیاس

- `GET /api/v1/auth/admin/users/`: ۲۰ کاربر در صفحه، سقف ۵۰، ترتیب شناسه نزولی و صفحه‌بندی cursor. در هر صفحه `COUNT(*)` وجود ندارد؛ تست اختصاصی حداکثر یک query را کنترل می‌کند.
- `GET /api/v1/auth/admin/users/{id}/`: اطلاعات محدود یک کاربر؛ هر دو مسیر فقط برای کاربر احرازشدهٔ staff بازند. عملیات ویرایش/ساخت از این مسیرها مجاز نیست.
- فیلتر `role` و `active=true|false` با ایندکس موجود `(role,is_active,id)` و جست‌وجوی **شماره موبایل کامل** بعد از نرمال‌سازی رقم‌های فارسی و فرمت ایران با ایندکس یکتای موبایل انجام می‌شود. جست‌وجوی substring یا پیمایش تمام کاربران در این بخش انجام نمی‌شود.
- خروجی فقط فیلدهای لازم برای نمایش است؛ گذرواژه، کد دعوت و اطلاعات حساس دیگر ارسال نمی‌شود. بارگذاری بعدی فقط با دکمهٔ «نمایش کاربران بعدی» است.
- تغییر فیلتر، درخواست‌های قبلی را لغو می‌کند؛ ورودی موبایل با تأخیر ۳۰۰ میلی‌ثانیه‌ای بارگذاری می‌شود.
- هیچ migration جدیدی برای V8 وجود ندارد؛ اجرای `migrate` جهت اطمینان از به‌روز بودن migrationهای قبلی توصیه می‌شود.

## نصب مطمئن از PowerShell

اول `karvo-v8-patch.zip` را دانلود کنید و مسیر واقعی آن را جایگزین مقدار مثال زیر کنید. این بسته فقط شامل فایل‌های تغییریافته است و **تنها روی V7** قابل اعمال است. ابتدا داخل ریشهٔ پروژهٔ فعلی بررسی کنید:

```powershell
Set-Location D:\zeroteam\karvo
Test-Path .\backend\apps\service_requests
Test-Path .\run-quality.ps1
```

اگر هر دو `True` هستند، V7 حاضر است. قبل از جایگزین‌کردن فایل‌های موجود، تغییرات محلی را ذخیره/پشتیبان بگیرید. سپس بستهٔ patch را ابتدا در یک پوشهٔ جدا باز کنید؛ `Expand-Archive -Force` را مستقیماً روی پروژهٔ در حال کار اجرا نکنید:

```powershell
$archive = 'D:\Downloads\karvo-v8-patch.zip'  # مسیر دانلود واقعی را وارد کنید
Test-Path -LiteralPath $archive
$stage = 'D:\zeroteam\karvo-v8-stage'
Expand-Archive -LiteralPath $archive -DestinationPath $stage
Test-Path -LiteralPath "$stage\backend\apps\accounts\admin_users.py"
Copy-Item .\backend\apps\accounts\urls.py .\backend\apps\accounts\urls.py.v7-backup
Copy-Item .\frontend\src\components\pages\AdminDashboardPage.tsx .\frontend\src\components\pages\AdminDashboardPage.tsx.v7-backup
Copy-Item -LiteralPath "$stage\backend\apps\accounts\admin_users.py" -Destination .\backend\apps\accounts\admin_users.py -Force
Copy-Item -LiteralPath "$stage\backend\tests\api\test_admin_users_api.py" -Destination .\backend\tests\api\test_admin_users_api.py -Force
Copy-Item -LiteralPath "$stage\frontend\src\lib\admin-users-api.ts" -Destination .\frontend\src\lib\admin-users-api.ts -Force
Copy-Item -LiteralPath "$stage\frontend\src\components\dashboard\AdminUsersPanel.tsx" -Destination .\frontend\src\components\dashboard\AdminUsersPanel.tsx -Force
Copy-Item -LiteralPath "$stage\frontend\src\components\pages\AdminDashboardPage.tsx" -Destination .\frontend\src\components\pages\AdminDashboardPage.tsx -Force
Copy-Item -LiteralPath "$stage\backend\apps\accounts\urls.py" -Destination .\backend\apps\accounts\urls.py -Force
```

اگر `run-quality.ps1` وجود ندارد، روی نسخهٔ قبلی بودن پروژه فرض نکنید. `karvo-v8-complete.zip` را در پوشهٔ **جدید** باز کنید و بررسی کنید ریشهٔ ZIP دقیقاً شامل `run-quality.ps1`، `compose.yaml`، `backend` و `frontend` است. سپس پروژهٔ قبلی، `.env`، `.env.dev`، `.env.local`، داده‌های دیتابیس و فایل‌های رسانه‌ای خود را حفظ کنید و تغییرات شخصی را قبل از جایگزینی فایل‌ها ادغام کنید. دستور `docker compose down -v` را اجرا نکنید؛ volume دیتابیس را پاک می‌کند.

```powershell
$complete = 'D:\Downloads\karvo-v8-complete.zip'  # مسیر واقعی دانلود
Test-Path -LiteralPath $complete
Expand-Archive -LiteralPath $complete -DestinationPath 'D:\zeroteam\karvo-v8-review'
Test-Path 'D:\zeroteam\karvo-v8-review\run-quality.ps1'
```

پس از ادغام فایل‌ها در همان مسیر پروژه و اطمینان از حضور تنظیمات خودتان:

```powershell
Set-Location D:\zeroteam\karvo
docker compose -f compose.yaml -f compose.dev.yaml up -d db redis
docker compose -f compose.yaml -f compose.dev.yaml build backend celery_worker
docker compose -f compose.yaml -f compose.dev.yaml run --rm backend python manage.py migrate
docker compose -f compose.yaml -f compose.dev.yaml up -d backend celery_worker
docker compose -f compose.yaml -f compose.dev.yaml ps
Invoke-RestMethod http://localhost:8000/api/health/
```

برای اجرای کنترل کامل روی سیستم خودتان (از ریشهٔ پروژه و **بعد از** `Test-Path .\run-quality.ps1`):

```powershell
Test-Path .\run-quality.ps1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run-quality.ps1
```

اگر `npm ci` قبلاً با همین `package-lock.json` انجام شده، در فرمان آخر `-SkipInstall` اضافه کنید. `-ExecutionPolicy Bypass` فقط برای همان فرایند PowerShell است؛ تنها برای اسکریپتی که محتوایش را بررسی کرده‌اید استفاده کنید. برای اجرای جداگانهٔ کل تست‌های بک‌اند روی PostgreSQL/Redis/Celery:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run-tests.ps1 all
```

## کنترل‌های انجام‌شده در محیط آماده‌سازی

- ۵ تست اختصاصی API جدید: موفق (شامل محدودیت دسترسی، حذف فیلد حساس، سقف صفحه و یک query برای هر صفحه).
- ۱۱۹ تست بک‌اند بدون integration/migration: موفق؛ ۹ تست نیازمند سرویس‌های واقعی جدا گذاشته شدند.
- `mypy apps config`: موفق؛ `makemigrations --check --dry-run`: بدون تغییر؛ `bandit`: بدون خطا.
- فرانت‌اند: ۴ تست واحد، ESLint، `tsc --noEmit` و ساخت production Next.js: موفق.
- Docker در این محیط موجود نیست؛ اجرای `run-quality.ps1` و تست‌های متکی به PostgreSQL/Redis/Celery را باید روی سیستم شما انجام داد.
