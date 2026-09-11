# زیرساخت تست Karvo

این بسته بر اساس ساختار فعلی پروژه ساخته شده است:

- Django 5.2
- Django REST Framework
- PostgreSQL
- Redis
- Celery
- Simple JWT
- OTP ثبت‌نام و ورود

## نکته مهم

این بسته روی کدهایی که در گفت‌وگو ساخته شده‌اند تنظیم شده است. اگر نام URL، migration،
فیلد مدل یا مسیر فایل‌ها را تغییر داده‌اید، تست مربوطه نیز باید به‌روزرسانی شود.

## نصب فایل‌ها

محتویات این بسته را داخل ریشه پروژه `karvo` کپی کنید؛ در همان جایی که این فایل‌ها هستند:

```text
karvo/
├── compose.yaml
├── compose.test.yaml
├── run-tests.ps1
└── backend/
```

فایل‌های اصلی پروژه overwrite نمی‌شوند، به‌جز `backend/pyproject.toml` اگر از قبل آن را دارید.
در آن حالت ابتدا فایل قبلی را با فایل جدید ادغام کنید.


## ایزولیشن محیط تست

اسکریپت تست از Compose project جداگانه با نام `karvo-test` استفاده می‌کند؛ بنابراین
PostgreSQL، Redis، network و volumeهای تست با محیط Development قاطی نمی‌شوند. همچنین
برای اجرای تست‌ها به فایل `.env` نیاز نیست و مقادیر test-only داخل `compose.test.yaml`
تعریف شده‌اند. backend تست برای Load/Stress/Spike روی پورت `8001` میزبان اجرا می‌شود تا
با backend توسعه روی `8000` تداخل نداشته باشد.

## ساخت Image تست

```powershell
docker compose -f compose.yaml -f compose.test.yaml build test
```

## تست سریع روزمره

```powershell
.\run-tests.ps1 fast
```

شامل:

- Type Check
- Unit
- Component
- Regression
- Smoke
- API
- Security behavior tests

## اجرای تمام تست‌های عملکردی

```powershell
.\run-tests.ps1 all
```

شامل:

- تمام pytestها
- Integration
- Migration
- E2E بک‌اند
- Coverage
- Bandit
- pip-audit

تست‌های Load/Stress/Spike عمداً داخل `all` نیستند؛ چون زمان‌بر و وابسته به توان سیستم‌اند.

## کنترل کامل بک‌اند و فرانت‌اند

برای نصب دقیق وابستگی‌های قفل‌شده فرانت‌اند و اجرای همه کنترل‌های بک‌اند، تست‌های واحد
فرانت‌اند، ESLint، TypeScript و build نسخه production از اسکریپت یکپارچه استفاده کنید:

```powershell
.\run-quality.ps1
```

اگر قبلاً `npm ci` اجرا شده و پوشه `node_modules` آماده است:

```powershell
.\run-quality.ps1 -SkipInstall
```

## اجرای هر دسته به‌صورت مستقل

```powershell
.\run-tests.ps1 type
.\run-tests.ps1 unit
.\run-tests.ps1 component
.\run-tests.ps1 integration
.\run-tests.ps1 migration
.\run-tests.ps1 e2e
.\run-tests.ps1 regression
.\run-tests.ps1 smoke
.\run-tests.ps1 api
.\run-tests.ps1 security
```

## تست‌های کارایی

ابتدا backend باید بالا باشد؛ اسکریپت این کار را انجام می‌دهد.

### Load Test

بار عادی محلی: ۲۰ کاربر هم‌زمان، افزایش ۵ کاربر در ثانیه، مدت ۲ دقیقه:

```powershell
.\run-tests.ps1 load
```

### Stress Test

افزایش تدریجی تا فشار بیشتر: ۷۵ کاربر، نرخ ۱۰ کاربر در ثانیه، مدت ۳ دقیقه:

```powershell
.\run-tests.ps1 stress
```

### Spike Test

افزایش ناگهانی: ۱۵۰ کاربر با نرخ ۱۵۰ کاربر در ثانیه، مدت ۴۵ ثانیه:

```powershell
.\run-tests.ps1 spike
```

این اعداد برای لپ‌تاپ توسعه در نظر گرفته شده‌اند. روی سرور staging می‌توان آن‌ها را افزایش داد.

## تست endpoint محافظت‌شده در Locust

Locust بدون توکن فقط Health Check را تست می‌کند. برای تست `/me/`:

```powershell
$env:LOCUST_ACCESS_TOKEN="ACCESS_TOKEN_VALUE"
.\run-tests.ps1 load
```

## خروجی Coverage

در اجرای `all` پوشه زیر ساخته می‌شود:

```text
backend/htmlcov/
```

فایل زیر را در مرورگر باز کنید:

```text
backend/htmlcov/index.html
```

حداقل Coverage فعلی ۸۰٪ در نظر گرفته شده است.

## دسته‌بندی تست‌ها

| دسته | هدف |
|---|---|
| Type Check | پیدا کردن ناسازگاری نوع‌ها بدون اجرای برنامه |
| Unit | منطق خالص شماره موبایل و OTP |
| Component | همکاری View، Serializer، Model و JWT |
| Integration | اتصال واقعی PostgreSQL، Redis و Broker سلری |
| Migration | حفظ کاربران قدیمی هنگام افزودن فیلدهای موبایل |
| E2E | ثبت‌نام، دریافت پروفایل، Refresh و ورود |
| Regression | جلوگیری از برگشت باگ‌های OTP و Role |
| Smoke | سالم‌بودن حداقلی پروژه و URLها |
| API | Status code، JSON contract و محدودیت method |
| Security | OTP hash، تلاش محدود، حساب غیرفعال و ورودی مخرب |
| Load | رفتار زیر بار عادی |
| Stress | رفتار نزدیک یا فراتر از ظرفیت |
| Spike | رفتار هنگام جهش ناگهانی ترافیک |

## امنیت درخواست OTP ورود

ضعف account enumeration در endpoint درخواست OTP ورود برطرف شده است. پاسخ عمومی برای
شماره فعال، غیرفعال و ثبت‌نشده یکسان است؛ با این تفاوت که برای حساب غیرفعال یا شماره
ثبت‌نشده SMS ارسال نمی‌شود. تست امنیتی مربوطه دیگر `XFAIL` نیست و باید همیشه سبز باشد.

## تفسیر خروجی pytest

- `PASSED`: تست موفق است.
- `FAILED`: رفتار واقعی با انتظار تست متفاوت است.
- `XFAIL`: ضعف یا کار ناتمام شناخته‌شده.
- `XPASS`: تستی که انتظار شکست داشتیم موفق شده؛ احتمالاً ضعف برطرف شده و باید marker حذف شود.
- `ERROR`: زیرساخت یا fixture قبل از اجرای assertion خطا داده است.

## اجرای خام بدون اسکریپت

```powershell
docker compose -f compose.yaml -f compose.test.yaml run --rm test pytest
```

Type Check:

```powershell
docker compose -f compose.yaml -f compose.test.yaml run --rm test mypy apps config
```

Bandit:

```powershell
docker compose -f compose.yaml -f compose.test.yaml run --rm test bandit -r apps config -x "apps/accounts/migrations,apps/businesses/migrations,apps/catalog/migrations,tests"
```

Dependency audit:

```powershell
docker compose -f compose.yaml -f compose.test.yaml run --rm test pip-audit -r requirements.txt
```
