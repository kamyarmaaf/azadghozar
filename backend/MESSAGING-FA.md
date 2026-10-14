# پیام به صاحب آگهی

این نسخه گفتگوهای خصوصی هر آگهی را به بک‌اند و فرانت متصل می‌کند. کاربر واردشده از صفحهٔ آگهی، در صورتی که صاحب آگهی نباشد و روش تماس آگهی امکان گفتگو بدهد، می‌تواند گفتگو را باز کند و پیام بفرستد. صاحب آگهی از تب «پیام‌ها» در داشبورد فروشنده یا نمایشگاه/نمایندگی پاسخ می‌دهد؛ خریدار هم گفتگوهایش را در داشبورد خود می‌بیند.

## راه‌اندازی

پس از جایگزینی فایل‌های بک‌اند، مایگریشن جدید را اجرا کنید:

```bash
docker compose -f compose.yaml -f compose.dev.yaml up -d --build
docker compose -f compose.yaml -f compose.dev.yaml exec backend python manage.py migrate
```

فرانت را با تنظیمات معمول پروژه و آدرس API بک‌اند اجرا کنید. ورود کاربر برای ارسال و مشاهدهٔ پیام‌ها لازم است. در Docker توسعه، دستور `runserver` با نصب Daphne به ASGI و WebSocket متصل است. Redis علاوه بر استفاده‌های قبلی پروژه، کانال پیام را روی پایگاه شمارهٔ ۳ نگه می‌دارد؛ آدرس آن با `CHANNEL_REDIS_URL` قابل تنظیم است.

## دریافت بلادرنگ

WebSocket در `/ws/catalog/messages/` باز می‌شود. مرورگر `azadgozar-chat-v1` و JWT کوتاه‌مدت را به عنوان دو WebSocket subprotocol می‌فرستد؛ توکن در URL قرار نمی‌گیرد. سرور فقط مبدأهای `CORS_ALLOWED_ORIGINS` را می‌پذیرد، توکن و فعال بودن کاربر را بررسی می‌کند و پیام‌های مربوط به همان حساب را می‌فرستد. نوشتن پیام همچنان از API و با کنترل دسترسی و محدودیت نرخ انجام می‌شود. پس از ذخیرهٔ پیام، رویداد برای دو طرف گفتگو از طریق Channels و Redis منتشر می‌شود. هنگام قطع اتصال فرانت با تأخیر افزایشی دوباره وصل می‌شود و پیام‌های از دست‌رفته را از API می‌خواند.

آدرس WebSocket به صورت پیش‌فرض از مبدأ `NEXT_PUBLIC_API_BASE_URL` ساخته می‌شود. اگر مسیر WebSocket روی مبدأ دیگری سرو می‌شود، پیش از build فرانت `NEXT_PUBLIC_WS_BASE_URL` را روی آدرس آن مبدأ (`https://...` یا `wss://...`) بگذارید.

## اجرای روی سرور

سروری که فقط `passenger_wsgi.py` را اجرا می‌کند WebSocket را سرو نمی‌کند. کنار Passenger، یک فرایند ASGI اجرا کنید و مسیر `/ws/` دامنه را به آن پروکسی کنید. مثال با Nginx، در حالی که HTTP فعلی روی Passenger می‌ماند:

```bash
cd /path/to/backend/backend
CHANNEL_REDIS_URL=redis://127.0.0.1:6379/3 daphne -b 127.0.0.1 -p 8001 config.asgi:application
```

```nginx
location /ws/ {
    proxy_pass http://127.0.0.1:8001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_read_timeout 70s;
}
```

فرایند Daphne باید پایدار نگه داشته شود (مثلاً با سرویس systemd)، Redis در دسترس آن باشد، و مبدأ واقعی فرانت با طرح `http` یا `https` در `CORS_ALLOWED_ORIGINS` تنظیم شود. در میزبانی‌ای که امکان اجرای فرایند ASGI و پروکسی مسیر `/ws/` وجود ندارد، این قابلیت روی دامنه فعال نمی‌شود. در Docker توسعه این تنظیم‌ها با `docker compose ... up -d --build` فراهم‌اند.

## API

| روش | مسیر | کاربرد |
| --- | --- | --- |
| `GET` | `/api/v1/catalog/conversations/` | گفتگوهای کاربر، صفحه‌بندی‌شده |
| `POST` | `/api/v1/catalog/conversations/` | ایجاد یا بازیابی گفتگو با `listing_id` |
| `GET` | `/api/v1/catalog/conversations/{id}/messages/` | پیام‌های گفتگو، صفحه‌بندی‌شده |
| `POST` | `/api/v1/catalog/conversations/{id}/messages/` | ارسال `text` تا ۲۰۰۰ نویسه |

فقط خریدار و صاحب همان آگهی به گفتگو دسترسی دارند. شروع گفتگو برای آگهی فعال با روش تماس دارای چت مجاز است؛ گفتگوهای قبلی پس از تغییر وضعیت آگهی در دسترس می‌مانند. محدودیت درخواست برای باز کردن گفتگو و ارسال پیام اعمال شده است. دکمهٔ تازه‌سازی برای مواقع قطع اتصال هم موجود است.
