import { apiRequest } from '@/lib/api';

const SUPPORT_SESSION_KEY = 'azadgozar-support-session';

export type SupportSender = 'user' | 'ai' | 'support';

export interface SupportMessage {
  id: number;
  sender: SupportSender;
  text: string;
  created_at: string;
}

export interface SupportChatHistory {
  conversation_id: string | null;
  messages: SupportMessage[];
  ai_enabled: boolean;
}

export interface SupportChatReply extends SupportMessage {
  reply: SupportMessage;
  conversation_id: string;
  ai_enabled: boolean;
}

function createSessionId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (value) => {
    const random = crypto.getRandomValues(new Uint8Array(1))[0] % 16;
    const digit = value === 'x' ? random : (random & 0x3) | 0x8;
    return digit.toString(16);
  });
}

export function getSupportSessionId(): string {
  const current = window.localStorage.getItem(SUPPORT_SESSION_KEY);
  if (current) return current;
  const sessionId = createSessionId();
  window.localStorage.setItem(SUPPORT_SESSION_KEY, sessionId);
  return sessionId;
}

export function fetchSupportHistory() {
  const sessionId = encodeURIComponent(getSupportSessionId());
  return apiRequest<SupportChatHistory>(`/content/chat/?session_id=${sessionId}`, {
    authenticated: true,
  });
}

export function sendSupportMessage(text: string) {
  return apiRequest<SupportChatReply>('/content/chat/', {
    method: 'POST',
    authenticated: true,
    body: JSON.stringify({ text, session_id: getSupportSessionId() }),
  });
}
