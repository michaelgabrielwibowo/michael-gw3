
import type { LucideIcon } from 'lucide-react';
import { z } from 'zod'; // Import Zod for schema-derived types if needed

// Define categories
export type LinkCategory = 'Learning' | 'Tools' | 'Project Repos' | 'Videos' | 'Other';

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

// Types for suggestLinks flow
export interface SuggestLinksInput {
  keywords?: string;
  preferredCategories?: string[];
  validCategories: string[]; // All_CATEGORIES from staticLinks
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
  relevantLinks: { id: string }[]; // AI returns only IDs of relevant links
}
