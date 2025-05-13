
'use client';

import type { LinkCategory } from '@/types';
import { ALL_CATEGORIES, CATEGORIES_INFO } from '@/data/staticLinks';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface FilterControlsProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  currentSort: string;
  onSortChange: (sortBy: string) => void;
}

export function FilterControls({ selectedCategory, onSelectCategory, currentSort, onSortChange }: FilterControlsProps) {
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
        <Label htmlFor="category-filter" className="text-sm font-medium">Filter by Category</Label>
        <Select value={selectedCategory} onValueChange={onSelectCategory}>
          <SelectTrigger id="category-filter" className="w-full mt-1">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Categories</SelectItem>
            {ALL_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {CATEGORIES_INFO[cat]?.name || cat}
              </SelectItem>
            ))}
             <SelectItem value="AI Generated">AI Generated</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="sort-by" className="text-sm font-medium">Sort By</Label>
        <Select value={currentSort} onValueChange={onSortChange}>
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
