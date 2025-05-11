'use client';

import { useState } from 'react';
import type { LinkCategory } from '@/types';
import { ALL_CATEGORIES } from '@/data/staticLinks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const SuggestionFormSchema = z.object({
  keywords: z.string().min(3, { message: "Keywords must be at least 3 characters long." }),
  category: z.string().min(1, { message: "Please select a category." }),
});

type SuggestionFormValues = z.infer<typeof SuggestionFormSchema>;

interface AISuggestionFormProps {
  onSuggest: (keywords: string, category: LinkCategory) => Promise<void>;
  isLoading: boolean;
}

export function AISuggestionForm({ onSuggest, isLoading }: AISuggestionFormProps) {
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<SuggestionFormValues>({
    resolver: zodResolver(SuggestionFormSchema),
    defaultValues: {
      keywords: "",
      category: "",
    }
  });

  const selectedCategory = watch('category');

  const onSubmit: SubmitHandler<SuggestionFormValues> = async (data) => {
    await onSuggest(data.keywords, data.category as LinkCategory);
  };
  
  // Needed to make Select work with react-hook-form
  const handleCategoryChange = (value: string) => {
    setValue('category', value, { shouldValidate: true });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="keywords" className="text-sm font-medium">Keywords</Label>
        <Input
          id="keywords"
          {...register('keywords')}
          placeholder="e.g., react state management, css animations"
          className="mt-1"
        />
        {errors.keywords && <p className="text-sm text-destructive mt-1">{errors.keywords.message}</p>}
      </div>
      <div>
        <Label htmlFor="ai-category" className="text-sm font-medium">Category for Suggestions</Label>
        <Select value={selectedCategory} onValueChange={handleCategoryChange}>
          <SelectTrigger id="ai-category" className="w-full mt-1">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {ALL_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category && <p className="text-sm text-destructive mt-1">{errors.category.message}</p>}
      </div>
      <Button type="submit" disabled={isLoading} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Suggest Links'}
      </Button>
    </form>
  );
}
