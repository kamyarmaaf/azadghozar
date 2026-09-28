'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, RefreshCw, Send } from 'lucide-react';
import { useAuth } from '@/stores/auth';
import { getRealtimeAccessToken } from '@/lib/api';
import {
  fetchListingConversations,
  fetchListingMessages,
  openListingConversation,
  sendListingMessage,
  listingMessagesSocketUrl,
  MESSAGES_SOCKET_PROTOCOL,
  type ListingMessageEvent,
  type ListingConversation,
  type ListingMessage,
} from '@/lib/listing-messages-api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

function timeLabel(value: string): string {
  return new Intl.DateTimeFormat('fa-IR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

function mergeMessages(current: ListingMessage[], incoming: ListingMessage[]): ListingMessage[] {
  const byId = new Map(current.map((message) => [message.id, message]));
  for (const message of incoming) byId.set(message.id, message);
  return [...byId.values()].sort((a, b) => a.id - b.id);
}

function mergeConversations(current: ListingConversation[], incoming: ListingConversation[]): ListingConversation[] {
  const byId = new Map(current.map((item) => [item.id, item]));
  for (const item of incoming) {
    const previous = byId.get(item.id);
    if (!previous || Date.parse(item.last_message_at || item.created_at) >= Date.parse(previous.last_message_at || previous.created_at)) {
      byId.set(item.id, item);
    }
  }
  return [...byId.values()].sort((a, b) => Date.parse(b.last_message_at || b.created_at) - Date.parse(a.last_message_at || a.created_at));
}

export function ListingConversationsPanel({ listingId }: { listingId?: number }) {
  const userId = useAuth((state) => state.currentUser?.id);
  const [conversations, setConversations] = useState<ListingConversation[]>([]);
  const [selected, setSelected] = useState<ListingConversation | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState('');
  const [nextPage, setNextPage] = useState<number | null>(null);
  const [messages, setMessages] = useState<ListingMessage[]>([]);
  const [messagePage, setMessagePage] = useState(1);
  const [moreMessages, setMoreMessages] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageError, setMessageError] = useState('');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [liveStatus, setLiveStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const selectedId = selected?.id;
  const selectedIdRef = useRef(selectedId);
  useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);

  useEffect(() => {
    let active = true;
    if (listingId) {
      openListingConversation(listingId).then(
        (conversation) => {
          if (!active) return;
          setConversations([conversation]);
          setSelected(conversation);
          setListError('');
        },
        (reason) => { if (active) setListError(reason instanceof Error ? reason.message : 'گفتگو باز نشد.'); },
      ).finally(() => { if (active) setLoadingList(false); });
    } else {
      fetchListingConversations().then(
        (response) => {
          if (!active) return;
          setConversations((current) => mergeConversations(current, response.results));
          setNextPage(response.next ? 2 : null);
          setListError('');
        },
        (reason) => { if (active) setListError(reason instanceof Error ? reason.message : 'گفتگوها دریافت نشدند.'); },
      ).finally(() => { if (active) setLoadingList(false); });
    }
    return () => { active = false; };
  }, [listingId]);

  useEffect(() => {
    if (!userId) return;
    let stopped = false;
    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let heartbeatTimer: ReturnType<typeof setInterval> | undefined;
    let lastActivityAt = Date.now();
    let attempts = 0;
    let forceRefresh = false;

    async function connect() {
      const token = await getRealtimeAccessToken(forceRefresh);
      forceRefresh = false;
      if (stopped) return;
      if (!token) { scheduleReconnect(); return; }
      let activeSocket: WebSocket;
      try {
        activeSocket = new WebSocket(listingMessagesSocketUrl(), [MESSAGES_SOCKET_PROTOCOL, token]);
        socket = activeSocket;
      } catch {
        scheduleReconnect();
        return;
      }
      activeSocket.onopen = () => {
        attempts = 0;
        setLiveStatus('connected');
        lastActivityAt = Date.now();
        heartbeatTimer = setInterval(() => {
          if (Date.now() - lastActivityAt > 65_000) activeSocket.close();
        }, 20_000);
        // Reconcile events missed while the socket was disconnected.
        if (!listingId) {
          void fetchListingConversations().then((page) => {
            if (!stopped) setConversations((current) => mergeConversations(current, page.results));
          }).catch(() => {});
        }
        const conversationId = selectedIdRef.current;
        if (conversationId) {
          void fetchListingMessages(conversationId).then((page) => {
            if (!stopped && selectedIdRef.current === conversationId) {
              setMessages((current) => mergeMessages(current, page.results));
            }
          }).catch(() => {});
        }
      };
      activeSocket.onmessage = (event: MessageEvent) => {
        lastActivityAt = Date.now();
        try {
          const payload = JSON.parse(event.data) as ListingMessageEvent;
          if (payload.type !== 'message.created' || !Number.isInteger(payload.conversation_id) || !Number.isInteger(payload.message?.id)) return;
          const { conversation_id: conversationId, message } = payload;
          if (selectedIdRef.current === conversationId) {
            setMessages((current) => mergeMessages(current, [message]));
          }
          setConversations((current) => {
            if (current.some((item) => item.id === conversationId)) {
              return mergeConversations(current, current.filter((item) => item.id === conversationId).map((item) => ({
                ...item, last_message_text: message.text.slice(0, 200), last_message_at: message.created_at,
              })));
            }
            return current;
          });
          if (!listingId) {
            void fetchListingConversations().then((page) => {
              if (!stopped) setConversations((latest) => mergeConversations(latest, page.results));
            }).catch(() => {});
          }
        } catch { /* Ignore malformed events. */ }
      };
      activeSocket.onclose = (event) => {
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        if (stopped) return;
        if (event.code === 4401) forceRefresh = true;
        scheduleReconnect();
      };
      activeSocket.onerror = () => activeSocket.close();
    }

    function scheduleReconnect() {
      if (stopped) return;
      setLiveStatus('disconnected');
      const delay = Math.min(1000 * 2 ** attempts++, 30_000);
      reconnectTimer = setTimeout(() => void connect(), delay);
    }

    void connect();
    return () => {
      stopped = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      if (socket) {
        socket.onclose = null;
        socket.close();
      }
    };
  }, [userId, listingId]);

  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    const timer = window.setTimeout(() => {
      setLoadingMessages(true);
      setMessageError('');
      fetchListingMessages(selectedId).then(
        (response) => {
          if (!active) return;
          setMessages((current) => mergeMessages(current, response.results));
          setMessagePage(1);
          setMoreMessages(Boolean(response.next));
        },
        (reason) => { if (active) setMessageError(reason instanceof Error ? reason.message : 'پیام‌ها دریافت نشدند.'); },
      ).finally(() => { if (active) setLoadingMessages(false); });
    }, 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [selectedId]);

  async function reloadMessages() {
    if (!selected || loadingMessages) return;
    setLoadingMessages(true);
    try {
      const response = await fetchListingMessages(selected.id);
      setMessages((current) => mergeMessages(current, response.results));
      setMessagePage(1);
      setMoreMessages(Boolean(response.next));
      setMessageError('');
    } catch (reason) {
      setMessageError(reason instanceof Error ? reason.message : 'پیام‌ها دریافت نشدند.');
    } finally {
      setLoadingMessages(false);
    }
  }

  async function loadOlder() {
    if (!selected || !moreMessages || loadingMessages) return;
    setLoadingMessages(true);
    try {
      const response = await fetchListingMessages(selected.id, messagePage + 1);
      setMessages((previous) => mergeMessages(previous, response.results));
      setMessagePage((value) => value + 1);
      setMoreMessages(Boolean(response.next));
      setMessageError('');
    } catch (reason) {
      setMessageError(reason instanceof Error ? reason.message : 'پیام‌های قدیمی‌تر دریافت نشدند.');
    } finally {
      setLoadingMessages(false);
    }
  }

  async function loadMoreConversations() {
    if (!nextPage || loadingList) return;
    setLoadingList(true);
    try {
      const response = await fetchListingConversations(nextPage);
      setConversations((previous) => mergeConversations(previous, response.results));
      setNextPage(response.next ? nextPage + 1 : null);
      setListError('');
    } catch (reason) {
      setListError(reason instanceof Error ? reason.message : 'گفتگوها دریافت نشدند.');
    } finally {
      setLoadingList(false);
    }
  }

  async function send() {
    const text = draft.trim();
    if (!selected || !text || sending || loadingMessages) return;
    setSending(true);
    setMessageError('');
    try {
      const message = await sendListingMessage(selected.id, text);
      setMessages((previous) => mergeMessages(previous, [message]));
      setDraft('');
      setConversations((previous) => previous.map((item) => item.id === selected.id
        ? { ...item, last_message_text: message.text.slice(0, 200), last_message_at: message.created_at }
        : item));
    } catch (reason) {
      setMessageError(reason instanceof Error ? reason.message : 'ارسال پیام انجام نشد.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid min-h-80 gap-4 md:grid-cols-[240px_minmax(0,1fr)]" dir="rtl">
      <div className="max-h-[480px] space-y-2 overflow-y-auto border-b pb-3 md:border-b-0 md:border-l md:pl-3">
        <p className="mb-1 text-sm font-bold">گفتگوهای آگهی‌ها</p>
        <p role="status" className={`mb-3 text-xs ${liveStatus === 'connected' ? 'text-emerald-600' : 'text-muted-foreground'}`}>
          {liveStatus === 'connected' ? '● پیام‌های زنده فعال است' : liveStatus === 'connecting' ? 'در حال اتصال زنده...' : 'اتصال زنده قطع است؛ در حال تلاش دوباره'}
        </p>
        {loadingList && <p role="status" className="flex items-center gap-2 text-xs"><Loader2 className="size-4 animate-spin" /> در حال دریافت...</p>}
        {listError && <p role="alert" className="text-xs text-destructive">{listError}</p>}
        {!loadingList && !listError && conversations.length === 0 && <p className="text-xs text-muted-foreground">هنوز گفتگویی ندارید.</p>}
        {conversations.map((item) => <button key={item.id} type="button" onClick={() => { if (selected?.id !== item.id) { setSelected(item); setMessages([]); } }} className={`w-full rounded-xl border p-3 text-right text-xs ${selected?.id === item.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}>
          <span className="block font-semibold">{item.listing_title}</span>
          <span className="mt-1 block text-muted-foreground">{item.other_party_name}</span>
          <span className="mt-2 block truncate text-muted-foreground">{item.last_message_text || 'گفتگو را شروع کنید'}</span>
        </button>)}
        {nextPage && <Button variant="ghost" size="sm" disabled={loadingList} onClick={() => void loadMoreConversations()}>گفتگوهای بیشتر</Button>}
        {listError && !listingId && <Button variant="ghost" size="sm" onClick={() => { setLoadingList(true); void fetchListingConversations().then((response) => { setConversations(response.results); setNextPage(response.next ? 2 : null); setListError(''); }, (reason) => setListError(reason instanceof Error ? reason.message : 'دریافت گفتگوها ناموفق بود.')).finally(() => setLoadingList(false)); }}>تلاش دوباره</Button>}
      </div>
      <div className="flex min-w-0 flex-col">
        {!selected ? <p className="m-auto text-center text-sm text-muted-foreground">برای مشاهده پیام‌ها یک گفتگو انتخاب کنید.</p> : <>
          <div className="mb-2 flex items-center justify-between gap-2 border-b pb-2">
            <div><p className="text-sm font-semibold">{selected.listing_title}</p><p className="text-xs text-muted-foreground">{selected.other_party_name}</p></div>
            <Button type="button" size="icon" variant="ghost" onClick={() => void reloadMessages()} title="به‌روزرسانی پیام‌ها"><RefreshCw className="size-4" /></Button>
          </div>
          <div className="max-h-[340px] min-h-48 flex-1 space-y-3 overflow-y-auto py-3">
            {moreMessages && <Button variant="ghost" size="sm" disabled={loadingMessages} onClick={() => void loadOlder()}>پیام‌های قدیمی‌تر</Button>}
            {loadingMessages && <p role="status" className="text-xs text-muted-foreground">در حال دریافت پیام‌ها...</p>}
            {messageError && <p role="alert" className="text-xs text-destructive">{messageError}</p>}
            {!loadingMessages && messages.length === 0 && !messageError && <p className="text-xs text-muted-foreground">هنوز پیامی ارسال نشده است.</p>}
            {messages.map((message) => <div key={message.id} className={`max-w-[85%] rounded-xl p-3 text-sm ${message.sender_id === userId ? 'ml-auto bg-primary text-primary-foreground' : 'mr-auto bg-muted'}`}>
              <p className="whitespace-pre-wrap break-words">{message.text}</p>
              <p className="mt-1 text-[10px] opacity-70">{timeLabel(message.created_at)}</p>
            </div>)}
          </div>
          <form onSubmit={(event) => { event.preventDefault(); void send(); }} className="mt-3 flex items-end gap-2 border-t pt-3">
            <Textarea value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={2000} placeholder="متن پیام را بنویسید..." rows={2} aria-label="متن پیام" />
            <Button type="submit" disabled={sending || loadingMessages || !draft.trim()}>{sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} ارسال</Button>
          </form>
        </>}
      </div>
    </div>
  );
}
