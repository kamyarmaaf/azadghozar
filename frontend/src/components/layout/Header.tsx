'use client';

import React, { useState, useEffect, Fragment } from 'react';
import {
  PlusCircle,
  User,
  Heart,
  GitCompareArrows,
  Menu,
  ChevronDown,
  LogOut,
  LayoutDashboard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useNavigation, type PageId } from '@/stores/navigation';
import { useAuth, roleLabels } from '@/stores/auth';
import { useComparison } from '@/stores/comparison';
import { cn } from '@/lib/utils';
import { OptimizedImage } from '@/components/ui/optimized-image';

interface NavItem {
  label: string;
  pageId?: PageId;
  children?: { label: string; pageId: PageId }[];
}

const navItems: NavItem[] = [
  { label: 'خانه', pageId: 'home' },
  {
    label: 'خرید خودرو',
    children: [
      { label: 'همه خودروها', pageId: 'buy' },
      { label: 'فروش فوری', pageId: 'instant-sale' },
      { label: 'فروش ویژه', pageId: 'special-sale' },
    ],
  },
  { label: 'فروش خودرو', pageId: 'sell' },
  {
    label: 'خدمات',
    children: [
      { label: 'انتقال مالکیت', pageId: 'ownership-transfer' },
      { label: 'حمل و نقل', pageId: 'transportation' },
      { label: 'درخواست بازرسی', pageId: 'inspection' },
      { label: 'مشاوره تخصصی', pageId: 'consultation' },
    ],
  },
  { label: 'تعرفه‌ها', pageId: 'tariffs' },
  { label: 'نمایندگی‌ها', pageId: 'dealerships' },
  { label: 'گالری‌ها', pageId: 'galleries' },
  { label: 'شناسنامه هوشمند', pageId: 'smart-id' },
  {
    label: 'وبلاگ',
    children: [
      { label: 'وبلاگ', pageId: 'blog' },
      { label: 'ویدیوهای بررسی', pageId: 'videos' },
    ],
  },
];

