# نسخه V10 — تکمیل صف‌های پنل مدیر آزادگذر

این بسته روی **V9** اعمال می‌شود و دادهٔ نمونه تولید نمی‌کند. فرانت و بک‌اند این نسخه را با هم به‌روزرسانی کنید. اگر هنوز V8 دارید، ابتدا بستهٔ V9 را اعمال کنید.

| بخش مدیر | اکنون چه چیزی فعال است؟ | محدودیت باقی‌مانده |
|---|---|---|
| کاربران | جست‌وجوی موبایل و فیلتر نقش/وضعیت؛ بارگیری با cursor در صفحه‌های ۲۰تایی | تغییر مستقیم نقش یا وضعیت از این تب فعال نیست |
| آگهی‌های در انتظار | صفحه‌بندی سمت سرور با ۲۰ مورد در هر صفحه؛ شمارش واقعی، مشاهده جزئیات، تأیید/رد و بازیابی خطا | از pagination شماره‌صفحه‌ای بک‌اند استفاده می‌کند؛ در عمق بسیار زیاد هنوز هزینهٔ `COUNT`/`OFFSET` دارد |
| درخواست‌های تغییر نقش | cursor بیست‌تایی بدون شمارش کل؛ صفحه بعد، بررسی/رد و پیام خطا | ویرایش پیشرفتهٔ دلایل و گزارش فعالیت مدیر هنوز وجود ندارد |
| نمایشگاه‌ها و نمایندگی‌ها | صفحات بعدی کسب‌وکارها و درخواست‌های ارتقا از API دریافت می‌شوند؛ دلیل رد/تعلیق اجباری شده | پرداخت آنلاین وجود ندارد |
| درخواست ارتقا | هشدار روشن و تأیید دوباره قبل از تصویب | تصویب درخواست فوراً نقش و اشتراک نمایندگی را فعال می‌کند، **حتی بدون پرداخت آنلاین**؛ فقط پس از بررسی خارج از سامانه آن را انجام دهید |
| خدمات | فیلتر، تخصیص کارشناس و بارگیری مرحله‌ای از قبل به API متصل‌اند | اجرای خودِ خدمات و پرداخت متصل نیست |
| محتوا و تنظیمات | «به‌زودی» و بدون ثبت ساختگی | نیازمند مدل و API مستقل |

دسترسی مدیریتی در API با `is_staff` کنترل می‌شود؛ رابط پنل برای نقش `admin` نمایش داده می‌شود. ساخت کاربر مدیر در محیط توسعه:

```powershell
Set-Location D:\zeroteam\karvo
docker compose -f compose.yaml -f compose.dev.yaml exec backend python manage.py createsuperuser
```

بعد از ورود، پنل اختصاصی فرانت در `http://localhost:3000/#admin-dashboard` و Django Admin در `http://localhost:8000/admin/` قرار دارند. این دو پنل یکسان نیستند؛ برای راه‌اندازی فرانت، در پنجرهٔ جداگانه `cd D:\zeroteam\karvo\frontend` و سپس `npm run dev` را اجرا کنید.

## نصب بستهٔ تغییرات روی V9

ZIP به نام `karvo-v10-admin-patch.zip` را در پوشهٔ مستقل باز کنید. قبل از جایگزینی فایل‌های هم‌نام، تغییرات محلی خود را بررسی و از آن‌ها نسخهٔ پشتیبان بگیرید؛ هیچ‌کدام از فایل‌های محیطی، media و داده‌های Docker در بسته وجود ندارند.

```powershell
Set-Location D:\zeroteam\karvo
Test-Path .\frontend\src\lib\feature-status.ts  # روی V9 باید True باشد
$archive = 'D:\Downloads\karvo-v10-admin-patch.zip'  # مسیر دانلود واقعی
$stage = 'D:\zeroteam\karvo-v10-review'
Expand-Archive -LiteralPath $archive -DestinationPath $stage
Test-Path -LiteralPath "$stage\frontend\src\components\pages\AdminDashboardPage.tsx"
```

پس از بررسی، فایل‌های `frontend` و `backend` داخل پوشهٔ بازشده را با همان ساختار پوشه‌ها روی پروژهٔ V9 ادغام کنید. بستهٔ `karvo-v10-admin-complete.zip` برای بررسی کل کد است؛ آن را روی پروژهٔ جاری استخراج نکنید. **migration جدیدی در V10 نیست.**

سپس در ریشهٔ پروژه:

```powershell
docker compose -f compose.yaml -f compose.dev.yaml up -d --build db redis backend celery_worker
docker compose -f compose.yaml -f compose.dev.yaml exec backend python manage.py migrate
docker compose -f compose.yaml -f compose.dev.yaml exec backend python manage.py check
docker compose -f compose.yaml -f compose.dev.yaml ps
Set-Location .\frontend
npm ci
npm test
npm run lint
npx tsc --noEmit
npm run build
npm run dev
```

برای اجرای آزمون‌های وابسته به PostgreSQL/Redis در سیستم دارای Docker، در پنجرهٔ دیگری از ریشهٔ پروژه اسکریپت کیفیت را اجرا کنید:

```powershell
Set-Location D:\zeroteam\karvo
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run-quality.ps1 -SkipInstall
```

`-SkipInstall` زمانی درست است که `npm ci` را موفق اجرا کرده‌اید. از `docker compose down -v` استفاده نکنید؛ volume دیتابیس را حذف می‌کند.

## نتیجهٔ تست در محیط آماده‌سازی

- ۱۲۰ تست مستقل بک‌اند با SQLite موفق؛ ۹ تست integration/migration وابسته به Docker در این محیط اجرا نشدند. mypy و `manage.py check` نیز بدون خطا بودند.
- ۱۰ تست فرانت‌اند، lint، TypeScript و build production موفق بودند.
