'use client';

import { useState } from 'react';
import {
  MessageCircle,
  X,
  Send,
  Search,
  FileText,
  ClipboardCheck,
  HelpCircle,
  ShoppingCart,
  Tag,
  Phone,
  Bot,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigation } from '@/stores/navigation';
import { cn } from '@/lib/utils';

interface ChatOption {
  label: string;
  icon: React.ElementType;
  pageId?: string;
  description: string;
}

const chatOptions: ChatOption[] = [
  {
    label: 'جستجوی خودرو',
    icon: Search,
    pageId: 'buy',
    description: 'پیدا کردن خودروی دلخواه',
  },
  {
    label: 'ثبت آگهی',
    icon: Tag,
    pageId: 'sell',
    description: 'ثبت آگهی فروش خودرو',
  },
  {
    label: 'درخواست بازرسی',
    icon: ClipboardCheck,
    pageId: 'inspection',
    description: 'بازرسی تخصصی خودرو',
  },
  {
    label: 'مشاوره خرید',
    icon: ShoppingCart,
    pageId: 'consultation',
    description: 'راهنمایی در خرید خودرو',
  },
  {
    label: 'مشاوره فروش',
    icon: FileText,
    pageId: 'sell',
    description: 'قیمت‌گذاری و فروش خودرو',
  },
  {
    label: 'پیگیری درخواست',
    icon: HelpCircle,
    pageId: 'contact',
    description: 'پیگیری وضعیت درخواست',
  },
  {
    label: 'تماس با پشتیبانی',
    icon: Phone,
    pageId: 'contact',
    description: 'صحبت با کارشناسان ما',
  },
];

export function ChatWindow() {
  const { navigateTo } = useNavigation();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<
    { text: string; isBot: boolean }[]
  >([
    {
      text: 'سلام! به آزاد گذر خوش آمدید. چطور می‌تونم کمکتون کنم؟',
      isBot: true,
    },
  ]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMsg = message.trim();
    setMessage('');
    setMessages((prev) => [...prev, { text: userMsg, isBot: false }]);

    // Simulated bot response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          text: 'پیام شما دریافت شد. کارشناسان ما در اسرع وقت با شما تماس خواهند گرفت. در حال حاضر می‌تونید از گزینه‌های زیر استفاده کنید.',
          isBot: true,
        },
      ]);
    }, 800);
  };

  const handleOptionClick = (option: ChatOption) => {
    setMessages((prev) => [
      ...prev,
      { text: option.label, isBot: false },
    ]);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          text: `باشه! شما رو به بخش "${option.label}" هدایت می‌کنم.`,
          isBot: true,
        },
      ]);
      if (option.pageId) {
        navigateTo(option.pageId as never);
      }
    }, 500);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat panel */}
      <div
        className={cn(
          'absolute bottom-16 right-0 w-80 sm:w-96 bg-white rounded-2xl shadow-premium-lg border border-silver-light overflow-hidden transition-all duration-300 origin-bottom-right',
          open
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-95 pointer-events-none'
        )}
      >
        {/* Header */}
        <div className="bg-gradient-navy text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-powder/20 flex items-center justify-center">
              <Bot className="size-5 text-powder" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">چت آنلاین</h3>
              <p className="text-xs text-white/60">پشتیبانی آزاد گذر</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white/70 hover:text-white hover:bg-white/10 h-8 w-8"
            onClick={() => setOpen(false)}
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Messages area */}
        <div className="h-64 overflow-y-auto p-4 flex flex-col gap-3 scrollbar-thin">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={cn(
                'max-w-[85%] px-3 py-2 rounded-xl text-sm leading-6',
                msg.isBot
                  ? 'bg-secondary text-foreground self-start rounded-tr-sm'
                  : 'bg-powder text-navy self-end rounded-tl-sm'
              )}
            >
              {msg.text}
            </div>
          ))}

          {/* Quick options - show after last bot message */}
          {messages.length <= 2 && (
            <div className="flex flex-col gap-1.5 mt-2">
              {chatOptions.map((option) => (
                <button
                  key={option.label}
                  onClick={() => handleOptionClick(option)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-silver-light hover:border-powder hover:bg-powder/5 transition-all text-right group"
                >
                  <option.icon className="size-4 text-powder-dark group-hover:text-powder transition-colors flex-shrink-0" />
                  <div>
                    <span className="text-sm font-medium text-foreground block">
                      {option.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {option.description}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Input area */}
        <form
          onSubmit={handleSendMessage}
          className="border-t border-silver-light p-3 flex gap-2"
        >
          <Input
            type="text"
            placeholder="پیام خود را بنویسید..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 h-9 text-sm rounded-lg"
          />
          <Button
            type="submit"
            size="icon"
            className="h-9 w-9 rounded-lg bg-powder hover:bg-powder-dark text-navy flex-shrink-0"
          >
            <Send className="size-4" />
          </Button>
        </form>
      </div>

      {/* Toggle button */}
      <Button
        onClick={() => setOpen(!open)}
        className={cn(
          'w-14 h-14 rounded-full shadow-premium-lg transition-all duration-300 hover-lift',
          open
            ? 'bg-navy hover:bg-navy-light text-white'
            : 'bg-powder hover:bg-powder-dark text-navy animate-pulse-glow'
        )}
        size="icon"
        aria-label={open ? 'بستن چت' : 'چت آنلاین'}
      >
        {open ? (
          <X className="size-6" />
        ) : (
          <MessageCircle className="size-6" />
        )}
      </Button>
    </div>
  );
}
