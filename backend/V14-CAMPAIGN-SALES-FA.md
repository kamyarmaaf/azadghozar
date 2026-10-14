# نسخه V14 — فعال‌سازی فروش فوری و فروش ویژه

این نسخه باید روی نسخه قبلی پروژه به‌صورت یکپارچه اعمال شود؛ فرانت‌اند، بک‌اند و migration جدید به یکدیگر وابسته‌اند. فایل `.env.dev` و volumeهای PostgreSQL/Redis را جایگزین یا حذف نکنید.

## قابلیت‌های فعال‌شده

- گزینه‌های «فروش فوری» و «فروش ویژه» در منوی دسکتاپ و موبایل به صفحات واقعی `#instant-sale` و `#special-sale` متصل‌اند و برچسب «به‌زودی» ندارند.
- هر صفحه فقط آگهی‌های فعال همان کمپین را از API می‌گیرد؛ فیلتر برند، نوع بدنه و بازه قیمت، حالت بارگذاری/خطا/خالی و صفحه‌بندی ۲۴تایی فعال است.
- مدیر در تب «آگهی‌ها» هنگام تأیید، یکی از سه حالت «آگهی عادی»، «فروش فوری» یا «فروش ویژه» را انتخاب می‌کند. انتخاب نامعتبر در API رد می‌شود و یک آگهی هم‌زمان فوری و ویژه نمی‌شود.
- در Django Admin نیز سه عملیات «تأیید عادی»، «انتشار فروش فوری» و «انتشار فروش ویژه» وجود دارد؛ عملیات فوری/ویژه هم‌زمان وضعیت آگهی را `active` و نوع کمپین را تنظیم می‌کند.
- کارت آگهی، جزئیات خودرو، علاقه‌مندی‌ها و صفحه خرید برچسب کمپین را از داده واقعی API نمایش می‌دهند.
- migration شماره `0008_listing_campaign_indexes` برای فیدهای فوری و ویژه دو partial index اختصاصی می‌سازد. روی PostgreSQL ایندکس‌ها با `CONCURRENTLY` ایجاد می‌شوند تا قفل طولانی جدول رخ ندهد.

## اجرای کامل با Docker و Celery

دستورها را از ریشه پروژه اجرا کنید. در PowerShell:

```powershell
Set-Location D:\zeroteam\karvo
if (-not (Test-Path .env.dev)) { Copy-Item .env.dev.example .env.dev }

docker compose -f compose.yaml -f compose.dev.yaml build
docker compose -f compose.yaml -f compose.dev.yaml up -d db redis
docker compose -f compose.yaml -f compose.dev.yaml run --rm backend python manage.py migrate
docker compose -f compose.yaml -f compose.dev.yaml up -d backend celery_worker
docker compose -f compose.yaml -f compose.dev.yaml ps
```

برای بررسی سلامت backend و worker:

```powershell
docker compose -f compose.yaml -f compose.dev.yaml exec backend python manage.py check
docker compose -f compose.yaml -f compose.dev.yaml exec celery_worker celery -A config inspect ping
docker compose -f compose.yaml -f compose.dev.yaml logs --tail=100 backend celery_worker
Invoke-RestMethod http://localhost:8000/api/health/
```

فرانت در compose فعلی سرویس جداگانه ندارد و در محیط توسعه با Node اجرا می‌شود:

```powershell
Set-Location D:\zeroteam\karvo\frontend
if (-not (Test-Path .env.local)) { Copy-Item .env.local.example .env.local }
npm ci
npm test
npm run dev
```

سپس این مسیرها را باز کنید:

- همه خودروها: `http://localhost:3000/#buy`
- فروش فوری: `http://localhost:3000/#instant-sale`
- فروش ویژه: `http://localhost:3000/#special-sale`
- پنل مدیر: پس از ورود با مدیر، تب «آگهی‌ها»

در استقرار یا به‌روزرسانی معمولی از `docker compose down -v` استفاده نکنید؛ این دستور volumeهای دیتابیس و Redis را حذف می‌کند.

## قرارداد تأیید آگهی

مسیر زیر فقط برای مدیر است:

```http
POST /api/v1/catalog/listings/<id>/approve/
Content-Type: application/json

{"campaign":"instant"}
```

مقادیر مجاز `campaign` عبارت‌اند از `regular`، `instant` و `special`. برای سازگاری با کلاینت قدیمی، حذف کامل این فیلد وضعیت کمپین قبلی آگهی را حفظ می‌کند؛ فرانت V14 همیشه مقدار انتخاب‌شده را صریح می‌فرستد.

صفحات عمومی کمپین از فیلتر صریح زیر استفاده می‌کنند:

```http
GET /api/v1/catalog/listings/?campaign=instant&summary=true&page_size=24
GET /api/v1/catalog/listings/?campaign=special&summary=true&page_size=24
```

فقط آگهی‌های `active` برگردانده می‌شوند. اگر رکوردی در دیتابیس فلگ فوری یا ویژه دارد اما وضعیتش `pending`، `sold`، `rejected` یا `expired` است، از Django Admin آن را با عملیات انتشار متناظر فعال کنید.

## نتیجه آزمون‌ها

- ۱۶ تست واحد فرانت‌اند: موفق
- ۱۳۵ تست بک‌اند مستقل از سرویس‌های integration: موفق؛ ۷ تست integration وابسته به PostgreSQL/Redis/Celery در این محیط اجرا نشد
- ESLint، TypeScript، build تولید Next.js، Django check، migration drift، mypy و Bandit: موفق
