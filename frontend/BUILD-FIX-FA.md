# رفع خطای خروجی پنل نمایندگی

`AgencyDashboardPage.tsx` در نسخه‌های قدیمی `BusinessDashboardPage` را از `GalleryDashboardPage.tsx` وارد می‌کرد، اما فایل دوم فقط `GalleryDashboardPage` را صادر می‌کرد. این بسته سازگاری هر دو نام را برقرار می‌کند و فایل صفحهٔ نمایندگی را هم دارد.

پس از جایگزینی **کامل فایل‌های فرانت** در مسیر درست پروژه، سرور Next را ببندید و در PowerShell از داخل پوشه‌ای که `package.json` دارد اجرا کنید:

```powershell
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run dev
```

اگر پروژه را برای Django می‌سازید، به جای اجرای توسعه، `npm run build` و سپس روند انتشار فرانت همان پروژه را اجرا کنید. این خطا از فایل‌های قدیمی مخلوط‌شده نیز ممکن است ایجاد شود؛ اطمینان یابید فایل‌های `AgencyDashboardPage.tsx` و `GalleryDashboardPage.tsx` هر دو از همین بسته هستند.
