'use client';

import { useEffect, useState, type FormEvent } from 'react';
import {
  CheckCircle2,
  Clock,
  Instagram,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  RefreshCw,
  Send,
} from 'lucide-react';
import {
  fetchContactPage,
  submitContactMessage,
  type ContactMessageInput,
  type ContactPageContent,
} from '@/lib/contact-api';
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

const emptyForm: ContactMessageInput = {
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
};

export function ContactPage() {
  const { navigateTo } = useNavigation();
  const [content, setContent] = useState<ContactPageContent | null>(null);
  const [form, setForm] = useState<ContactMessageInput>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [trackingId, setTrackingId] = useState('');
  const [reloadVersion, setReloadVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    fetchContactPage(controller.signal)
      .then(setContent)
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        setContent(null);
        setError(reason instanceof Error ? reason.message : 'دریافت اطلاعات تماس ناموفق بود.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [reloadVersion]);

  useEffect(() => {
    if (!content) return;
    const previousTitle = document.title;
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const previousDescription = description?.content;
    document.title = content.meta_title || content.title;
    if (description && content.meta_description) description.content = content.meta_description;
    return () => {
      document.title = previousTitle;
      if (description && previousDescription !== undefined) description.content = previousDescription;
    };
  }, [content]);

  const updateField = (field: keyof ContactMessageInput, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const result = await submitContactMessage(form);
      setTrackingId(result.id);
      setForm(emptyForm);
    } catch (reason) {
      setSubmitError(reason instanceof Error ? reason.message : 'ارسال پیام ناموفق بود. دوباره تلاش کنید.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center gap-2 text-muted-foreground"><Loader2 className="size-5 animate-spin" /> در حال دریافت اطلاعات تماس...</div>;
  }

  if (!content) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-4 px-4 text-center">
        <Phone className="size-12 text-muted-foreground" />
        <h1 className="text-xl font-bold">اطلاعات تماس در دسترس نیست</h1>
        <p className="text-sm leading-7 text-muted-foreground">{error || 'این صفحه هنوز از پنل مدیریت منتشر نشده است.'}</p>
        <Button variant="outline" onClick={() => setReloadVersion((version) => version + 1)}><RefreshCw className="size-4" /> تلاش دوباره</Button>
      </div>
    );
  }

  const contactItems = [
    content.address ? { label: 'آدرس', value: content.address, icon: MapPin, href: content.map_link } : null,
    content.phone ? { label: 'تلفن', value: content.phone, icon: Phone, href: `tel:${content.phone.replace(/\s/g, '')}` } : null,
    content.email ? { label: 'ایمیل', value: content.email, icon: Mail, href: `mailto:${content.email}` } : null,
    content.working_hours ? { label: 'ساعات کاری', value: content.working_hours, icon: Clock, href: '' } : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink onClick={() => navigateTo('home')} className="cursor-pointer">خانه</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>تماس با ما</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-8">
          <h1 className="text-2xl font-bold md:text-3xl">{content.title}</h1>
          {content.subtitle && <p className="mt-1 text-sm text-muted-foreground md:text-base">{content.subtitle}</p>}
        </div>

        <div className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <Card className="py-0 shadow-premium">
              <div className="p-6">
                <h2 className="mb-5 text-lg font-bold">{content.form_title}</h2>
                {trackingId ? (
                  <div className="flex flex-col items-center py-12 text-center">
                    <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-emerald-100"><CheckCircle2 className="size-8 text-emerald-600" /></div>
                    <h3 className="mb-1 text-lg font-bold">پیام شما با موفقیت ثبت شد</h3>
                    <p className="text-sm leading-7 text-muted-foreground">تیم پشتیبانی پیام را بررسی خواهد کرد.</p>
                    <p className="mt-3 rounded-md bg-muted px-3 py-2 text-xs">شناسه پیگیری: <span dir="ltr" className="font-mono">{trackingId}</span></p>
                    <Button className="mt-5" variant="outline" onClick={() => setTrackingId('')}>ارسال پیام جدید</Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="c-name">نام و نام خانوادگی</Label>
                        <Input id="c-name" maxLength={120} value={form.name} onChange={(event) => updateField('name', event.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="c-email">ایمیل</Label>
                        <Input id="c-email" type="email" maxLength={254} value={form.email} onChange={(event) => updateField('email', event.target.value)} required dir="ltr" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="c-phone">شماره تماس (اختیاری)</Label>
                        <Input id="c-phone" maxLength={20} value={form.phone} onChange={(event) => updateField('phone', event.target.value)} dir="ltr" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="c-subject">موضوع</Label>
                        <select id="c-subject" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50" value={form.subject} onChange={(event) => updateField('subject', event.target.value)} required>
                          <option value="">انتخاب کنید</option>
                          {content.subjects.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="c-message">پیام شما</Label>
                      <Textarea id="c-message" minLength={10} maxLength={4000} value={form.message} onChange={(event) => updateField('message', event.target.value)} rows={6} required />
                    </div>
                    {submitError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{submitError}</p>}
                    <Button type="submit" className="w-full" disabled={submitting}>
                      {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                      {submitting ? 'در حال ارسال...' : 'ارسال پیام'}
                    </Button>
                  </form>
                )}
              </div>
            </Card>
          </div>

          <div className="space-y-4 lg:col-span-2">
            <Card className="py-0 shadow-premium">
              <div className="space-y-5 p-5">
                <h2 className="text-lg font-bold">{content.information_title}</h2>
                <div className="space-y-4">
                  {contactItems.map((item, index) => {
                    const Icon = item.icon;
                    const body = <><p className="text-sm font-medium">{item.label}</p><p className="mt-0.5 whitespace-pre-line text-xs leading-5 text-muted-foreground" dir={item.label === 'ایمیل' || item.label === 'تلفن' ? 'ltr' : 'rtl'}>{item.value}</p></>;
                    return (
                      <div key={item.label}>
                        {index > 0 && <Separator className="mb-4" />}
                        <div className="flex items-start gap-3">
                          <div className="shrink-0 rounded-lg bg-gold/10 p-2"><Icon className="size-4 text-gold-dark" /></div>
                          {item.href ? <a href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined} rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined} className="hover:text-gold-dark">{body}</a> : <div>{body}</div>}
                        </div>
                      </div>
                    );
                  })}
                  {contactItems.length === 0 && <p className="text-sm text-muted-foreground">هنوز اطلاعات تماسی ثبت نشده است.</p>}
                </div>
              </div>
            </Card>

            {(content.instagram_url || content.whatsapp_url) && (
              <Card className="py-0 shadow-premium">
                <div className="space-y-4 p-5">
                  <h2 className="text-base font-bold">{content.social_title}</h2>
                  <div className="flex flex-wrap gap-3">
                    {content.instagram_url && <a href={content.instagram_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg bg-pink-500/10 px-4 py-2 text-sm text-pink-600 transition-colors hover:bg-pink-500/20"><Instagram className="size-4" /> اینستاگرام</a>}
                    {content.whatsapp_url && <a href={content.whatsapp_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-4 py-2 text-sm text-emerald-600 transition-colors hover:bg-emerald-500/20"><MessageCircle className="size-4" /> واتساپ</a>}
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>

        {(content.map_embed_url || content.address) && (
          <Card className="overflow-hidden py-0 shadow-premium">
            {content.map_embed_url ? (
              <iframe src={content.map_embed_url} title="موقعیت آزاد گذر روی نقشه" className="h-64 w-full border-0 md:h-80" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            ) : (
              <div className="flex h-64 items-center justify-center bg-gradient-brand md:h-80">
                <div className="px-4 text-center text-white/70"><MapPin className="mx-auto mb-3 size-12 opacity-60" /><p className="text-sm">{content.address}</p>{content.map_link && <a href={content.map_link} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-xs text-gold underline">مشاهده در نقشه</a>}</div>
              </div>
            )}
          </Card>
        )}
      </div>
    </main>
  );
}
