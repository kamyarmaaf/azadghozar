import { apiRequest } from '@/lib/api';

export type AboutStatisticIcon = 'listing' | 'agency' | 'gallery' | 'users';
export type AboutTrustIcon = 'verified' | 'support' | 'guarantee' | 'inspection';

export interface AboutStatistic {
  id: number;
  label: string;
  value: number;
  suffix: string;
  icon: AboutStatisticIcon;
}

export interface AboutTeamMember {
  id: number;
  name: string;
  role: string;
  description: string;
  photo_url: string;
}

export interface AboutTrustItem {
  id: number;
  title: string;
  description: string;
  icon: AboutTrustIcon;
}

export interface AboutPageContent {
  hero_title: string;
  intro: string;
  hero_image_url: string;
  why_title: string;
  mission_title: string;
  mission_text: string;
  vision_title: string;
  vision_text: string;
  values_title: string;
  values_text: string;
  team_title: string;
  trust_title: string;
  show_statistics: boolean;
  show_team: boolean;
  show_trust_items: boolean;
  statistics: AboutStatistic[];
  team_members: AboutTeamMember[];
  trust_items: AboutTrustItem[];
  meta_title: string;
  meta_description: string;
  updated_at: string;
}

export function fetchAboutPage(signal?: AbortSignal): Promise<AboutPageContent> {
  return apiRequest<AboutPageContent>('/content/about/', { signal });
}
