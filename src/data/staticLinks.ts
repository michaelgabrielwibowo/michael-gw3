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
  {
    id: '1',
    title: 'Next.js Documentation',
    description: 'The official documentation for Next.js, the React framework for production.',
    url: 'https://nextjs.org/docs',
    category: 'Learning',
    icon: CATEGORIES_INFO['Learning'].icon,
    source: 'curated',
  },
  {
    id: '2',
    title: 'Tailwind CSS',
    description: 'A utility-first CSS framework for rapid UI development.',
    url: 'https://tailwindcss.com',
    category: 'Tools',
    icon: CATEGORIES_INFO['Tools'].icon,
    source: 'curated',
  },
  {
    id: '3',
    title: 'ShadCN UI Components',
    description: 'Beautifully designed components that you can copy and paste into your apps.',
    url: 'https://ui.shadcn.com',
    category: 'Tools',
    icon: CATEGORIES_INFO['Tools'].icon,
    source: 'curated',
  },
  {
    id: '4',
    title: 'Genkit Documentation',
    description: 'Firebase Genkit official documentation for building AI-powered applications.',
    url: 'https://firebase.google.com/docs/genkit',
    category: 'Learning',
    icon: CATEGORIES_INFO['Learning'].icon,
    source: 'curated',
  },
  {
    id: '5',
    title: 'Awesome Next.js Repository',
    description: 'A curated list of awesome Next.js resources, libraries, and projects.',
    url: 'https://github.com/unicodeveloper/awesome-nextjs',
    category: 'Project Repos',
    icon: CATEGORIES_INFO['Project Repos'].icon,
    source: 'curated',
  },
  {
    id: '6',
    title: 'Next.js Conf Videos',
    description: 'Watch talks and presentations from past Next.js conferences.',
    url: 'https://www.youtube.com/playlist?list=PLBnKlKpPeagnXwR WeingartqcbReS4sy09z_6',
    category: 'Videos',
    icon: CATEGORIES_INFO['Videos'].icon,
    source: 'curated',
  },
];
