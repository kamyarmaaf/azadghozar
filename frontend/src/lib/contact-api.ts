import { apiRequest } from '@/lib/api';

export interface ContactSubject {
  value: string;
  label: string;
}

export interface ContactPageContent {
  title: string;
  subtitle: string;
  form_title: string;
  information_title: string;
  address: string;
  phone: string;
  email: string;
  working_hours: string;
  social_title: string;
  instagram_url: string;
  whatsapp_url: string;
  map_embed_url: string;
  map_link: string;
  meta_title: string;
  meta_description: string;
  subjects: ContactSubject[];
  updated_at: string;
}

export interface ContactMessageInput {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export interface ContactMessageResult extends ContactMessageInput {
  id: string;
  created_at: string;
}

export function fetchContactPage(signal?: AbortSignal): Promise<ContactPageContent> {
  return apiRequest<ContactPageContent>('/content/contact/', { signal });
}

export function submitContactMessage(input: ContactMessageInput): Promise<ContactMessageResult> {
  return apiRequest<ContactMessageResult>('/content/contact/messages/', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
