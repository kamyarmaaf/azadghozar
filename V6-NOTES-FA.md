# نسخه V6 — نمایشگاه، نمایندگی و تیم کسب‌وکار

این نسخه صفحات عمومی و پنل‌های نمایشگاه/نمایندگی را از داده آزمایشی جدا و به API واقعی متصل می‌کند.

## قابلیت‌های اصلی

- پروفایل مستقل کسب‌وکار با نوع `gallery` یا `agency`
- وضعیت احراز: در انتظار، تأییدشده، ردشده و معلق
- صفحه عمومی فقط برای کسب‌وکار تأییدشده
- فهرست عمومی با Cursor Pagination، جست‌وجوی نام/شهر و فیلتر نوع
- آگهی‌های واقعی هر کسب‌وکار با Cursor Pagination
- اتصال هر آگهی به کسب‌وکار، بدون وابستگی صرف به نقش ثبت‌کننده
- افزودن کارمند موجود با دسترسی جداگانه مدیریت آگهی و اعضا
- درخواست اشتراک ماهانه/سالانه برای ارتقا از نمایشگاه به نمایندگی
- بررسی احراز و اشتراک در پنل مدیر
- آمار واقعی تعداد آگهی، وضعیت‌ها و بازدیدها در داشبورد
- بازگشت خودکار پروفایل تأییدشده به صف بررسی پس از تغییر اطلاعات حساس

## ملاحظات سرعت و مقیاس

- فهرست کسب‌وکار، آگهی‌های کسب‌وکار و اعضا Cursor-based هستند؛ هزینه رفتن به صفحات بعد با بزرگ‌شدن جدول افزایش خطی ندارد.
- شمارش آگهی و مجموع بازدید در فهرست عمومی با subquery تجمیعی انجام می‌شود و N+1 query ندارد.
- فهرست عمومی با حداکثر ۲ query برای ۱۲ کسب‌وکار تست شده است.
- جست‌وجوی نام کسب‌وکار از GIN + `pg_trgm` استفاده می‌کند.
- index ترکیبی `(business_id, status, created_at DESC, id DESC)` برای feed آگهی‌های هر کسب‌وکار اضافه شده است.
- backfill آگهی‌های قدیمی در PostgreSQL در batchهای ۲۰هزارتایی اجرا می‌شود تا تراکنش و lock بلندمدت ایجاد نشود.
- index جدول بزرگ آگهی‌ها با `CREATE INDEX CONCURRENTLY` ساخته می‌شود.
- تصاویر فهرست آگهی با subquery فقط تصویر اول را می‌گیرند و همه تصاویر preload نمی‌شوند.

## راه‌اندازی توسعه با Docker در PowerShell

بسته‌های تحویلی عمداً فایل‌های واقعی `.env` و `.env.dev` را ندارند. هنگام جایگزینی پروژه، فایل‌های محیطی فعلی خودتان را نگه دارید؛ فقط اگر پروژه را در پوشه‌ای تازه باز می‌کنید، آن‌ها را از پروژه فعلی کپی کنید.

از ریشه پروژه اجرا کنید:

```powershell
cd D:\zeroteam\karvo

docker compose -f compose.yaml -f compose.dev.yaml build backend celery_worker
docker compose -f compose.yaml -f compose.dev.yaml up -d db redis
docker compose -f compose.yaml -f compose.dev.yaml run --rm backend python manage.py migrate
docker compose -f compose.yaml -f compose.dev.yaml up -d backend celery_worker
docker compose -f compose.yaml -f compose.dev.yaml ps
```

بررسی سلامت و لاگ:

```powershell
Invoke-RestMethod http://localhost:8000/api/health/
docker compose -f compose.yaml -f compose.dev.yaml logs -f backend
```

Migration شماره `0006` افزونه `pg_trgm` را می‌سازد. اگر PostgreSQL شما اجازه ساخت extension خودکار نداد، با کاربر واقعی فایل `.env.dev` اجرا کنید:

```powershell
docker compose -f compose.yaml -f compose.dev.yaml exec db psql -U karvo_user -d karvo_db -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"
```

در فایل فعلی شما مقادیر درست این‌ها هستند:

```text
POSTGRES_USER=karvo_user
POSTGRES_DB=karvo_db
```

## پشتیبان‌گیری قبل از migration روی دیتای واقعی

برای جلوگیری از مشکل redirect باینری در Windows PowerShell، dump ابتدا داخل کانتینر ساخته و سپس کپی می‌شود:

```powershell
docker compose -f compose.yaml -f compose.dev.yaml exec db pg_dump -U karvo_user -d karvo_db -Fc -f /tmp/karvo_before_v6.dump
docker compose -f compose.yaml -f compose.dev.yaml cp db:/tmp/karvo_before_v6.dump .\karvo_before_v6.dump
```

## اجرای تست‌ها

تست سریع روزمره:

```powershell
.\run-tests.ps1 fast
```

تمام تست‌های بک‌اند با PostgreSQL و Redis واقعی، coverage، Bandit و بررسی آسیب‌پذیری dependencyها:

```powershell
.\run-tests.ps1 all
```

کنترل کامل بک‌اند و فرانت‌اند شامل unit test، ESLint، TypeScript و production build:

```powershell
.\run-quality.ps1
```

پس از اولین `npm ci` می‌توانید نصب دوباره را رد کنید:

```powershell
.\run-quality.ps1 -SkipInstall
```

تست بار فهرست‌های آگهی و کسب‌وکار:

```powershell
.\run-tests.ps1 load
.\run-tests.ps1 stress
.\run-tests.ps1 spike
```

## APIهای جدید

| مسیر | کاربرد |
|---|---|
| `GET /api/v1/businesses/` | فهرست عمومی cursor-based |
| `GET /api/v1/businesses/{slug}/` | پروفایل عمومی |
| `GET /api/v1/businesses/{slug}/listings/` | آگهی‌های فعال کسب‌وکار |
| `GET/PATCH /api/v1/businesses/me/profile/` | پروفایل مالک |
| `GET /api/v1/businesses/me/dashboard/` | آمار واقعی داشبورد |
| `GET /api/v1/businesses/me/listings/` | آگهی‌های قابل مدیریت |
| `GET/POST /api/v1/businesses/me/members/` | اعضای تیم |
| `PATCH/DELETE /api/v1/businesses/me/members/{id}/` | مدیریت عضو |
| `GET/POST /api/v1/businesses/me/subscriptions/` | اشتراک نمایندگی |
| `GET /api/v1/businesses/admin/profiles/` | صف کسب‌وکار مدیر |
| `POST /api/v1/businesses/admin/profiles/{id}/review/` | احراز/رد/تعلیق |
| `GET /api/v1/businesses/admin/subscriptions/` | صف اشتراک مدیر |
| `POST /api/v1/businesses/admin/subscriptions/{id}/review/` | تأیید/رد اشتراک |

## نتیجه کنترل محلی

- Django system check: موفق
- Migration drift check: موفق
- mypy: موفق، ۴۰ فایل
- pytest بدون سرویس خارجی: ۱۰۶ تست موفق
- تست API کسب‌وکار: ۸ تست موفق
- Coverage بدون integration: بالاتر از حداقل ۸۰٪
- Bandit: موفق
- pip-audit: بدون آسیب‌پذیری شناخته‌شده
- Frontend unit tests: ۴ تست موفق
- TypeScript strict: موفق
- ESLint: موفق
- Next.js production build: موفق

تست‌های integration مربوط به PostgreSQL، Redis و Celery باید با `run-tests.ps1 all` داخل Docker اجرا شوند.
