# نسخه V7 — درخواست خدمات و پنل کارشناس

این نسخه فرم‌های خدمات را از حالت نمایشی خارج می‌کند و درخواست واقعی، صف مدیریت و پنل کارشناس را به پروژه اضافه می‌کند.

## قابلیت‌های جدید

- ثبت واقعی ۸ نوع خدمت: بازرسی، انتقال مالکیت، حمل‌ونقل، مشاوره، استعلام مدارک، استعلام وضعیت، همراهی خرید و همراهی فروش
- امکان ثبت درخواست توسط مهمان یا کاربر واردشده
- شماره پیگیری UUID غیرقابل حدس برای جلوگیری از شمارش درخواست‌ها
- اتصال خودکار درخواست به حساب کاربر واردشده
- نمایش درخواست‌های بازرسی واقعی در پنل فروشنده
- صف مدیریت خدمات با فیلتر نوع، وضعیت، جست‌وجو و بارگذاری مرحله‌ای
- تخصیص درخواست به کارشناس فعال
- پنل مستقل کارشناس با عملیات «شروع» و «ثبت گزارش و تکمیل»
- کنترل گردش وضعیت و جلوگیری از انتقال نامعتبر یا ارجاع بدون کارشناس
- ثبت تاریخچه تغییرات درخواست برای ممیزی
- محدودیت نرخ ثبت عمومی برای کاهش spam

## ملاحظات سرعت و مقیاس

- تمام فهرست‌های درخواست‌ها از Cursor Pagination استفاده می‌کنند و `COUNT(*)` سنگین ندارند.
- صفحه ۲۰تایی مدیریت با تعداد ثابت ۱ query تست شده است.
- ارتباط‌های درخواست‌دهنده، آگهی و کارشناس با `select_related` دریافت می‌شوند و N+1 ندارند.
- ایندکس‌های جدا برای صف وضعیت، نوع خدمت، درخواست‌های هر کاربر و مأموریت‌های هر کارشناس اضافه شده‌اند.
- جست‌وجوی نام با GIN + `pg_trgm` و جست‌وجوی موبایل نرمال‌شده و دقیق انجام می‌شود.
- برای پیدا کردن کارشناسان بین تعداد زیاد کاربران، ایندکس `(role, is_active, id)` اضافه شده است.
- سقف هر صفحه ۵۰ رکورد است و کل جدول یکجا وارد حافظه نمی‌شود.

## APIهای جدید

| مسیر | دسترسی | کاربرد |
|---|---|---|
| `POST /api/v1/service-requests/` | عمومی با rate limit | ثبت درخواست واقعی |
| `GET /api/v1/service-requests/mine/` | کاربر | درخواست‌های خود کاربر |
| `GET /api/v1/service-requests/admin/` | مدیر | صف cursor-based مدیریت |
| `PATCH /api/v1/service-requests/admin/{uuid}/` | مدیر | تغییر وضعیت، اولویت و تخصیص |
| `GET /api/v1/service-requests/admin/experts/` | مدیر | فهرست cursor-based کارشناسان |
| `GET /api/v1/service-requests/expert/` | کارشناس | مأموریت‌های تخصیص‌یافته |
| `PATCH /api/v1/service-requests/expert/{uuid}/` | کارشناس | شروع یا تکمیل خدمت |

## نصب روی نسخه فعلی در PowerShell

فایل‌های `.env` و `.env.dev` واقعی داخل بسته نیستند و تنظیمات فعلی خودتان باید حفظ شوند.

```powershell
cd D:\zeroteam\karvo

docker compose -f compose.yaml -f compose.dev.yaml up -d db redis
docker compose -f compose.yaml -f compose.dev.yaml stop backend celery_worker
docker compose -f compose.yaml -f compose.dev.yaml build backend celery_worker
docker compose -f compose.yaml -f compose.dev.yaml run --rm backend python manage.py migrate
docker compose -f compose.yaml -f compose.dev.yaml up -d backend celery_worker
docker compose -f compose.yaml -f compose.dev.yaml ps
```

بررسی سلامت:

```powershell
Invoke-RestMethod http://localhost:8000/api/health/
docker compose -f compose.yaml -f compose.dev.yaml logs --tail=100 backend
```

## ایجاد حساب کارشناس

کاربر ابتدا باید حساب داشته باشد. سپس از Django Admin نقش او را روی «کارشناس خودرو» قرار دهید. روش خط فرمان با شماره E.164:

```powershell
docker compose -f compose.yaml -f compose.dev.yaml exec backend python manage.py shell -c "from apps.accounts.models import User; u=User.objects.get(phone_number='+989121234567'); u.role=User.Role.EXPERT; u.is_active=True; u.save(update_fields=['role','is_active'])"
```

پس از ورود مجدد، کاربر مستقیم به پنل کارشناس هدایت می‌شود.

## اجرای کنترل کامل

اگر `npm ci` قبلاً موفق شده است:

```powershell
cd D:\zeroteam\karvo
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
.\run-quality.ps1 -SkipInstall
```

در غیر این صورت:

```powershell
.\run-quality.ps1
```

تست بار:

```powershell
.\run-tests.ps1 load
.\run-tests.ps1 stress
```

از `docker compose down -v` استفاده نکنید؛ این گزینه volume دیتابیس را حذف می‌کند.

## نتیجه کنترل این نسخه

- Django system check: موفق
- Migration drift check: موفق
- Mypy: موفق، ۵۰ فایل
- تست اختصاصی Service Request: ۱۰ تست موفق
- کل تست‌های بدون سرویس خارجی: ۱۱۶ تست موفق و ۷ integration کنار گذاشته‌شده
- Coverage: `84.77%`
- Bandit: بدون مشکل
- Frontend unit tests: ۴ تست موفق
- TypeScript strict: موفق
- ESLint: موفق
- Next.js production build: موفق

هفت تست integration مربوط به PostgreSQL، Redis و Celery با `run-quality.ps1` روی Docker ویندوز اجرا می‌شوند؛ در اجرای قبلی شما همه ۱۱۳ تست نسخه V6 با Docker موفق بودند.
