# راه‌اندازی پشتیبانی هوش مصنوعی

ویجت برای مهمان و کاربر واردشده فعال است. گفتگوها در پنل ادمین، بخش «گفتگوهای پشتیبانی» ذخیره می‌شوند. در نبود کلید هوش مصنوعی، پاسخ از سؤالات متداول منتشرشده و راهنمای داخلی برگردانده می‌شود.

در فایل `.env.dev` مقدارهای زیر را قرار دهید:

```env
AI_SUPPORT_API_KEY=your-secret-api-key
AI_SUPPORT_MODEL=gpt-4.1-mini
AI_SUPPORT_BASE_URL=https://api.openai.com/v1
AI_SUPPORT_TIMEOUT_SECONDS=20
```

می‌توانید به‌جای `AI_SUPPORT_API_KEY` از نام استاندارد `OPENAI_API_KEY` استفاده کنید. کلید را فقط در بک‌اند نگه دارید و هیچ‌وقت با پیشوند `NEXT_PUBLIC_` در فرانت قرار ندهید.

پس از جایگزینی فایل‌ها در ریشه پروژه اجرا کنید:

```powershell
docker compose -f compose.yaml -f compose.dev.yaml up -d --build backend
docker compose -f compose.yaml -f compose.dev.yaml exec backend python manage.py migrate
```

برای دیدن لاگ‌های پاسخ‌گویی:

```powershell
docker compose -f compose.yaml -f compose.dev.yaml logs -f backend
```
