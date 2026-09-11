'use client';

import React, { useState } from 'react';
import { Phone, Mail, MapPin, Clock, Send, Instagram, MessageCircle, CheckCircle2 } from 'lucide-react';
import { useNavigation } from '@/stores/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const subjectOptions = [
  'سوال درباره خدمات',
  'پشتیبانی فنی',
  'پیشنهاد همکاری',
  'شکایات و پیشنهادات',
  'سایر',
];

export function ContactPage() {
  const { navigateTo } = useNavigation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setName(''); setEmail(''); setPhone(''); setSubject(''); setMessage('');
    }, 3000);
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => navigateTo('home')} className="cursor-pointer">خانه</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>تماس با ما</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold">تماس با ما</h1>
          <p className="text-muted-foreground text-sm md:text-base mt-1">
            تیم پشتیبانی آزاد گذر آماده پاسخگویی به شماست
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-10">
          {/* Contact Form */}
          <div className="lg:col-span-3">
            <Card className="shadow-premium py-0">
              <div className="p-6">
                <h2 className="font-bold text-lg mb-5">ارسال پیام</h2>
                {submitted ? (
                  <div className="flex flex-col items-center py-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                      <CheckCircle2 className="size-8 text-emerald-500" />
                    </div>
                    <h3 className="font-bold text-lg mb-1">پیام شما ارسال شد</h3>
                    <p className="text-sm text-muted-foreground">تیم پشتیبانی به زودی پاسخ خواهد داد</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="c-name">نام و نام خانوادگی</Label>
                        <Input id="c-name" placeholder="نام خود را وارد کنید" value={name} onChange={(e) => setName(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="c-email">ایمیل</Label>
                        <Input id="c-email" type="email" placeholder="example@mail.com" value={email} onChange={(e) => setEmail(e.target.value)} required dir="ltr" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="c-phone">شماره تماس</Label>
                        <Input id="c-phone" placeholder="۰۹۱۲۳۴۵۶۷۸۹" value={phone} onChange={(e) => setPhone(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="c-subject">موضوع</Label>
                        <select
                          id="c-subject"
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          required
                        >
                          <option value="">انتخاب کنید</option>
                          {subjectOptions.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="c-message">پیام شما</Label>
                      <Textarea id="c-message" placeholder="پیام خود را بنویسید..." value={message} onChange={(e) => setMessage(e.target.value)} rows={5} required />
                    </div>
                    <Button type="submit" className="w-full">
                      ارسال پیام
                      <Send className="size-4" />
                    </Button>
                  </form>
                )}
              </div>
            </Card>
          </div>

          {/* Contact Info */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="shadow-premium py-0">
              <div className="p-5 space-y-5">
                <h2 className="font-bold text-lg">اطلاعات تماس</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-gold/10 shrink-0">
                      <MapPin className="size-4 text-gold-dark" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">آدرس</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-5">
                        تهران، خیابان ولیعصر، بالاتر از میدان ونک، پلاک ۱۲۳
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-gold/10 shrink-0">
                      <Phone className="size-4 text-gold-dark" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">تلفن</p>
                      <p className="text-xs text-muted-foreground mt-0.5" dir="ltr">021-88881234</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-gold/10 shrink-0">
                      <Mail className="size-4 text-gold-dark" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">ایمیل</p>
                      <p className="text-xs text-muted-foreground mt-0.5" dir="ltr">info@azadgozar.com</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-gold/10 shrink-0">
                      <Clock className="size-4 text-gold-dark" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">ساعات کاری</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-5">
                        شنبه تا پنج‌شنبه: ۹ صبح تا ۶ عصر
                        <br />
                        پشتیبانی آنلاین: ۲۴ ساعته
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="shadow-premium py-0">
              <div className="p-5 space-y-4">
                <h2 className="font-bold text-base">شبکه‌های اجتماعی</h2>
                <div className="flex gap-3">
                  <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-pink-500/10 text-pink-600 text-sm hover:bg-pink-500/20 transition-colors">
                    <Instagram className="size-4" />
                    <span>اینستاگرام</span>
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-600 text-sm hover:bg-emerald-500/20 transition-colors">
                    <MessageCircle className="size-4" />
                    <span>واتساپ</span>
                  </button>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Map Placeholder */}
        <Card className="py-0 overflow-hidden shadow-premium">
          <div className="h-64 md:h-80 bg-gradient-brand flex items-center justify-center">
            <div className="text-center text-white/50">
              <MapPin className="size-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm">نقشه</p>
              <p className="text-xs text-white/30 mt-1">تهران، خیابان ولیعصر، بالاتر از میدان ونک</p>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
