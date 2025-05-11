import type { LinkItem, CategoryInfo, LinkCategory } from '@/types';
import { BookOpen, Wrench, GitBranch, Youtube, Lightbulb, Globe } from 'lucide-react';

export const CATEGORIES_INFO: Record<LinkCategory, CategoryInfo> = {
  Learning: { name: 'Learning', icon: BookOpen, color: 'text-blue-500' },
  Tools: { name: 'Tools', icon: Wrench, color: 'text-green-500' },
  'Project Repos': { name: 'Project Repos', icon: GitBranch, color: 'text-purple-500' },
  Videos: { name: 'Videos', icon: Youtube, color: 'text-red-500' },
  'AI Generated': { name: 'AI Generated', icon: Lightbulb, color: 'text-yellow-500' },
};

export const ALL_CATEGORIES: LinkCategory[] = ['Learning', 'Tools', 'Project Repos', 'Videos'];


export const INITIAL_LINKS: LinkItem[] = [
  // Base 6 webs removed as per user request.
  // The application will now start with an empty list of links.
  // Users can add links via AI suggestions, which can now also consider uploaded link lists.
];

