# Karvo Backend

بک‌اند Django/DRF پروژه آزادگذر با PostgreSQL، Redis، Celery، JWT و ورود/ثبت‌نام OTP.

## اجرای محیط توسعه با Docker

در PowerShell و از ریشه پروژه:

```powershell
Copy-Item .env.dev.example .env.dev
docker compose -f compose.yaml -f compose.dev.yaml build
docker compose -f compose.yaml -f compose.dev.yaml up -d db redis
docker compose -f compose.yaml -f compose.dev.yaml run --rm backend python manage.py migrate
docker compose -f compose.yaml -f compose.dev.yaml up -d backend celery_worker
```

بررسی سلامت:

```powershell
docker compose -f compose.yaml -f compose.dev.yaml ps
docker compose -f compose.yaml -f compose.dev.yaml exec backend python manage.py check
Invoke-RestMethod http://localhost:8000/api/health/
```

ساخت مدیر:

```powershell
docker compose -f compose.yaml -f compose.dev.yaml exec backend python manage.py createsuperuser
```

لاگ‌ها و توقف:

```powershell
docker compose -f compose.yaml -f compose.dev.yaml logs -f backend celery_worker
docker compose -f compose.yaml -f compose.dev.yaml down
```

برای حذف دیتای PostgreSQL/Redis فقط در صورت اطمینان از دستور زیر استفاده کنید:

```powershell
docker compose -f compose.yaml -f compose.dev.yaml down -v
```

## قرارداد حساب کاربری V1

همه مسیرهای زیر با پیشوند `/api/v1/auth/` هستند:

| Method | Path | دسترسی | کاربرد |
|---|---|---|---|
| GET | `roles/` | عمومی | فهرست ۹ نقش و نقش‌های قابل ثبت‌نام |
| POST | `signup/request-otp/` | عمومی | درخواست OTP با `phone_number`، `role` و کد دعوت اختیاری |
| POST | `signup/verify-otp/` | عمومی | تأیید OTP، ایجاد کاربر و صدور JWT |
| POST | `signup/complete/` | JWT | ثبت نام، رمز عبور و پذیرش قوانین پس از تأیید موبایل |
| POST | `login/request-otp/` | عمومی | درخواست OTP ورود بدون افشای وجود حساب |
| POST | `login/verify-otp/` | عمومی | تأیید OTP ورود و صدور JWT |
| POST | `login/password/` | عمومی | ورود با شماره موبایل/نام کاربری/ایمیل و رمز عبور |
| POST | `password-reset/request-otp/` | عمومی | درخواست کد بازیابی بدون افشای وجود حساب |
| POST | `password-reset/confirm/` | عمومی | تغییر رمز با OTP یک‌بارمصرف و سیاست رمز جنگو |
| POST | `token/refresh/` | عمومی | تمدید access token |
| GET/PATCH | `me/` | JWT | مشاهده/ویرایش پروفایل؛ نقش از این مسیر قابل تغییر نیست |
| GET | `referrals/verify/?code=...` | عمومی | اعتبارسنجی کد دعوت |
| GET | `referrals/stats/` | JWT | آمار و تاریخچه دعوت‌های کاربر |
| POST | `referrals/<id>/claim/` | JWT | دریافت یک‌باره پاداش متعلق به کاربر |
| GET/POST | `role-changes/` | JWT | تاریخچه شخصی/ثبت درخواست تغییر نقش |
| GET | `role-changes/pending/` | مدیر | درخواست‌های در انتظار |
| POST | `role-changes/<id>/approve/` | مدیر | تأیید و اعمال اتمیک نقش |
| POST | `role-changes/<id>/reject/` | مدیر | رد درخواست |

نقش‌های ثبت‌نام عمومی فقط `buyer`، `seller` و `gallery` هستند. نقش‌های سازمانی، مدیریتی و عملیاتی باید توسط مدیر تخصیص داده شوند. ارتقای `gallery` به `agency` در فاز اشتراک/صورتحساب انجام می‌شود.

