
'use client';

import type { LinkCategory } from '@/types';
import { ALL_CATEGORIES, CATEGORIES_INFO } from '@/data/staticLinks';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface FilterControlsProps {
  searchKeywords: string;
  onKeywordChange: (keywords: string) => void;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  currentSort: string;
  onSortChange: (sortBy: string) => void;
  isAIFiltering: boolean;
  isAISearchActive: boolean; // To disable other filters when AI search is active
}

export function FilterControls({
  searchKeywords,
  onKeywordChange,
  selectedCategory,
  onSelectCategory,
  currentSort,
  onSortChange,
  isAIFiltering,
  isAISearchActive
}: FilterControlsProps) {
  const sortOptions = [
    { value: 'title-asc', label: 'Title (A-Z)' },
    { value: 'title-desc', label: 'Title (Z-A)' },
    { value: 'category-asc', label: 'Category' },
    { value: 'date-desc', label: 'Last Added' },
    { value: 'date-asc', label: 'First Added' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="keyword-search" className="text-sm font-medium">
          AI Keyword Search
          {isAIFiltering && <Loader2 className="inline-block ml-2 h-4 w-4 animate-spin" />}
        </Label>
        <Input
          id="keyword-search"
          type="text"
          placeholder="e.g., javascript, ai tools"
          value={searchKeywords}
          onChange={(e) => onKeywordChange(e.target.value)}
          className="mt-1"
        />
        {isAISearchActive && <p className="text-xs text-muted-foreground mt-1">AI search is active. Category and sort apply to AI results.</p>}
      </div>
      <div>
        <Label htmlFor="category-filter" className="text-sm font-medium">Filter by Category</Label>
        <Select 
          value={selectedCategory} 
          onValueChange={onSelectCategory}
          disabled={isAIFiltering} // Disable while AI is actively searching
        >
          <SelectTrigger id="category-filter" className="w-full mt-1">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Categories</SelectItem>
            {ALL_CATEGORIES.map((cat) => ( // ALL_CATEGORIES no longer includes 'AI Generated'
              <SelectItem key={cat} value={cat}>
                {CATEGORIES_INFO[cat as LinkCategory]?.name || cat}
              </SelectItem>
            ))}
            {/* "AI Generated" SelectItem removed */}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="sort-by" className="text-sm font-medium">Sort By</Label>
        <Select 
          value={currentSort} 
          onValueChange={onSortChange}
          disabled={isAIFiltering} // Disable while AI is actively searching
        >
          <SelectTrigger id="sort-by" className="w-full mt-1">
            <SelectValue placeholder="Select sort order" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
