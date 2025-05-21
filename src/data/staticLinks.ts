import type { LinkItem, CategoryInfo, LinkCategory } from '@/types';
import { BookOpen, Wrench, GitBranch, Youtube, Lightbulb, Globe, HelpCircle } from 'lucide-react'; // Added HelpCircle for 'Other'

// 'AI Generated' category info removed. 'Other' category info added.
export const CATEGORIES_INFO: Record<LinkCategory, CategoryInfo> = {
  Learning: { name: 'Learning', icon: BookOpen, color: 'text-blue-500' },
  Tools: { name: 'Tools', icon: Wrench, color: 'text-green-500' },
  'Project Repos': { name: 'Project Repos', icon: GitBranch, color: 'text-purple-500' },
  Videos: { name: 'Videos', icon: Youtube, color: 'text-red-500' },
  Other: { name: 'Other', icon: HelpCircle, color: 'text-gray-500'}, // Added 'Other'
};

// 'AI Generated' removed from ALL_CATEGORIES. 'Other' is included.
// This list is used to guide the AI in categorization.
export const ALL_CATEGORIES: LinkCategory[] = ['Learning', 'Tools', 'Project Repos', 'Videos', 'Other'];


export const INITIAL_LINKS: LinkItem[] = [
  // Base links removed as per previous requests.
  // Application starts with an empty list.
  // 'source' property removed from any potential initial links.
];
