import type { LucideIcon } from 'lucide-react';

export type LinkCategory = 'Learning' | 'Tools' | 'Project Repos' | 'Videos' | 'AI Generated';

export interface LinkItem {
  id: string;
  title: string;
  description: string;
  url: string;
  category: LinkCategory;
  icon: LucideIcon;
  source: 'curated' | 'ai';
}

export interface CategoryInfo {
  name: LinkCategory;
  icon: LucideIcon;
  color: string; // Tailwind color class e.g. text-blue-500
}

export interface ExistingLink {
  title?: string; // Title is optional as URL is the primary identifier
  url: string;
}