لایه API فرانت نگاشت camelCase به snake_case، نگهداری JWT و تمدید خودکار access token را انجام می‌دهد. مبدا مجاز پیش‌فرض فرانت `http://localhost:3000` است و با `CORS_ALLOWED_ORIGINS` قابل تغییر است.

## حالت مقاوم OTP

مسیر عادی OTP از Redis و Celery استفاده می‌کند. برای جلوگیری از قطع احراز هویت، هر چالش OTP به‌صورت هش‌شده و زمان‌دار در PostgreSQL نیز نگهداری می‌شود:

- اگر Redis قطع شود، ایجاد و تأیید OTP از نسخه PostgreSQL ادامه پیدا می‌کند.
- قبل از صف‌کردن پیامک، سلامت Celery worker بررسی می‌شود.
- اگر worker یا broker در دسترس نباشد، ارسال مستقیم پیامک از backend انجام می‌شود.
- اگر هر دو مسیر ارسال شکست بخورند، API به‌جای خطای 500 پاسخ کنترل‌شده 503 می‌دهد و cooldown ناموفق آزاد می‌شود.
- کد خام OTP در Redis یا PostgreSQL ذخیره نمی‌شود و پس از مصرف قابل استفاده مجدد نیست.

در حالت توسعه، OTP مسیر عادی در لاگ `celery_worker` و OTP مسیر جایگزین در لاگ `backend` دیده می‌شود:

```powershell
docker compose -f compose.yaml -f compose.dev.yaml logs -f backend celery_worker
```

تنها پیش‌نیاز fallback، سالم‌بودن PostgreSQL و در محیط واقعی در‌دسترس‌بودن سرویس‌دهنده پیامک است.

## قرارداد آگهی V1

مسیرهای آگهی با پیشوند `/api/v1/catalog/listings/` در دسترس‌اند:

| Method | Path | دسترسی | کاربرد |
|---|---|---|---|
| GET | `listings/` | عمومی/JWT | آگهی‌های فعال؛ مالک آگهی‌های در انتظار خودش را هم می‌بیند |
| POST | `listings/` | فروشنده/نمایشگاه/نمایندگی | ثبت multipart آگهی و ۵ تا ۱۰ تصویر |
| GET | `listings/<id>/` | عمومی/JWT | مشاهده آگهی مجاز |
| PATCH/PUT/DELETE | `listings/<id>/` | مالک یا مدیر | ویرایش یا حذف آگهی |
| POST | `listings/<id>/approve/` | مدیر | تأیید و انتشار آگهی |
| POST | `listings/<id>/reject/` | مدیر | رد آگهی همراه با دلیل |
| GET | `favorites/` | JWT | فهرست آگهی‌های ذخیره‌شده کاربر |
| POST | `favorites/` | JWT | ذخیره آگهی فعال با `listing_id` |
| DELETE | `favorites/<listing_id>/` | JWT | حذف آگهی از علاقه‌مندی‌های همان کاربر |
| GET | `listings/comparison-candidates/` | عمومی | جست‌وجوی سبک آگهی‌های فعال با Cursor Pagination |
| GET | `listings/comparison/?ids=1,2` | عمومی | دریافت گروهی حداکثر ۴ آگهی برای مقایسه |

پارامتر `mine=true` فقط آگهی‌های کاربر واردشده را برمی‌گرداند. فیلترهای وضعیت، برند، مدل،
محدوده سال/قیمت/کارکرد، بدنه، رنگ، گیربکس، سوخت، وضعیت خودرو، نوع فروشنده و ترتیب قیمت/کارکرد
نیز روی همین endpoint فعال هستند.

هر آگهی جدید با وضعیت `pending` ثبت می‌شود. تصاویر ورودی باید JPEG، PNG یا WebP واقعی و
حداکثر ۱.۵ مگابایت باشند. سرور مستقل از فرانت، متادیتا را حذف می‌کند، ابعاد را حداکثر به
۱۹۲۰ پیکسل می‌رساند و خروجی WebP حداکثر ۱ مگابایتی ذخیره می‌کند. ویدیوی اختیاری
MP4/WebM/MOV تا سقف ۲۰۰ مگابایت پذیرفته می‌شود.

