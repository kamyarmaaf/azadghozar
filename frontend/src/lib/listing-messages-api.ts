import { API_BASE_URL, apiRequest } from '@/lib/api';

export const MESSAGES_SOCKET_PROTOCOL = 'azadgozar-chat-v1';

export function listingMessagesSocketUrl(): string {
  const url = new URL(process.env.NEXT_PUBLIC_WS_BASE_URL || API_BASE_URL);
  if (url.protocol === 'https:') url.protocol = 'wss:';
  else if (url.protocol === 'http:') url.protocol = 'ws:';
  url.pathname = '/ws/catalog/messages/';
  url.search = '';
  url.hash = '';
  return url.toString();
}

export interface ListingMessageEvent {
  type: 'message.created';
  conversation_id: number;
  message: ListingMessage;
}

export interface ListingConversation {
  id: number;
  listing_id: number | null;
  listing_title: string;
  buyer_id: number;
  owner_id: number;
  other_party_name: string;
  last_message_text: string;
  last_message_at: string | null;
  created_at: string;
}

export interface ListingMessage {
  id: number;
  sender_id: number;
  text: string;
  created_at: string;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export function openListingConversation(listingId: number) {
  return apiRequest<ListingConversation>('/catalog/conversations/', {
    method: 'POST',
    authenticated: true,
    body: JSON.stringify({ listing_id: listingId }),
  });
}

export function fetchListingConversations(page = 1) {
  return apiRequest<Paginated<ListingConversation>>(`/catalog/conversations/?page=${page}`, { authenticated: true });
}

export function fetchListingMessages(conversationId: number, page = 1) {
  return apiRequest<Paginated<ListingMessage>>(`/catalog/conversations/${conversationId}/messages/?page=${page}`, { authenticated: true });
}

export function sendListingMessage(conversationId: number, text: string) {
  return apiRequest<ListingMessage>(`/catalog/conversations/${conversationId}/messages/`, {
    method: 'POST',
    authenticated: true,
    body: JSON.stringify({ text }),
  });
}
