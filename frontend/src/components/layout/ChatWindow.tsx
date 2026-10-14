'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Bot,
  CircleUserRound,
  Headphones,
  LoaderCircle,
  MessageCircle,
  RotateCcw,
  Send,
  ShieldCheck,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  fetchSupportHistory,
  sendSupportMessage,
  type SupportMessage,
  type SupportSender,
} from '@/lib/support-chat-api';
import { useNavigation } from '@/stores/navigation';
import { cn } from '@/lib/utils';

interface ChatItem {
  id: string;
  sender: SupportSender;
  text: string;
  pending?: boolean;
}

const quickQuestions = [
  'چطور آگهی خودرو ثبت کنم؟',
  'تفاوت نمایشگاه و نمایندگی چیست؟',
  'فروش فوری و فروش ویژه چطور کار می‌کند؟',
];

const welcomeMessage: ChatItem = {
  id: 'welcome',
  sender: 'ai',
  text: 'سلام! من دستیار هوشمند آزادگذر هستم. درباره خرید و فروش خودرو، آگهی‌ها، حساب کاربری و خدمات سایت راهنمایی‌تان می‌کنم.',
};

function toChatItem(message: SupportMessage): ChatItem {
  return { id: String(message.id), sender: message.sender, text: message.text };
}

function SenderIcon({ sender }: { sender: SupportSender }) {
  if (sender === 'user') return <CircleUserRound className="size-3.5" />;
  if (sender === 'support') return <Headphones className="size-3.5" />;
  return <Bot className="size-3.5" />;
}

