# نسخه V12 — مشاهدهٔ همهٔ آگهی‌ها از صفحهٔ اصلی

این وصله برای نصب روی V11 است و باید فایل‌های فرانت و بک‌اند آن **با هم** اعمال شوند. مهاجرت جدید یا تغییر دیتابیس ندارد؛ اطلاعات محیط و volumeهای Docker را دست‌نخورده نگه دارید.

## آنچه وصل شد

- دکمهٔ واضح «مشاهده همه آگهی‌ها» بالای صفحهٔ اصلی به `#buy` می‌رود؛ «مشاهده همه» در بخش تازه‌ترین‌ها و نوع بدنه نیز همین صفحه را باز می‌کند.
- صفحهٔ خرید، آگهی‌های واقعیِ فعال را از API با ۱۲ نتیجه در هر درخواست می‌گیرد، تعداد واقعی، صفحهٔ قبل/بعد، حالت خالی، خطا و تلاش دوباره را نشان می‌دهد. همهٔ آگهی‌ها یکجا به مرورگر منتقل نمی‌شوند.
- عبارت جست‌وجو، چند برند، چند نوع بدنه، شهر، محدودهٔ قیمت/سال/کارکرد و گزینه‌های بودجهٔ صفحهٔ اصلی به فیلترهای سمت سرور وصل شدند؛ ورودی‌های چندمقداری API سقف ۲۰ دارند. در صفحهٔ خرید می‌توان فیلترهای منتقل‌شده را دید، حذف کرد یا تغییر داد.
- بخش «تازه‌ترین خودروهای ثبت‌شده» اکنون فقط شش آگهی معمولی جدید را مستقیماً با فیلتر API دریافت می‌کند؛ اگر فروش فوری/ویژه زیاد باشد، دیگر آگهی‌های معمولی را به اشتباه خالی نشان نمی‌دهد.
- پارامترهای جست‌وجو و فیلترهای صفحهٔ خرید فعلاً در URL ذخیره نمی‌شوند؛ در صورت بارگذاری دوبارهٔ صفحه فیلترها به پیش‌فرض برمی‌گردند. فهرست عمومی هنوز از شمارش کل و صفحه‌بندی شماره‌ای استفاده می‌کند؛ برای جست‌وجو در میلیون‌ها نتیجه، جایگزینی با cursor و حذف شمارش کل مرحلهٔ بهینه‌سازی بعدی است.

## نصب روی نسخه V11، PowerShell

ابتدا `karvo-v12-home-listings-patch.zip` را در یک پوشهٔ **جدا** باز و فایل‌ها را با نسخهٔ پروژهٔ خود مقایسه کنید. اگر تغییر محلی دارید قبل از ادغام از فایل‌های هم‌نام نسخهٔ پشتیبان بگیرید. محتوای پوشه‌های `frontend` و `backend` و فایل `README.md` را با همان مسیر نسبی به پروژه V11 منتقل کنید. بستهٔ کامل فقط برای بررسی/راه‌اندازی تمیز است؛ روی پروژهٔ در حال اجرا استخراج مستقیم نکنید. هیچ `.env.dev` یا فایل دیتابیسی در وصله نیست.

```powershell
Set-Location D:\zeroteam\karvo
Test-Path .\frontend\tests\admin-queues.test.mjs   # نسخه V11: True
$archive = 'D:\Downloads\karvo-v12-home-listings-patch.zip' # مسیر واقعی فایل
$stage = 'D:\zeroteam\karvo-v12-review'
Expand-Archive -LiteralPath $archive -DestinationPath $stage
Test-Path -LiteralPath "$stage\frontend\src\lib\home-listing-filters.mjs"
```

### راه‌اندازی بک‌اند و Celery

```powershell
Set-Location D:\zeroteam\karvo
if (-not (Test-Path .env.dev)) { Copy-Item .env.dev.example .env.dev }
docker compose -f compose.yaml -f compose.dev.yaml up -d --build db redis backend celery_worker
docker compose -f compose.yaml -f compose.dev.yaml exec backend python manage.py migrate
docker compose -f compose.yaml -f compose.dev.yaml ps
```

در یک پنجرهٔ PowerShell دیگر، فرانت را اجرا کنید:

```powershell
Set-Location D:\zeroteam\karvo\frontend
npm ci
npm test
npm run lint
npx tsc --noEmit
npm run build
npm run dev
```

برای مشاهدهٔ صفحهٔ آگهی‌ها: `http://localhost:3000/#buy`. برای خطاهای API، `docker compose -f compose.yaml -f compose.dev.yaml logs --tail=100 backend celery_worker`؛ از `down -v` استفاده نکنید.

## آزمون‌ها

- تست فیلتر چندبرندی/چندبدنه‌ای/شهر، محدودیت ۲۰ مقدار، حذف آگهی در انتظار، صفحهٔ دوم و آگهی‌های عادی اجرا شد.
- ۱۲ تست واحد فرانت؛ ۱۲۳ تست مستقل بک‌اند (۹ تست integration/migration نیازمند Docker و در این محیط اجرا نشدند)؛ mypy، Django check، TypeScript، lint و build موفق بودند. پس از آخرین تست تکمیلی آمار نهایی آزمون‌ها را در پاسخ اعلام می‌کنیم.