برای ویرایش multipart، شناسه تصاویر باقی‌مانده را در `retained_image_ids` و تصاویر جدید را
در `images` بفرستید. مجموع آن‌ها باید ۵ تا ۱۰ تصویر باشد. `remove_video=true` ویدیوی فعلی
را حذف می‌کند. هر ویرایش مالک، آگهی را برای تأیید دوباره به وضعیت `pending` می‌برد؛ مدیر
می‌تواند وضعیت را از صفحه جزئیات، جدول یا عملیات گروهی Django Admin تغییر دهد.

لوگو و کاور نمایشگاه/نمایندگی با `PATCH /api/v1/auth/me/` و multipart قابل ارسال‌اند.
خروجی لوگو WebP تا ۳۰۰ کیلوبایت/۸۰۰ پیکسل و خروجی کاور WebP تا ۷۰۰ کیلوبایت/۱۹۲۰ پیکسل است.

علاقه‌مندی‌ها برای هر کاربر در دیتابیس ذخیره می‌شوند. فقط آگهی‌های فعال قابل ذخیره‌اند،
ثبت دوباره همان آگهی idempotent است و حذف با شناسه آگهی انجام می‌شود. مالکیت همه عملیات
در queryset کنترل می‌شود تا کاربر نتواند علاقه‌مندی شخص دیگری را مشاهده یا حذف کند.

## مقایسه و بهینه‌سازی برای حجم بالای آگهی

انتخاب خودرو برای مقایسه، همه آگهی‌ها را یک‌جا دریافت نمی‌کند. مسیر
`comparison-candidates` با Cursor Pagination و صفحه پیش‌فرض ۱۶تایی کار می‌کند و حداکثر
۲۴ رکورد در هر درخواست می‌فرستد؛ بنابراین با عمیق‌شدن صفحات، هزینه `OFFSET` و شمارش کل
رکوردها ایجاد نمی‌شود. پاسخ این مسیر فقط اطلاعات کارت و یک تصویر کاور را برمی‌گرداند.

مسیر `comparison` شناسه یک تا چهار آگهی را می‌پذیرد و اطلاعات لازم را با یک Query گروهی
برمی‌گرداند. فقط آگهی‌های فعال عمومی قابل مقایسه‌اند. برای فهرست‌های عمومی نیز پارامتر
`summary=true` خروجی سبک با یک تصویر کاور تولید می‌کند و از بارگذاری تمام تصاویر و متن
کامل آگهی جلوگیری می‌کند.

مهاجرت `0006_listing_scale_indexes` ایندکس‌های فید، قیمت، کارکرد، سال و برند آگهی‌های فعال
را همراه با ایندکس‌های جست‌وجوی Trigram ایجاد می‌کند. در PostgreSQL این ایندکس‌ها با
`CONCURRENTLY` ساخته می‌شوند تا جدول آگهی‌ها هنگام استقرار طولانی‌مدت قفل نشود. کاربر
اجرای migration باید اجازه ایجاد افزونه `pg_trgm` را داشته باشد؛ در غیر این صورت افزونه
را مدیر دیتابیس باید یک‌بار پیش از migration فعال کند.

## مهاجرت و تست

بعد از هر دریافت نسخه جدید:

```powershell
docker compose -f compose.yaml -f compose.dev.yaml exec backend python manage.py migrate
.\run-tests.ps1 fast
```

تست واحد فرانت‌اند:

```powershell
cd frontend
npm test
```

کنترل کامل بک‌اند و فرانت‌اند (PowerShell):

```powershell
.\run-quality.ps1
```

برای مجموعه کامل تست‌ها:

```powershell
.\run-tests.ps1 all
```

جزئیات بیشتر در `README-TESTS-FA.md` آمده است.
