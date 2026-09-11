'use client';

import { Phone, Clock, Instagram, Twitter, Linkedin, Youtube, UserPlus, LogIn, LogOut, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useNavigation } from '@/stores/navigation';
import { useAuth, roleLabels } from '@/stores/auth';
import { cn } from '@/lib/utils';

export function TopBar() {
  const { navigateTo } = useNavigation();
  const { isAuthenticated, currentUser, logout, _hasHydrated } = useAuth();

  return (
    <div className="bg-gradient-navy text-white/80 text-xs py-1.5 hidden md:block">
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Right side: phone & support hours */}
        <div className="flex items-center gap-6">
          <a
            href="tel:02191009100"
            className="flex items-center gap-1.5 hover:text-powder transition-colors"
            dir="ltr"
          >
            <Phone className="size-3" />
            <span>۰۲۱-۹۱۰۰۹۱۰۰</span>
          </a>
          <div className="flex items-center gap-1.5">
            <Clock className="size-3" />
            <span>شنبه تا پنجشنبه ۹ تا ۲۱</span>
          </div>
        </div>

        {/* Left side: social & auth */}
        <div className="flex items-center gap-4">
          {/* Social icons */}
          <div className="flex items-center gap-2">
            <a href="#" className="hover:text-powder transition-colors p-1" aria-label="اینستاگرام">
              <Instagram className="size-3.5" />
            </a>
            <a href="#" className="hover:text-powder transition-colors p-1" aria-label="توییتر">
              <Twitter className="size-3.5" />
            </a>
            <a href="#" className="hover:text-powder transition-colors p-1" aria-label="لینکدین">
              <Linkedin className="size-3.5" />
            </a>
            <a href="#" className="hover:text-powder transition-colors p-1" aria-label="یوتیوب">
              <Youtube className="size-3.5" />
            </a>
          </div>

          {/* Separator */}
          <div className="w-px h-4 bg-white/20" />

          {/* Auth buttons */}
          {_hasHydrated && isAuthenticated && currentUser ? (
            <div className="flex items-center gap-3">
              <button
                className="flex items-center gap-1.5 hover:text-powder transition-colors"
                onClick={() => navigateTo(currentUser.dashboardPage as any)}
              >
                <Avatar className="size-4 bg-powder/30">
                  <AvatarFallback className="text-[8px] font-bold text-powder bg-transparent">
                    {currentUser.avatar}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{currentUser.name}</span>
                <span className="text-white/40">({roleLabels[currentUser.role]})</span>
              </button>
              <div className="w-px h-4 bg-white/20" />
              <button
                className="flex items-center gap-1 hover:text-red-400 transition-colors"
                onClick={logout}
              >
                <LogOut className="size-3" />
                <span>خروج</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-white/80 hover:text-white hover:bg-white/10"
                onClick={() => navigateTo('login')}
              >
                <LogIn className="size-3" />
                <span>ورود</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-white/80 hover:text-white hover:bg-white/10"
                onClick={() => navigateTo('register')}
              >
                <UserPlus className="size-3" />
                <span>ثبت‌نام</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}