
import type { LinkItem, CategoryInfo } from '@/types';
import { BookOpen, Wrench, GitBranch, Youtube, HelpCircle } from 'lucide-react';

// Define the categories as a const array for Zod's enum and for deriving the type
// This 'as const' assertion is important for z.enum to correctly infer the types.
export const ALL_CATEGORIES = ['Learning', 'Tools', 'Project Repos', 'Videos', 'Other'] as const;

// Derive the LinkCategory type from this const array
export type LinkCategory = typeof ALL_CATEGORIES[number];


export const CATEGORIES_INFO: Record<LinkCategory, CategoryInfo> = {
  Learning: { name: 'Learning', icon: BookOpen, color: 'text-blue-500' },
  Tools: { name: 'Tools', icon: Wrench, color: 'text-green-500' },
  'Project Repos': { name: 'Project Repos', icon: GitBranch, color: 'text-purple-500' },
  Videos: { name: 'Videos', icon: Youtube, color: 'text-red-500' },
  Other: { name: 'Other', icon: HelpCircle, color: 'text-gray-500'},
};


export const INITIAL_LINKS: LinkItem[] = [
  // Application starts with an empty list.
];

// Note: The type 'LinkCategory' is now derived within this file from ALL_CATEGORIES.
// If it's also defined in src/types/index.ts, ensure they are consistent or one derives from the other.
// For this fix, we assume src/types/index.ts will now import LinkCategory from here or that its definition is compatible.
// To keep things clean, it's often best to have such "source of truth" arrays and their derived types in the same place,
// or ensure the type in src/types/index.ts matches exactly:
// export type LinkCategory = 'Learning' | 'Tools' | 'Project Repos' | 'Videos' | 'Other';
