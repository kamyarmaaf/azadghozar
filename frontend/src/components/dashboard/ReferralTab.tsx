'use client';

import { useEffect, useState } from 'react';
import { useAuth, type ReferralRecord } from '@/stores/auth';
import { cn, toPersianNumber, formatPrice } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Gift,
  Copy,
  Check,
  Share2,
  Users,
  Wallet,
  Trophy,
  Star,
  Send,
  Percent,
  CreditCard,
  Sparkles,
  Link2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  Clock,
  UserPlus,
  PartyPopper,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const rewardTypeMap: Record<string, { label: string; icon: React.ElementType; color: string; bgColor: string }> = {
  discount: { label: 'تخفیف', icon: Percent, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  credit: { label: 'اعتبار', icon: CreditCard, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  gift: { label: 'هدیه ویژه', icon: Gift, color: 'text-amber-600', bgColor: 'bg-amber-50' },
};

const referralTiers = [
  {
    min: 0,
    max: 4,
    title: 'برنزی',
    color: 'from-amber-600 to-amber-700',
    textColor: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    reward: '۵۰۰,۰۰۰ تومان تخفیف به ازای هر دعوت',
    icon: '🥉',
  },
  {
    min: 5,
    max: 14,
    title: 'نقره‌ای',
    color: 'from-gray-400 to-gray-500',
    textColor: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    reward: '۷۰۰,۰۰۰ تومان به ازای هر دعوت + بازرسی رایگان',
    icon: '🥈',
  },
  {
    min: 15,
    max: 999,
    title: 'طلایی',
    color: 'from-yellow-500 to-amber-600',
    textColor: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-300',
    reward: '۱,۰۰۰,۰۰۰ تومان به ازای هر دعوت + خدمات VIP',
    icon: '🥇',
  },
];

export function ReferralTab() {
  const { currentUser, referral, claimReward, loadReferralState } = useAuth();
  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [showAllRecords, setShowAllRecords] = useState(false);

  useEffect(() => {
    void loadReferralState().catch(() => undefined);
  }, [loadReferralState]);

  if (!currentUser) return null;

  const referralLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/#register?ref=${currentUser.referralCode}`;
  const unclaimedRecords = referral.referralRecords.filter((r) => !r.rewardClaimed);
  const currentTier = referralTiers.find((t) => referral.referralCount >= t.min && referral.referralCount <= t.max) || referralTiers[0];
  const nextTier = referralTiers.find((t) => t.min > referral.referralCount);
  const progressToNext = nextTier
    ? ((referral.referralCount - currentTier.min) / (nextTier.min - currentTier.min)) * 100
    : 100;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentUser.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
  };

  const handleShare = async (method: string) => {
    const text = `با کد دعوت ${currentUser.referralCode} در آزادگذر ثبت‌نام کن و تخفیف بگیر! 🚗\n${referralLink}`;
    if (method === 'native' && navigator.share) {
      try {
        await navigator.share({ title: 'دعوت به آزادگذر', text, url: referralLink });
      } catch { /* user cancelled */ }
    } else if (method === 'telegram') {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`, '_blank');
    } else if (method === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
    setShareOpen(false);
  };

  const visibleRecords = showAllRecords ? referral.referralRecords : referral.referralRecords.slice(0, 4);

  return (
    <div className="space-y-6">
      {/* ====== Hero Card: Your Code ====== */}
      <Card className="overflow-hidden border-0 shadow-premium">
        <div className="bg-gradient-to-l from-brand to-brand/90 px-6 py-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="size-5 text-gold" />
            <span className="text-gold font-bold text-sm">کد دعوت اختصاصی شما</span>
            <Sparkles className="size-5 text-gold" />
          </div>
          <h2 className="text-white text-lg font-medium mb-4">
            این کد را به دوستانتان بدهید و از تخفیف‌ها بهره‌مند شوید
          </h2>
          <div className="flex items-center justify-center gap-3">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-8 py-4">
              <span className="text-white text-3xl md:text-4xl font-mono font-bold tracking-wider" dir="ltr">
                {currentUser.referralCode}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3 mt-5">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleCopyCode}
                    variant={copied ? 'default' : 'outline'}
                    className={cn(
                      'gap-2 backdrop-blur-sm transition-all',
                      copied
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500'
                        : 'bg-white/10 hover:bg-white/20 text-white border-white/30'
                    )}
                  >
                    {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                    {copied ? 'کپی شد!' : 'کپی کد'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>کد دعوت را کپی کنید</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button
              onClick={() => setShareOpen(true)}
              variant="outline"
              className="gap-2 backdrop-blur-sm bg-white/10 hover:bg-white/20 text-white border-white/30"
            >
              <Share2 className="size-4" />
              اشتراک‌گذاری
            </Button>
          </div>
        </div>
      </Card>

      {/* ====== Stats Row ====== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-2">
              <Users className="size-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold">{toPersianNumber(referral.referralCount)}</p>
            <p className="text-xs text-muted-foreground mt-1">دعوت موفق</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto mb-2">
              <Wallet className="size-5 text-emerald-600" />
            </div>
            <p className="text-lg font-bold">{formatPrice(referral.totalEarnings)}</p>
            <p className="text-xs text-muted-foreground mt-1">مجموع درآمد</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mx-auto mb-2">
              <CircleDollarSign className="size-5 text-amber-600" />
            </div>
            <p className="text-lg font-bold">{formatPrice(referral.availableCredit)}</p>
            <p className="text-xs text-muted-foreground mt-1">اعتبار قابل برداشت</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center mx-auto mb-2">
              <Trophy className="size-5 text-purple-600" />
            </div>
            <p className="text-lg font-bold">{unclaimedRecords.length}</p>
            <p className="text-xs text-muted-foreground mt-1">پاداش در انتظار</p>
          </CardContent>
        </Card>
      </div>

      {/* ====== Tier Progress ====== */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="size-5 text-gold" />
            سطح فعلی: {currentTier.icon} {currentTier.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-3">
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="text-muted-foreground">پیشرفت تا سطح بعدی</span>
              <span className="font-medium">
                {toPersianNumber(referral.referralCount)} / {toPersianNumber(nextTier ? nextTier.min : currentTier.max)}
              </span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full bg-gradient-to-l transition-all duration-500', currentTier.color)}
                style={{ width: `${progressToNext}%` }}
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">جایزه فعلی: </span>
            {currentTier.reward}
          </p>

          {/* Tiers Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
            {referralTiers.map((tier) => {
              const isActive = currentTier.title === tier.title;
              const isLocked = referral.referralCount < tier.min;
              return (
                <div
                  key={tier.title}
                  className={cn(
                    'rounded-xl border-2 p-4 transition-all',
                    isActive
                      ? `${tier.bgColor} ${tier.borderColor}`
                      : isLocked
                        ? 'border-muted bg-muted/30 opacity-60'
                        : 'border-border'
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{tier.icon}</span>
                    <Badge
                      variant={isActive ? 'default' : 'outline'}
                      className={cn(isActive && 'bg-gradient-to-l ' + tier.color + ' border-0 text-white')}
                    >
                      {tier.title}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{toPersianNumber(tier.min)} تا {toPersianNumber(tier.max)} دعوت</p>
                  <p className="text-xs mt-2 leading-5">{tier.reward}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ====== How It Works ====== */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <PartyPopper className="size-5 text-gold" />
            نحوه کارکرد سیستم دعوت
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                step: '۱',
                icon: Link2,
                title: 'کد خود را بفرستید',
                desc: 'کد اختصاصی یا لینک دعوت خود را برای دوستانتان ارسال کنید',
              },
              {
                step: '۲',
                icon: UserPlus,
                title: 'دوستانتان ثبت‌نام کنند',
                desc: 'دوستانتان با کد شما در آزادگذر ثبت‌نام می‌کنند',
              },
              {
                step: '۳',
                icon: Gift,
                title: 'تخفیف بگیرید',
                desc: 'هر دو شما و دوستتان تخفیف ویژه دریافت می‌کنید',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="flex flex-col items-center text-center gap-2">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-gold/10 flex items-center justify-center">
                      <Icon className="size-7 text-gold" />
                    </div>
                    <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center">
                      {item.step}
                    </span>
                  </div>
                  <p className="font-bold text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground leading-5">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ====== Referral Link Section ====== */}
      <Card className="shadow-card">
        <CardContent className="p-5">
          <p className="font-medium text-sm mb-3 flex items-center gap-2">
            <Link2 className="size-4 text-muted-foreground" />
            لینک دعوت شما
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-muted rounded-lg px-4 py-2.5 text-sm truncate" dir="ltr">
              {referralLink}
            </div>
            <Button variant="outline" size="sm" onClick={handleCopyLink} className="gap-1.5 shrink-0">
              <Copy className="size-3.5" />
              کپی
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ====== Referral Records ====== */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="size-5 text-muted-foreground" />
              تاریخچه دعوت‌ها
            </CardTitle>
            <Badge variant="secondary">{toPersianNumber(referral.referralRecords.length)} نفر</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {referral.referralRecords.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="size-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="font-medium text-muted-foreground">هنوز کسی را دعوت نکرده‌اید</p>
              <p className="text-sm text-muted-foreground mt-1">کد دعوت خود را به دوستانتان بفرستید!</p>
            </div>
          ) : (
            <>
              {visibleRecords.map((record) => (
                <ReferralRecordRow key={record.id} record={record} onClaim={claimReward} />
              ))}
              {referral.referralRecords.length > 4 && (
                <>
                  {!showAllRecords && (
                    <div className="p-3 text-center border-t">
                      <button
                        type="button"
                        onClick={() => setShowAllRecords(true)}
                        className="text-sm text-gold-dark hover:underline flex items-center gap-1 mx-auto"
                      >
                        مشاهده همه ({toPersianNumber(referral.referralRecords.length)} نفر)
                        <ChevronDown className="size-4" />
                      </button>
                    </div>
                  )}
                  {showAllRecords && (
                    <div className="p-3 text-center border-t">
                      <button
                        type="button"
                        onClick={() => setShowAllRecords(false)}
                        className="text-sm text-gold-dark hover:underline flex items-center gap-1 mx-auto"
                      >
                        بستن
                        <ChevronUp className="size-4" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ====== Share Dialog ====== */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="size-5" />
              اشتراک‌گذاری کد دعوت
            </DialogTitle>
            <DialogDescription>
              کد دعوت خود را از طریق روش‌های زیر برای دوستانتان ارسال کنید
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <Button
              onClick={() => handleShare('native')}
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
            >
              <Share2 className="size-6" />
              <span className="text-sm">اشتراک‌گذاری</span>
            </Button>
            <Button
              onClick={() => handleShare('telegram')}
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
            >
              <Send className="size-6 text-blue-500" />
              <span className="text-sm">تلگرام</span>
            </Button>
            <Button
              onClick={() => handleShare('whatsapp')}
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
            >
              <ExternalLink className="size-6 text-emerald-500" />
              <span className="text-sm">واتساپ</span>
            </Button>
            <Button
              onClick={handleCopyLink}
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
            >
              <Link2 className="size-6" />
              <span className="text-sm">کپی لینک</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---- Sub-component ---- */
function ReferralRecordRow({
  record,
  onClaim,
}: {
  record: ReferralRecord;
  onClaim: (id: string) => Promise<void>;
}) {
  const reward = rewardTypeMap[record.rewardType] || rewardTypeMap.discount;
  const RewardIcon = reward.icon;
  const [isClaiming, setIsClaiming] = useState(false);

  const handleClaim = async () => {
    setIsClaiming(true);
    try {
      await onClaim(record.id);
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
          <UserPlus className="size-5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{record.refereeName}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground" dir="ltr">{record.refereePhone}</span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">
              {new Date(record.createdAt).toLocaleDateString('fa-IR')}
            </span>
          </div>
        </div>
        <div className="text-left shrink-0">
          <div className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium', reward.bgColor, reward.color)}>
            <RewardIcon className="size-3.5" />
            {formatPrice(record.rewardValue)}
          </div>
        </div>
        <div className="shrink-0">
          {record.rewardClaimed ? (
            <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 text-[11px]">
              <Check className="size-3 ml-0.5" />
              دریافت شده
            </Badge>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-8 gap-1 text-gold-dark border-gold/40 hover:bg-gold/10"
              onClick={handleClaim}
              disabled={isClaiming}
            >
              <Gift className="size-3" />
              دریافت
            </Button>
          )}
        </div>
      </div>
      <Separator />
    </>
  );
}
