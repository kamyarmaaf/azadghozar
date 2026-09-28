import { apiRequest } from '@/lib/api';

export interface SupportMessage {
  id: number;
  sender: 'user' | 'support';
  text: string;
  created_at: string;
}

export async function fetchSupportMessages(signal?: AbortSignal): Promise<SupportMessage[]> {
  const response = await apiRequest<{ messages: SupportMessage[] }>('/content/chat/', {
    authenticated: true,
    signal,
  });
  return response.messages;
}

export function sendSupportMessage(text: string): Promise<SupportMessage> {
  return apiRequest<SupportMessage>('/content/chat/', {
    method: 'POST',
    authenticated: true,
    body: JSON.stringify({ text }),
  });
}