export function Header() {
  const { navigateTo } = useNavigation();
  const { isAuthenticated, currentUser, logout, _hasHydrated } = useAuth();
  const comparisonCount = useComparison((state) => state.selectedIds.length);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-40 transition-all duration-300',
        scrolled
          ? 'glass shadow-sm'
          : 'bg-white'
      )}
    >
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <button
            onClick={() => navigateTo('home')}
            className="flex-shrink-0 flex items-center gap-2.5"
          >
            <OptimizedImage src="/logo.png" alt="آزاد گذر" width={144} height={48} sizes="108px" className="h-9 w-auto object-contain" priority />
            <span className="text-lg font-extrabold text-gradient-dark hidden sm:inline">
              آزاد گذر
            </span>
          </button>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {navItems.map((item) => (
              <div key={item.label}>
                {item.children ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-1 px-3 py-2 text-sm text-text-secondary hover:text-text-primary rounded-lg hover:bg-muted transition-colors whitespace-nowrap">
                        <span>{item.label}</span>
                        <ChevronDown className="size-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className="bg-white border-border-light min-w-[180px] shadow-premium-lg text-right"
                    >
                      {item.children.map((child) => (
                        <DropdownMenuItem
                          key={child.pageId}
                          onClick={() => navigateTo(child.pageId)}
                          className="text-text-secondary hover:text-text-primary hover:bg-muted cursor-pointer focus:bg-muted focus:text-text-primary justify-end"
                        >
                          {child.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <button
                    onClick={() => item.pageId && navigateTo(item.pageId)}
                    className="px-3 py-2 text-sm text-text-secondary hover:text-text-primary rounded-lg hover:bg-muted transition-colors whitespace-nowrap"
                  >
                    {item.label}
                  </button>
                )}
              </div>
            ))}
          </nav>

          {/* Action buttons - desktop */}
          <div className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => navigateTo('sell')}
              className="inline-flex items-center justify-center gap-2 h-9 px-5 text-sm font-semibold rounded-lg bg-brand text-white hover:bg-brand-light transition-colors"
            >
              <PlusCircle className="size-4" />
              <span>ثبت آگهی</span>
            </button>

            <Button
              variant="ghost"
              size="icon"
              className="text-text-secondary hover:text-text-primary hover:bg-muted"
              onClick={() => navigateTo('favorites')}
            >
              <Heart className="size-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="relative text-text-secondary hover:text-text-primary hover:bg-muted"
              onClick={() => navigateTo('comparison')}
              aria-label="مقایسه خودروها"
            >
              <GitCompareArrows className="size-5" />
              {comparisonCount > 0 && (
                <span className="absolute -top-0.5 -left-0.5 min-w-4 h-4 px-1 rounded-full bg-brand text-white text-[10px] flex items-center justify-center">
                  {comparisonCount}
                </span>
              )}
            </Button>

            {_hasHydrated && isAuthenticated && currentUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-9 px-2 gap-2 text-text-secondary hover:text-text-primary hover:bg-muted"
                  >
                    <Avatar className="size-7 bg-muted">
                      <AvatarFallback className="text-[11px] font-bold text-brand bg-gold-light/50">
                        {currentUser.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium hidden xl:inline max-w-[80px] truncate">
                      {currentUser.name}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="bg-white border-border-light text-text-primary min-w-[200px] shadow-premium-lg text-right">
                  <DropdownMenuItem className="flex items-center gap-3 px-3 py-2.5">
                    <Avatar className="size-8 bg-muted">
                      <AvatarFallback className="text-sm font-bold text-brand bg-gold-light/50">
                        {currentUser.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">{currentUser.name}</span>
                      <span className="text-[11px] text-text-muted">
                        {roleLabels[currentUser.role]}
                      </span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border-light" />
                  <DropdownMenuItem
                    onClick={() => navigateTo(currentUser.dashboardPage as PageId)}
                    className="text-text-secondary hover:text-text-primary hover:bg-muted cursor-pointer focus:bg-muted"
                  >
                    <LayoutDashboard className="size-4 ml-2" />
                    داشبورد
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigateTo('favorites')}
                    className="text-text-secondary hover:text-text-primary hover:bg-muted cursor-pointer focus:bg-muted"
                  >
                    <Heart className="size-4 ml-2" />
                    مورد علاقه‌ها
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border-light" />
                  <DropdownMenuItem
                    onClick={logout}
                    className="text-danger hover:text-danger hover:bg-red-50 cursor-pointer focus:bg-red-50 focus:text-danger"
                  >
                    <LogOut className="size-4 ml-2" />
                    خروج از حساب
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="text-text-secondary hover:text-text-primary hover:bg-muted"
                onClick={() => navigateTo('login')}
              >
                <User className="size-5" />
              </Button>
            )}
          </div>

          {/* Mobile menu trigger */}
          <div className="flex lg:hidden items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="relative text-text-secondary hover:text-text-primary hover:bg-muted"
              onClick={() => navigateTo('comparison')}
              aria-label="مقایسه خودروها"
            >
              <GitCompareArrows className="size-5" />
              {comparisonCount > 0 && (
                <span className="absolute -top-0.5 -left-0.5 min-w-4 h-4 px-1 rounded-full bg-brand text-white text-[10px] flex items-center justify-center">
                  {comparisonCount}
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-text-secondary hover:text-text-primary hover:bg-muted"
              onClick={() => navigateTo('login')}
            >
              <User className="size-5" />
            </Button>
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-text-secondary hover:text-text-primary hover:bg-muted"
                >
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 bg-white border-border-light overflow-y-auto p-0">
                <SheetHeader className="p-5 border-b border-border-light">
                  <SheetTitle className="text-right text-text-primary flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <OptimizedImage src="/logo.png" alt="آزاد گذر" width={128} height={44} sizes="96px" className="h-8 w-auto object-contain" />
                      <span className="text-lg font-extrabold text-gradient-dark">آزاد گذر</span>
                    </div>
                  </SheetTitle>
                </SheetHeader>

                {/* Mobile nav items */}
                <nav className="flex flex-col p-3">
                  {navItems.map((item) =>
                    item.label === 'خرید خودرو' && item.children ? (
                      <Fragment key={item.label}>
                        <button
                          onClick={() => { navigateTo('buy'); setMobileOpen(false); }}
                          className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-text-primary hover:bg-muted rounded-lg transition-colors"
                        >
                          <span>{item.label}</span>
                        </button>
                        {item.children.map((child) => (
                          <button
                            key={child.pageId}
                            onClick={() => { navigateTo(child.pageId); setMobileOpen(false); }}
                            className="text-right pr-6 pl-3 py-2 text-sm text-text-muted hover:text-text-primary hover:bg-muted rounded-lg transition-colors"
                          >
                            {child.label}
                          </button>
                        ))}
                      </Fragment>
                    ) : item.children ? (
                      <div key={item.label}>
                        <MobileSubmenu item={item} onClose={() => setMobileOpen(false)} />
                      </div>
                    ) : (
                      <button
                        key={item.label}
                        onClick={() => {
                          if (item.pageId) navigateTo(item.pageId);
                          setMobileOpen(false);
                        }}
                        className="flex items-center justify-between w-full px-3 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-muted rounded-lg transition-colors"
                      >
                        <span>{item.label}</span>
                      </button>
                    )
                  )}
                </nav>

                {/* Mobile action buttons */}
                <div className="p-5 border-t border-border-light flex flex-col gap-2">
                  <button
                    onClick={() => {
                      navigateTo('sell');
                      setMobileOpen(false);
                    }}
                    className="inline-flex items-center justify-center gap-2 w-full h-10 text-sm font-semibold rounded-lg bg-brand text-white hover:bg-brand-light transition-colors"
                  >
                    <PlusCircle className="size-4" />
                    <span>ثبت آگهی خودرو</span>
                  </button>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 border-border-light text-text-secondary hover:text-text-primary hover:bg-muted"
                      onClick={() => {
                        navigateTo('login');
                        setMobileOpen(false);
                      }}
                    >
                      ورود
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 border-border-light text-text-secondary hover:text-text-primary hover:bg-muted"
                      onClick={() => {
                        navigateTo('register');
                        setMobileOpen(false);
                      }}
                    >
                      ثبت‌نام
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}

/* Mobile submenu component */
function MobileSubmenu({
  item,
  onClose,
}: {
  item: NavItem;
  onClose: () => void;
}) {
  const { navigateTo } = useNavigation();
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-3 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-muted rounded-lg transition-colors"
      >
        <span>{item.label}</span>
        <ChevronDown
          className={cn(
            'size-4 transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>
      {open && item.children && (
        <div className="pr-4 flex flex-col gap-0.5">
          {item.children.map((child) => (
            <button
              key={child.pageId}
              onClick={() => {
                navigateTo(child.pageId);
                onClose();
              }}
              className="text-right px-3 py-2 text-sm text-text-muted hover:text-text-primary hover:bg-muted rounded-lg transition-colors"
            >
              {child.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
