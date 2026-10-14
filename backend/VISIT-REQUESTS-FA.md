# راه‌اندازی درخواست بازدید حضوری

این نسخه بخش درخواست بازدید حضوری را به‌صورت کامل به API و دیتابیس متصل می‌کند.

## اجرای migration

از ریشه پروژه اجرا کنید:

```powershell
docker compose -f compose.yaml -f compose.dev.yaml up -d --build backend
docker compose -f compose.yaml -f compose.dev.yaml exec backend python manage.py migrate
```

برای اطمینان از نصب migration:

```powershell
docker compose -f compose.yaml -f compose.dev.yaml exec backend python manage.py showmigrations service_requests
```

باید migration شماره `0002_listing_visit_request` با علامت `[X]` نمایش داده شود.

## محل مدیریت درخواست‌ها

- خریدار: پنل خریدار، زبانه «درخواست‌های من»
- فروشنده: پنل فروشنده، زبانه «درخواست‌های بازدید»
- نمایشگاه و نمایندگی: پنل کسب‌وکار، زبانه «درخواست‌های بازدید»
- مدیر سایت: `/admin/service_requests/listingvisitrequest/`

درخواست‌دهنده می‌تواند درخواست باز یا تأییدشده را لغو کند. مالک یا مدیر مجاز آگهی می‌تواند درخواست را تأیید، با ذکر علت رد، لغو یا پس از انجام تکمیل کند.

## APIهای اضافه‌شده

- `GET /api/v1/service-requests/visits/availability/`
- `POST /api/v1/service-requests/visits/`
- `GET /api/v1/service-requests/visits/mine/`
- `POST /api/v1/service-requests/visits/mine/<uuid>/cancel/`
- `GET /api/v1/service-requests/visits/managed/`
- `PATCH /api/v1/service-requests/visits/managed/<uuid>/`

هر بازه زمانی برای یک آگهی فقط یک درخواست باز (`pending` یا `confirmed`) می‌پذیرد؛ بنابراین ثبت هم‌زمان دو رزرو روی یک ساعت در سطح دیتابیس نیز مسدود است.
