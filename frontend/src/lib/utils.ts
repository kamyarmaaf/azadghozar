import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

export function toPersianNumber(num: number | string): string {
  return String(num).replace(/\d/g, (d) => persianDigits[parseInt(d)]);
}

export function formatPrice(price: number): string {
  const formatted = price.toLocaleString('en-US');
  return `${toPersianNumber(formatted)}تومان`;
}

export function formatShortPrice(price: number): string {
  if (price >= 1_000_000_000) {
    const formatted = price.toLocaleString('en-US');
    return `${toPersianNumber(formatted)} تومان`;
  }
  if (price >= 1_000_000) {
    const formatted = price.toLocaleString('en-US');
    return `${toPersianNumber(formatted)} تومان`;
  }
  return `${toPersianNumber(price)} تومان`;
}

export function formatMileage(km: number): string {
  if (km >= 1000) {
    return `${toPersianNumber((km / 1000).toFixed(0))} هزار کیلومتر`;
  }
  return `${toPersianNumber(km)} کیلومتر`;
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0 && mins > 0) {
    return `${toPersianNumber(hours)} ساعت و ${toPersianNumber(mins)} دقیقه`;
  }
  if (hours > 0) {
    return `${toPersianNumber(hours)} ساعت`;
  }
  return `${toPersianNumber(mins)} دقیقه`;
}

export function getDiscountPercent(original: number, current: number): number {
  return Math.round(((original - current) / original) * 100);
}
