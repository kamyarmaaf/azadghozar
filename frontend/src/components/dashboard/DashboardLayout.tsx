'use client';

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Loader2, RefreshCw, ShieldCheck } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn, toPersianNumber } from '@/lib/utils';

export interface DashboardStatItem {
  label: string;
  value: number | string | null | undefined;
  icon: LucideIcon;
  color?: string;
  hint?: string;
}

export function DashboardHeader({
  title,
  subtitle,
  avatar,
  badge,
  actions,
}: {
  title: string;
  subtitle: string;
  avatar?: string;
  badge?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <Avatar className="size-12">
          <AvatarFallback className="bg-gradient-brand text-sm font-bold text-white">
            {avatar || 'آ'}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold">{title}</h1>
            {badge && (
              <Badge variant="secondary" className="gap-1">
                <ShieldCheck className="size-3.5" />
                {badge}
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function DashboardStats({
  items,
  loading = false,
}: {
  items: DashboardStatItem[];
  loading?: boolean;
}) {
  return (
    <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
      {items.map((item) => {
        const Icon = item.icon;
        const value = typeof item.value === 'number'
          ? toPersianNumber(item.value)
          : item.value ?? '—';
        return (
          <Card key={item.label} className="shadow-card transition-shadow hover:shadow-md">
            <CardContent className="p-4">
              <div className={cn('mb-3 flex size-10 items-center justify-center rounded-xl bg-muted text-foreground', item.color)}>
                <Icon className="size-5" />
              </div>
              <p className="min-h-8 text-2xl font-bold">
                {loading ? <Loader2 className="size-5 animate-spin text-muted-foreground" /> : value}
              </p>
              <p className="text-xs text-muted-foreground">{item.label}</p>
              {item.hint && <p className="mt-1 text-[11px] text-muted-foreground/80">{item.hint}</p>}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export function DashboardError({ message, onRetry }: { message: string; onRetry: () => void }) {
  if (!message) return null;
  return (
    <div role="alert" className="mb-6 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
      <span>{message}</span>
      <Button size="sm" variant="outline" className="gap-1" onClick={onRetry}>
        <RefreshCw className="size-3.5" />
        تلاش دوباره
      </Button>
    </div>
  );
}
