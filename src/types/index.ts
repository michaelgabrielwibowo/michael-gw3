
import type { LucideIcon } from 'lucide-react';
import { z } from 'zod';
import type { ALL_CATEGORIES } from '@/data/staticLinks'; // Import for deriving LinkCategory

// Derive LinkCategory from the single source of truth in staticLinks.ts
export type LinkCategory = typeof ALL_CATEGORIES[number];

export interface LinkItem {
  id: string;
  title: string;
  description: string;
  url: string;
  category: LinkCategory;
  icon: LucideIcon;
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

// Types for suggestLinks flow (Input type as defined in the flow file)
export interface SuggestLinksInput {
  keywords?: string;
  preferredCategories?: string[]; // Array of LinkCategory strings
  validCategories: readonly string[]; // Should be ALL_CATEGORIES from staticLinks
  count: number;
  existingLinks?: ExistingLink[];
}

export interface AISuggestedLinkItem {
  title: string;
  url: string;
  description: string;
  category: LinkCategory; // This will be validated and normalized by the flow
}

export interface SuggestLinksOutput {
  suggestedLinks: AISuggestedLinkItem[];
}


// Types for filterLinksByKeyword flow
export interface LinkDataItemForAI {
  id: string;
  title: string;
  description: string;
  url: string;
  category: string;
  addedTimestamp?: number;
}

export interface FilterLinksByKeywordInput {
  linksToFilter: LinkDataItemForAI[];
  searchKeywords: string;
}

export interface FilterLinksByKeywordOutput {
  relevantLinks: { id: string }[];
}
