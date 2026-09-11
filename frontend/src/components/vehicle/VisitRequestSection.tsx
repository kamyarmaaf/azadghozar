'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { toJalaali, toGregorian, jalaaliMonthLength } from 'jalaali-js';
import {
  CalendarDays, Clock, MapPin, User, CheckCircle2,
  ChevronRight, ChevronLeft, Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';

const persianWeekDays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
const persianMonthNames = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
];

const timeSlots = [
  { id: 't1', label: '۹:۰۰ - ۱۰:۰۰', hour: 9 },
  { id: 't2', label: '۱۰:۰۰ - ۱۱:۰۰', hour: 10 },
  { id: 't3', label: '۱۱:۰۰ - ۱۲:۰۰', hour: 11 },
  { id: 't4', label: '۱۳:۰۰ - ۱۴:۰۰', hour: 13 },
  { id: 't5', label: '۱۴:۰۰ - ۱۵:۰۰', hour: 14 },
  { id: 't6', label: '۱۵:۰۰ - ۱۶:۰۰', hour: 15 },
  { id: 't7', label: '۱۶:۰۰ - ۱۷:۰۰', hour: 16 },
  { id: 't8', label: '۱۷:۰۰ - ۱۸:۰۰', hour: 17 },
];

function toPersian(n: number) {
  return n.toString().replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
}

/** Iranian official holidays for 1405 (Mordad to Esfand). Format: 'month/day': name */
const iranianHolidays1405: Record<string, string> = {
  // شهریور
  '6/31': 'آخرین روز شهریور',
  // مهر
  '7/20': 'روز بزرگداشت حافظ',
  // آبان
  '8/13': 'روز دانشجو',
  // آذر
  '9/5': 'روز بزرگداشت خواجه نصیر',
  '9/16': 'روز دانشجو (آذر)',
  // دی
  '10/5': 'وفات حضرت رسول اکرم و شهادت امام حسن مجتبی(ع)',
  '10/6': 'شهادت امام رضا(ع)',
  '10/7': 'شهادت امام محمد تقی(ج)',
  '10/17': 'میلاد حضرت رسول اکرم و امام صادق(ع)',
  // بهمن
  '11/12': 'روز بصیرت',
  '11/19': 'انقلاب اسلامی (۱۲ بهمن)',
  '11/20': 'پیروزی انقلاب اسلامی (۲۲ بهمن)',
  '11/22': 'روز وطن‌دوستی',
  // اسفند
  '12/1': 'روز بزرگداشت ابوعلی سینا',
  '12/5': 'روز بزرگداشت خواجوی کرمانی',
  '12/14': 'روز نیروی هوایی',
  '12/15': 'روز درختکاری',
  '12/29': 'ملی شدن صنعت نفت',
};

function getHolidayName(jy: number, jm: number, jd: number): string | null {
  if (jy === 1405) {
    const key = `${jm}/${jd}`;
    return iranianHolidays1405[key] || null;
  }
  return null;
}

interface VisitRequestSectionProps {
  vehicleBrand: string;
  vehicleModel: string;
  sellerName: string;
  city: string;
}

