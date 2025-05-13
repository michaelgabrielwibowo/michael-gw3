
import type { LucideIcon } from 'lucide-react';

export type LinkCategory = 'Learning' | 'Tools' | 'Project Repos' | 'Videos' | 'AI Generated' | 'Other';

export interface LinkItem {
  id: string; 
  title: string;
  description: string;
  url: string;
  category: LinkCategory;
  icon: LucideIcon; 
  source: 'curated' | 'ai';
  addedTimestamp?: number; 
}

export interface CategoryInfo {
  name: LinkCategory;
  icon: LucideIcon;
  color: string; 
}

export interface ExistingLink {
  title?: string; 
  url: string;
}

// Locale type removed
