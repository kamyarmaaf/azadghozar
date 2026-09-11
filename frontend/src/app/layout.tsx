import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "آزاد گذر | بازار تخصصی خودروهای منطقه آزاد و واردات موقت",
  description: "خرید، فروش و خدمات تخصصی خودروهای دارای پلاک منطقه آزاد و واردات موقت. معرفی نمایندگی‌ها و نمایشگاه‌های معتبر خودرو.",
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground" style={{ fontFamily: "Tahoma, 'Segoe UI', Arial, sans-serif" }}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