export function ChatWindow() {
  const { navigateTo } = useNavigation();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatItem[]>([welcomeMessage]);
  const [loaded, setLoaded] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const scrollAnchor = useRef<HTMLDivElement>(null);
  const historyRequested = useRef(false);
  const pendingSequence = useRef(0);

  useEffect(() => {
    if (!open || loaded || historyRequested.current) return;
    historyRequested.current = true;
    fetchSupportHistory()
      .then((result) => {
        setMessages(result.messages.length ? result.messages.map(toChatItem) : [welcomeMessage]);
        setLoaded(true);
        setError('');
      })
      .catch(() => {
        historyRequested.current = false;
        setError('تاریخچه گفتگو بارگذاری نشد؛ می‌توانید دوباره تلاش کنید.');
      });
  }, [loaded, open]);

  useEffect(() => {
    if (open) scrollAnchor.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open, sending]);

  const handleSendMessage = async (text = message) => {
    const cleanText = text.trim();
    if (!cleanText || sending) return;

    pendingSequence.current += 1;
    const temporaryId = `pending-${pendingSequence.current}`;
    setMessage('');
    setError('');
    setSending(true);
    setMessages((current) => [
      ...current,
      { id: temporaryId, sender: 'user', text: cleanText, pending: true },
    ]);

    try {
      const result = await sendSupportMessage(cleanText);
      setMessages((current) => [
        ...current.filter((item) => item.id !== temporaryId),
        toChatItem(result),
        toChatItem(result.reply),
      ]);
      setLoaded(true);
    } catch {
      setMessages((current) => current.filter((item) => item.id !== temporaryId));
      setMessage(cleanText);
      setError('ارسال پیام انجام نشد. اتصال اینترنت یا وضعیت سرور را بررسی کنید.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[70] sm:bottom-6 sm:right-6" dir="rtl">
      <section
        aria-label="پشتیبانی آنلاین هوش مصنوعی"
        aria-hidden={!open}
        className={cn(
          'absolute bottom-[4.5rem] right-0 flex h-[min(620px,calc(100vh-7rem))] w-[calc(100vw-2rem)] max-w-[390px] origin-bottom-right flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition duration-200',
          open
            ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
            : 'pointer-events-none translate-y-3 scale-95 opacity-0',
        )}
      >
        <header className="bg-gradient-brand px-4 py-3.5 text-white">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative grid size-10 shrink-0 place-items-center rounded-full bg-white/10">
                <Bot className="size-5 text-gold" />
                <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-navy bg-emerald-400" />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-bold">دستیار هوشمند آزادگذر</h2>
                <p className="mt-0.5 flex items-center gap-1 text-[11px] text-white/65">
                  <ShieldCheck className="size-3" /> پاسخ‌گویی آنلاین
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 text-white/70 hover:bg-white/10 hover:text-white"
              onClick={() => setOpen(false)}
              aria-label="بستن پنجره پشتیبانی"
            >
              <X className="size-4" />
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-slate-50/70 p-3.5 scrollbar-thin" aria-live="polite">
          {!loaded && !error && (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              <LoaderCircle className="ml-2 size-4 animate-spin" /> در حال دریافت گفتگو...
            </div>
          )}

          {(loaded || error) && (
            <div className="flex flex-col gap-3">
              {messages.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    'flex max-w-[88%] flex-col gap-1',
                    item.sender === 'user' ? 'self-end items-end' : 'self-start items-start',
                  )}
                >
                  <span className="flex items-center gap-1 px-1 text-[10px] text-muted-foreground">
                    <SenderIcon sender={item.sender} />
                    {item.sender === 'user'
                      ? 'شما'
                      : item.sender === 'support'
                        ? 'کارشناس پشتیبانی'
                        : 'دستیار هوشمند'}
                  </span>
                  <div
                    className={cn(
                      'whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-6 shadow-sm',
                      item.sender === 'user'
                        ? 'rounded-tr-md bg-navy text-white'
                        : 'rounded-tl-md border border-slate-200 bg-white text-foreground',
                      item.pending && 'opacity-60',
                    )}
                  >
                    {item.text}
                  </div>
                </div>
              ))}

              {messages.length === 1 && (
                <div className="mt-1 grid gap-1.5">
                  {quickQuestions.map((question) => (
                    <button
                      key={question}
                      type="button"
                      onClick={() => void handleSendMessage(question)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-right text-xs leading-5 text-slate-700 transition hover:border-gold hover:bg-amber-50"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              )}

              {sending && (
                <div className="flex items-center gap-2 self-start rounded-2xl rounded-tl-md border border-slate-200 bg-white px-3 py-2 text-xs text-muted-foreground shadow-sm">
                  <LoaderCircle className="size-3.5 animate-spin" /> در حال آماده‌کردن پاسخ...
                </div>
              )}
              <div ref={scrollAnchor} />
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center justify-between gap-2 border-t border-red-100 bg-red-50 px-3 py-2 text-[11px] text-red-700">
            <span>{error}</span>
            <button
              type="button"
              className="shrink-0 rounded-md p-1 hover:bg-red-100"
              onClick={() => {
                historyRequested.current = false;
                setLoaded(false);
                setError('');
              }}
              aria-label="تلاش دوباره"
            >
              <RotateCcw className="size-3.5" />
            </button>
          </div>
        )}

        <form
          className="border-t border-slate-200 bg-white p-3"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSendMessage();
          }}
        >
          <div className="flex gap-2">
            <Input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={2000}
              disabled={sending}
              placeholder="سؤالتان را بنویسید..."
              className="h-10 flex-1 rounded-xl text-sm"
              aria-label="متن پیام پشتیبانی"
            />
            <Button
              type="submit"
              size="icon"
              disabled={sending || !message.trim()}
              className="size-10 shrink-0 rounded-xl bg-gold text-navy hover:bg-gold-dark"
              aria-label="ارسال پیام"
            >
              {sending ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}
            </Button>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3 text-[10px] text-muted-foreground">
            <span>پاسخ‌ها خودکارند؛ اطلاعات حساس ارسال نکنید.</span>
            <button
              type="button"
              className="shrink-0 font-medium text-gold-dark hover:underline"
              onClick={() => {
                setOpen(false);
                navigateTo('contact');
              }}
            >
              پشتیبانی انسانی
            </button>
          </div>
        </form>
      </section>

      <Button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={cn(
          'relative size-14 rounded-full border-2 border-white shadow-xl transition hover:-translate-y-0.5 sm:size-16',
          open ? 'bg-navy text-white hover:bg-navy-light' : 'bg-gold text-navy hover:bg-gold-dark',
        )}
        size="icon"
        aria-expanded={open}
        aria-label={open ? 'بستن پشتیبانی آنلاین' : 'باز کردن پشتیبانی آنلاین هوش مصنوعی'}
      >
        {open ? <X className="size-6" /> : <MessageCircle className="size-7" />}
        {!open && <span className="absolute right-0 top-0 size-3 rounded-full border-2 border-white bg-emerald-500" />}
      </Button>
    </div>
  );
}