export function VisitRequestSection({ vehicleBrand, vehicleModel, sellerName, city }: VisitRequestSectionProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [currentJMonth, setCurrentJMonth] = useState(() => {
    const now = new Date();
    const { jm } = toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
    return jm;
  });
  const [currentJYear, setCurrentJYear] = useState(() => {
    const now = new Date();
    const { jy } = toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
    return jy;
  });
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const today = useMemo(() => {
    const now = new Date();
    return { gy: now.getFullYear(), gm: now.getMonth() + 1, gd: now.getDate() };
  }, []);

  const todayJ = useMemo(() => {
    return toJalaali(today.gy, today.gm, today.gd);
  }, [today]);

  const calendarDays = useMemo(() => {
    const { jy, jm } = { jy: currentJYear, jm: currentJMonth };
    const firstDayG = toGregorian(jy, jm, 1);
    const dayOfWeek = new Date(firstDayG.gy, firstDayG.gm - 1, firstDayG.gd).getDay();
    const offset = (dayOfWeek + 1) % 7;
    const monthLength = jalaaliMonthLength(jy, jm);

    const days: Array<{ day: number; isCurrentMonth: boolean; isToday: boolean; isPast: boolean; isDisabled: boolean; isFriday: boolean; isHoliday: boolean; holidayName: string; dateKey: string }> = [];

    let prevMonth = jm - 1;
    let prevYear = jy;
    if (prevMonth < 1) { prevMonth = 12; prevYear -= 1; }
    const prevMonthLength = jalaaliMonthLength(prevYear, prevMonth);
    for (let i = offset - 1; i >= 0; i--) {
      days.push({
        day: prevMonthLength - i,
        isCurrentMonth: false,
        isToday: false,
        isPast: true,
        isDisabled: true,
        isFriday: false,
        isHoliday: false,
        holidayName: '',
        dateKey: `${prevYear}/${prevMonth}/${prevMonthLength - i}`,
      });
    }

    for (let d = 1; d <= monthLength; d++) {
      const { gy, gm, gd } = toGregorian(jy, jm, d);
      const isToday = jy === todayJ.jy && jm === todayJ.jm && d === todayJ.jd;
      const isPast = new Date(gy, gm - 1, gd) < new Date(today.gy, today.gm - 1, today.gd);
      const gregorianDate = new Date(gy, gm - 1, gd);
      const dayIndex = (gregorianDate.getDay() + 1) % 7;
      const isFriday = dayIndex === 6;
      const holidayName = getHolidayName(jy, jm, d);
      const isHoliday = !!holidayName;
      days.push({
        day: d,
        isCurrentMonth: true,
        isToday,
        isPast,
        isDisabled: isPast || isFriday || isHoliday,
        isFriday,
        isHoliday,
        holidayName: holidayName || '',
        dateKey: `${jy}/${jm}/${d}`,
      });
    }

    const remaining = 42 - days.length;
    let nextMonth2 = jm + 1;
    let nextYear2 = jy;
    if (nextMonth2 > 12) { nextMonth2 = 1; nextYear2 += 1; }
    for (let d = 1; d <= remaining; d++) {
      days.push({
        day: d,
        isCurrentMonth: false,
        isToday: false,
        isPast: false,
        isDisabled: true,
        isFriday: false,
        isHoliday: false,
        holidayName: '',
        dateKey: `${nextYear2}/${nextMonth2}/${d}`,
      });
    }

    return days;
  }, [currentJYear, currentJMonth, todayJ, today]);

  const prevMonth = useCallback(() => {
    let newMonth = currentJMonth - 1;
    let newYear = currentJYear;
    if (newMonth < 1) { newMonth = 12; newYear -= 1; }
    setCurrentJMonth(newMonth);
    setCurrentJYear(newYear);
  }, [currentJMonth, currentJYear]);

  const nextMonth = useCallback(() => {
    let newMonth = currentJMonth + 1;
    let newYear = currentJYear;
    if (newMonth > 12) { newMonth = 1; newYear += 1; }
    // Allow up to Esfand (month 12) of current year
    if (newYear > todayJ.jy || (newYear === todayJ.jy && newMonth > 12)) return;
    setCurrentJMonth(newMonth);
    setCurrentJYear(newYear);
  }, [currentJMonth, currentJYear, todayJ]);

  const canGoNext = useMemo(() => {
    // Allow navigation up to Esfand of the current year
    return currentJYear < todayJ.jy || (currentJYear === todayJ.jy && currentJMonth < 12);
  }, [currentJYear, currentJMonth, todayJ]);

  const handleDateSelect = (dateKey: string, isDisabled: boolean) => {
    if (isDisabled) return;
    setSelectedDate(dateKey);
    setSelectedTime(null);
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime || !name.trim() || !phone.trim()) return;
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 1500));
    setIsSubmitting(false);
    setShowSuccess(true);
  };

  const handleReset = () => {
    setShowSuccess(false);
    setSelectedDate(null);
    setSelectedTime(null);
    setName('');
    setPhone('');
  };

  const selectedTimeSlot = timeSlots.find((t) => t.id === selectedTime);
  const selectedDateParts = selectedDate?.split('/').map(Number);
  const selectedDateStr = selectedDateParts
    ? `${toPersian(selectedDateParts[2])} ${persianMonthNames[selectedDateParts[1] - 1]} ${toPersian(selectedDateParts[0])}`
    : '';

  return (
    <>
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 rounded-xl bg-gold/10">
          <CalendarDays className="size-6 text-gold-dark" />
        </div>
        <div>
          <h2 className="text-lg font-bold">درخواست بازدید حضوری</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            تاریخ و ساعت مورد نظر خود را انتخاب کنید
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Calendar */}
        <Card className="py-0 shadow-premium lg:col-span-3">
          <div className="p-5">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-5">
              <button
                onClick={prevMonth}
                className="p-2 rounded-lg hover:bg-secondary transition-colors"
              >
                <ChevronRight className="size-5" />
              </button>
              <h3 className="text-base font-bold">
                {persianMonthNames[currentJMonth - 1]} {toPersian(currentJYear)}
              </h3>
              <button
                onClick={nextMonth}
                disabled={!canGoNext}
                className="p-2 rounded-lg hover:bg-secondary transition-colors disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronLeft className="size-5" />
              </button>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {persianWeekDays.map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-medium text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((d, idx) => {
                const isSelected = selectedDate === d.dateKey && d.isCurrentMonth;
                const isHolidayNonPast = d.isHoliday && d.isCurrentMonth && !d.isPast;
                return (
                  <button
                    key={idx}
                    disabled={d.isDisabled}
                    onClick={() => handleDateSelect(d.dateKey, d.isDisabled)}
                    title={d.holidayName || (d.isFriday && d.isCurrentMonth ? 'جمعه' : '')}
                    className={`group/day relative aspect-square rounded-xl text-sm font-medium transition-all duration-200
                      ${d.isCurrentMonth ? 'text-foreground' : 'text-muted-foreground/30'}
                      ${d.isDisabled && d.isCurrentMonth ? 'cursor-not-allowed' : ''}
                      ${d.isPast && d.isCurrentMonth ? 'text-muted-foreground/30' : ''}
                      ${isHolidayNonPast ? 'text-destructive' : ''}
                      ${d.isFriday && d.isCurrentMonth && !d.isPast && !d.isHoliday ? 'text-destructive/60' : ''}
                      ${!d.isDisabled && d.isCurrentMonth ? 'hover:bg-gold/10 cursor-pointer' : ''}
                      ${d.isToday ? 'ring-2 ring-gold/50' : ''}
                      ${isSelected
                        ? 'bg-gold text-white shadow-md shadow-gold/30 hover:bg-gold'
                        : ''
                      }
                    `}
                  >
                    {toPersian(d.day)}
                    {isHolidayNonPast && (
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-destructive" />
                    )}
                    {d.isFriday && d.isCurrentMonth && !d.isPast && !d.isHoliday && (
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-destructive/50" />
                    )}
                    {d.holidayName && d.isCurrentMonth && !d.isPast && (
                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-destructive text-white text-[9px] rounded-md whitespace-nowrap opacity-0 group-hover/day:opacity-100 transition-opacity pointer-events-none z-10">
                        {d.holidayName}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Calendar Footer Legend */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-4 pt-3 border-t">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-full bg-gold" />
                انتخاب شده
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-full ring-2 ring-gold/50" />
                امروز
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-full bg-destructive" />
                تعطیل رسمی
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-full bg-destructive/40" />
                جمعه
              </div>
            </div>
          </div>
        </Card>

        {/* Right Panel - Time + Form */}
        <div className="lg:col-span-2 space-y-4">
          {/* Time Slots */}
          <Card className="py-0 shadow-premium">
            <div className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="size-4 text-gold-dark" />
                <h3 className="text-sm font-bold">انتخاب ساعت</h3>
              </div>

              {!selectedDate ? (
                <div className="text-center py-6">
                  <CalendarDays className="size-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">ابتدا تاریخ را انتخاب کنید</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => setSelectedTime(slot.id)}
                      className={`p-2.5 rounded-xl text-xs font-medium border transition-all duration-200
                        ${selectedTime === slot.id
                          ? 'bg-gold/10 border-gold text-gold-dark shadow-sm'
                          : 'border-border hover:border-gold/50 hover:bg-gold/5'
                        }
                      `}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Contact Form */}
          <Card className="py-0 shadow-premium">
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <User className="size-4 text-gold-dark" />
                <h3 className="text-sm font-bold">اطلاعات تماس</h3>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">نام و نام خانوادگی</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثلاً: علی محمدی"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold/40 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">شماره موبایل</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9۰-۹]/g, ''))}
                    placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                    dir="ltr"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold/40 transition-colors text-right"
                  />
                </div>
              </div>

              <Button
                className="w-full gap-2"
                size="lg"
                disabled={!selectedDate || !selectedTime || !name.trim() || !phone.trim() || isSubmitting}
                onClick={handleSubmit}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    در حال ارسال...
                  </span>
                ) : (
                  <>
                    <Send className="size-4" />
                    ثبت درخواست بازدید
                  </>
                )}
              </Button>

              {/* Summary */}
              {selectedDate && selectedTime && (
                <div className="bg-secondary/50 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">خودرو</span>
                    <span className="font-medium">{vehicleBrand} {vehicleModel}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">تاریخ</span>
                    <span className="font-medium">{selectedDateStr}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">ساعت</span>
                    <span className="font-medium">{selectedTimeSlot?.label}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">محل بازدید</span>
                    <span className="font-medium flex items-center gap-1">
                      <MapPin className="size-3" />
                      {city} - {sellerName}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-md">
          <div className="py-4 space-y-4 text-center">
            <div className="w-16 h-16 mx-auto bg-success/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="size-9 text-success" />
            </div>
            <div>
              <h3 className="text-lg font-bold">درخواست شما ثبت شد</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-7">
                درخواست بازدید حضوری شما با موفقیت ثبت شد.
                کارشناسان ما در اسرع وقت با شما تماس خواهند گرفت.
              </p>
            </div>
            <div className="bg-secondary/50 rounded-xl p-4 space-y-2.5 text-sm text-right">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">خودرو</span>
                <span className="font-medium">{vehicleBrand} {vehicleModel}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">تاریخ</span>
                <span className="font-medium">{selectedDateStr}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">ساعت</span>
                <span className="font-medium">{selectedTimeSlot?.label}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">نام</span>
                <span className="font-medium">{name}</span>
              </div>
            </div>
            <Button className="w-full" onClick={handleReset}>
              ثبت درخواست جدید
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
