'use client';

import type { LinkCategory } from '@/types';
import { ALL_CATEGORIES, CATEGORIES_INFO } from '@/data/staticLinks';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useTranslations } from 'next-intl';

interface FilterControlsProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  currentSort: string;
  onSortChange: (sortBy: string) => void;
}

export function FilterControls({ selectedCategory, onSelectCategory, currentSort, onSortChange }: FilterControlsProps) {
  const t = useTranslations('FilterControls');

  const sortOptions = [
    { value: 'title-asc', labelKey: 'sortOptions.titleAsc' },
    { value: 'title-desc', labelKey: 'sortOptions.titleDesc' },
    { value: 'category-asc', labelKey: 'sortOptions.categoryAsc' },
    { value: 'date-asc', labelKey: 'sortOptions.firstAdded' },
    { value: 'date-desc', labelKey: 'sortOptions.lastAdded' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="category-filter" className="text-sm font-medium">{t('filterByCategory')}</Label>
        <Select value={selectedCategory} onValueChange={onSelectCategory}>
          <SelectTrigger id="category-filter" className="w-full mt-1">
            <SelectValue placeholder={t('selectCategoryPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">{t('allCategories')}</SelectItem>
            {ALL_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {CATEGORIES_INFO[cat]?.name ? t(`categories.${cat.toLowerCase().replace(/\s+/g, '')}`) : cat}
              </SelectItem>
            ))}
             <SelectItem value="AI Generated">{t('categories.aiGenerated')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="sort-by" className="text-sm font-medium">{t('sortBy')}</Label>
        <Select value={currentSort} onValueChange={onSortChange}>
          <SelectTrigger id="sort-by" className="w-full mt-1">
            <SelectValue placeholder={t('selectSortOrderPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {t(option.labelKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
