import type { LucideIcon } from 'lucide-react';

export type LinkCategory = 'Learning' | 'Tools' | 'Project Repos' | 'Videos' | 'AI Generated' | 'Other'; // Added 'Other' for flexibility

export interface LinkItem {
  id: string; // Can be e.g., "learn-1" for curated or "ai-timestamp-index" for AI
  title: string;
  description: string;
  url: string;
  category: LinkCategory;
  icon: LucideIcon; // Icon is per link, derived from category at display time
  source: 'curated' | 'ai';
  addedTimestamp?: number; // Optional: Explicit timestamp for sorting, useful for AI links
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

// Represents the type of the 'locales' array in i18n.ts
export type Locale = 'en' | 'zh-TW';
