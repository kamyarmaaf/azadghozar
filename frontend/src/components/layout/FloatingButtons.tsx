'use client';

import { useState } from 'react';
import {
  Phone,
  MessageCircle,
  X,
  Send,
  Search,
  FileText,
  ClipboardCheck,
  HelpCircle,
  ShoppingCart,
  Tag,
  Bot,
  Headphones,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigation } from '@/stores/navigation';
import { cn } from '@/lib/utils';

interface SocialButton {
  label: string;
  icon: React.ElementType;
  href: string;
  bgColor: string;
  hoverColor: string;
}

const socialButtons: SocialButton[] = [
  {
    label: 'واتساپ',
    icon: WhatsAppIcon,
    href: 'https://wa.me/989109100910',
    bgColor: 'bg-green-500',
    hoverColor: 'hover:bg-green-600',
  },
  {
    label: 'تلگرام',
    icon: TelegramIcon,
    href: 'https://t.me/azadgozar',
    bgColor: 'bg-sky-500',
    hoverColor: 'hover:bg-sky-600',
  },
  {
    label: 'بله',
    icon: BaleIcon,
    href: 'https://bale.ai/azadgozar',
    bgColor: 'bg-yellow-500',
    hoverColor: 'hover:bg-yellow-600',
  },
  {
    label: 'تماس تلفنی',
    icon: Phone,
    href: 'tel:02191009100',
    bgColor: 'bg-brand',
    hoverColor: 'hover:bg-brand-light',
  },
];

interface ChatOption {
  label: string;
  icon: React.ElementType;
  pageId?: string;
  description: string;
}

const chatOptions: ChatOption[] = [
  { label: 'جستجوی خودرو', icon: Search, pageId: 'buy', description: 'پیدا کردن خودروی دلخواه' },
  { label: 'ثبت آگهی', icon: Tag, pageId: 'sell', description: 'ثبت آگهی فروش خودرو' },
  { label: 'درخواست بازرسی', icon: ClipboardCheck, pageId: 'inspection', description: 'بازرسی تخصصی خودرو' },
  { label: 'مشاوره خرید', icon: ShoppingCart, pageId: 'consultation', description: 'راهنمایی در خرید خودرو' },
  { label: 'مشاوره فروش', icon: FileText, pageId: 'sell', description: 'قیمت‌گذاری و فروش خودرو' },
  { label: 'پیگیری درخواست', icon: HelpCircle, pageId: 'contact', description: 'پیگیری وضعیت درخواست' },
  { label: 'تماس با پشتیبانی', icon: Phone, pageId: 'contact', description: 'صحبت با کارشناسان ما' },
];

export function FloatingButtons() {
  const { navigateTo } = useNavigation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<{ text: string; isBot: boolean }[]>([
    { text: 'سلام! به آزاد گذر خوش آمدید. چطور می‌تونم کمکتون کنم؟', isBot: true },
  ]);

  const closeAll = () => {
    setMenuOpen(false);
    setChatOpen(false);
  };

  const handleMainToggle = () => {
    if (chatOpen) {
      setChatOpen(false);
    } else if (menuOpen) {
      setMenuOpen(false);
    } else {
      setMenuOpen(true);
    }
  };

  const openChat = () => {
    setMenuOpen(false);
    setChatOpen(true);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    const userMsg = message.trim();
    setMessage('');
    setMessages((prev) => [...prev, { text: userMsg, isBot: false }]);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          text: 'پیام شما دریافت شد. کارشناسان ما در اسرع وقت با شما تماس خواهند گرفت.',
          isBot: true,
        },
      ]);
    }, 800);
  };

  const handleOptionClick = (option: ChatOption) => {
    setMessages((prev) => [
      ...prev,
      { text: option.label, isBot: false },
      {
        text: `باشه! شما رو به بخش "${option.label}" هدایت می‌کنم.`,
        isBot: true,
      },
    ]);
    if (option.pageId) navigateTo(option.pageId as never);
  };

  return (
    <div className="fixed bottom-6 left-4 z-50 flex flex-col items-start gap-3">
      {/* Chat Window */}
      <div
        className={cn(
          'absolute bottom-16 left-0 w-80 sm:w-96 bg-white rounded-2xl shadow-premium-lg border border-border-light overflow-hidden transition-all duration-300 origin-bottom-left',
          chatOpen
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-95 pointer-events-none'
        )}
      >
        <div className="bg-gradient-brand text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gold/20 flex items-center justify-center">
              <Bot className="size-5 text-gold" />
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
            onClick={closeAll}
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="h-64 overflow-y-auto p-4 flex flex-col gap-3 scrollbar-thin">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={cn(
                'max-w-[85%] px-3 py-2 rounded-xl text-sm leading-6',
                msg.isBot
                  ? 'bg-muted text-text-primary self-start rounded-tl-sm'
                  : 'bg-brand text-white self-end rounded-tr-sm'
              )}
            >
              {msg.text}
            </div>
          ))}

          {messages.length <= 2 && (
            <div className="flex flex-col gap-1.5 mt-2">
              {chatOptions.map((option) => (
                <button
                  key={option.label}
                  onClick={() => handleOptionClick(option)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border-light hover:border-gold/50 hover:bg-gold/5 transition-all text-right group"
                >
                  <option.icon className="size-4 text-gold-dark group-hover:text-gold transition-colors flex-shrink-0" />
                  <div>
                    <span className="text-sm font-medium text-text-primary block">{option.label}</span>
                    <span className="text-xs text-text-muted">{option.description}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleSendMessage} className="border-t border-border-light p-3 flex gap-2">
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
            className="h-9 w-9 rounded-lg bg-gold hover:bg-gold-dark text-brand flex-shrink-0"
          >
            <Send className="size-4" />
          </Button>
        </form>
      </div>

      {/* Social Menu */}
      <div
        className={cn(
          'flex flex-col gap-2 transition-all duration-300',
          menuOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4 pointer-events-none'
        )}
      >
        {socialButtons.map((btn) => (
          <a
            key={btn.label}
            href={btn.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={btn.label}
            className={cn(
              'w-11 h-11 rounded-full flex items-center justify-center text-white shadow-lg transition-all hover:scale-110',
              btn.bgColor,
              btn.hoverColor
            )}
          >
            <btn.icon className="size-5" />
          </a>
        ))}

        <button
          onClick={openChat}
          className="w-11 h-11 rounded-full flex items-center justify-center text-white bg-gold hover:bg-gold-dark shadow-lg transition-all hover:scale-110"
          aria-label="چت آنلاین"
        >
          <Headphones className="size-5" />
        </button>
      </div>

      {/* Main Toggle */}
      <Button
        onClick={handleMainToggle}
        className={cn(
          'w-14 h-14 rounded-full shadow-premium-lg transition-all duration-300 hover-lift',
          chatOpen
            ? 'bg-brand hover:bg-brand-light text-white'
            : menuOpen
              ? 'bg-brand hover:bg-brand-light text-white rotate-180'
              : 'bg-gold hover:bg-gold-dark text-brand animate-pulse-glow'
        )}
        size="icon"
        aria-label={chatOpen ? 'بستن چت' : menuOpen ? 'بستن' : 'پشتیبانی و چت'}
      >
        {chatOpen ? (
          <X className="size-6" />
        ) : menuOpen ? (
          <X className="size-6" />
        ) : (
          <MessageCircle className="size-6" />
        )}
      </Button>
    </div>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

function BaleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm4 0h-2v-6h2v6zm-3-8c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
    </svg>
  );
}
