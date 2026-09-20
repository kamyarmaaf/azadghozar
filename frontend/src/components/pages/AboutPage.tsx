'use client';

import { useEffect, useState } from 'react';
import {
  Award,
  Building2,
  CheckCircle2,
  Eye,
  Heart,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Target,
  UserRound,
  Users,
} from 'lucide-react';
import { fetchAboutPage, type AboutPageContent } from '@/lib/about-api';
import { toPersianNumber } from '@/lib/utils';
import { useNavigation } from '@/stores/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const statisticIcons = {
  listing: CheckCircle2,
  agency: Building2,
  gallery: Award,
  users: Users,
};

const trustIcons = {
  verified: ShieldCheck,
  support: Users,
  guarantee: Award,
  inspection: CheckCircle2,
};

export function AboutPage() {
  const { navigateTo } = useNavigation();
  const [content, setContent] = useState<AboutPageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadVersion, setReloadVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    fetchAboutPage(controller.signal)
      .then(setContent)
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        setContent(null);
        setError(reason instanceof Error ? reason.message : 'دریافت اطلاعات درباره ما ناموفق بود.');
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
    document.title = content.meta_title || content.hero_title;
    if (description && content.meta_description) description.content = content.meta_description;
    return () => {
      document.title = previousTitle;
      if (description && previousDescription !== undefined) description.content = previousDescription;
    };
  }, [content]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" /> در حال دریافت اطلاعات درباره ما...
      </div>
    );
  }

  if (!content) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-4 px-4 text-center">
        <ShieldCheck className="size-12 text-muted-foreground" />
        <h1 className="text-xl font-bold">محتوای درباره ما در دسترس نیست</h1>
        <p className="text-sm leading-7 text-muted-foreground">{error || 'این صفحه هنوز از پنل مدیریت منتشر نشده است.'}</p>
        <Button variant="outline" onClick={() => setReloadVersion((version) => version + 1)}>
          <RefreshCw className="size-4" /> تلاش دوباره
        </Button>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => navigateTo('home')} className="cursor-pointer">خانه</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>درباره ما</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <section
          className="relative mb-10 overflow-hidden rounded-2xl bg-gradient-brand p-8 text-white shadow-premium-lg md:p-12"
          style={content.hero_image_url ? { backgroundImage: `linear-gradient(90deg, rgba(7, 16, 35, .94), rgba(7, 16, 35, .60)), url(${content.hero_image_url})`, backgroundPosition: 'center', backgroundSize: 'cover' } : undefined}
        >
          <div className="absolute left-0 top-0 size-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/10" />
          <div className="relative z-10 max-w-2xl">
            <h1 className="mb-4 text-3xl font-bold md:text-4xl">{content.hero_title}</h1>
            <p className="whitespace-pre-line text-sm leading-8 text-white/85 md:text-base">{content.intro}</p>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-6 text-center text-xl font-bold">{content.why_title}</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { title: content.mission_title, text: content.mission_text, icon: Target, style: 'bg-blue-500/10 text-blue-500' },
              { title: content.vision_title, text: content.vision_text, icon: Eye, style: 'bg-emerald-500/10 text-emerald-500' },
              { title: content.values_title, text: content.values_text, icon: Heart, style: 'bg-pink-500/10 text-pink-500' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title} className="py-0 shadow-premium hover-lift">
                  <div className="p-6 text-center">
                    <div className={`mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl ${item.style}`}><Icon className="size-7" /></div>
                    <h3 className="mb-2 text-base font-bold">{item.title}</h3>
                    <p className="whitespace-pre-line text-sm leading-6 text-muted-foreground">{item.text}</p>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {content.show_statistics && content.statistics.length > 0 && (
          <section className="mb-10">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {content.statistics.map((stat) => {
                const Icon = statisticIcons[stat.icon] || CheckCircle2;
                return (
                  <Card key={stat.id} className="py-0 shadow-premium hover-lift">
                    <div className="p-5 text-center">
                      <Icon className="mx-auto mb-3 size-8 text-gold-dark" />
                      <p className="text-2xl font-bold text-brand md:text-3xl">
                        {toPersianNumber(stat.value.toLocaleString())}{stat.suffix}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {content.show_team && content.team_members.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-6 text-center text-xl font-bold">{content.team_title}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {content.team_members.map((member) => (
                <Card key={member.id} className="overflow-hidden py-0 shadow-premium hover-lift">
                  <div className="flex h-48 items-center justify-center overflow-hidden bg-gradient-to-br from-brand to-slate-700">
                    {member.photo_url ? (
                      <img src={member.photo_url} alt={member.name} className="size-full object-cover" />
                    ) : (
                      <UserRound className="size-20 text-white/35" />
                    )}
                  </div>
                  <div className="p-4 text-center">
                    <h3 className="text-sm font-bold">{member.name}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{member.role}</p>
                    {member.description && <p className="mt-3 text-xs leading-6 text-muted-foreground">{member.description}</p>}
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {content.show_trust_items && content.trust_items.length > 0 && (
          <section>
            <h2 className="mb-6 text-center text-xl font-bold">{content.trust_title}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {content.trust_items.map((item) => {
                const Icon = trustIcons[item.icon] || ShieldCheck;
                return (
                  <Card key={item.id} className="py-0 shadow-card hover-lift">
                    <div className="flex items-start gap-3 p-4">
                      <div className="shrink-0 rounded-lg bg-gold/10 p-2"><Icon className="size-5 text-gold-dark" /></div>
                      <div>
                        <h3 className="text-sm font-semibold">{item.title}</h3>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
