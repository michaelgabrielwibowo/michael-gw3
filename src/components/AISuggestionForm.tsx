
'use client';

import { useState, useCallback } from 'react';
import type { LinkCategory, ExistingLink } from '@/types';
import { ALL_CATEGORIES } from '@/data/staticLinks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Loader2 } from 'lucide-react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from "@/hooks/use-toast";

const SuggestionFormSchema = z.object({
  keywords: z.string().optional(),
  category: z.string().optional(),
  linkCount: z.number().min(1).max(20).default(5),
});

type SuggestionFormValues = z.infer<typeof SuggestionFormSchema>;

interface AISuggestionFormProps {
  onSuggest: (
    keywords: string, 
    category: LinkCategory | '', 
    linkCount: number, 
    existingLinks: ExistingLink[]
  ) => Promise<void>;
  isLoading: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export function AISuggestionForm({ onSuggest, isLoading }: AISuggestionFormProps) {
  const { register, handleSubmit, formState: { errors }, setValue, watch, control } = useForm<SuggestionFormValues>({
    resolver: zodResolver(SuggestionFormSchema),
    defaultValues: {
      keywords: "",
      category: "",
      linkCount: 5,
    }
  });
  const { toast } = useToast();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedExistingLinks, setParsedExistingLinks] = useState<ExistingLink[]>([]);

  const selectedCategory = watch('category');
  const linkCount = watch('linkCount');

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "File Too Large",
          description: `Please upload a file smaller than ${MAX_FILE_SIZE / (1024*1024)}MB.`,
          variant: "destructive",
        });
        event.target.value = ''; // Clear the input
        setUploadedFile(null);
        setParsedExistingLinks([]);
        return;
      }

      setUploadedFile(file);
      try {
        const content = await file.text();
        let links: ExistingLink[] = [];
        if (file.name.endsWith('.txt')) {
          links = parseTxtContent(content);
        } else if (file.name.endsWith('.csv')) {
          links = parseCsvContent(content);
        } else if (file.name.endsWith('.json')) {
          links = parseJsonContent(content);
        } else {
          toast({ title: "Unsupported File Type", description: "Please upload a .txt, .csv, or .json file.", variant: "destructive" });
          setUploadedFile(null);
          setParsedExistingLinks([]);
          event.target.value = ''; // Clear the input
          return;
        }
        setParsedExistingLinks(links);
        toast({ title: "File Processed", description: `${links.length} existing links found in ${file.name}.`, variant: "default" });
      } catch (error) {
        console.error("Error parsing file:", error);
        toast({ title: "File Parsing Error", description: "Could not read or parse the file.", variant: "destructive" });
        setUploadedFile(null);
        setParsedExistingLinks([]);
        event.target.value = ''; // Clear the input
      }
    } else {
      setUploadedFile(null);
      setParsedExistingLinks([]);
    }
  };

  const parseTxtContent = (content: string): ExistingLink[] => {
    const links: ExistingLink[] = [];
    const entries = content.split('---');
    entries.forEach(entry => {
      const titleMatch = entry.match(/Title:\s*(.*)/);
      const urlMatch = entry.match(/URL:\s*(.*)/);
      if (urlMatch?.[1]) {
        links.push({ title: titleMatch?.[1]?.trim() || undefined, url: urlMatch[1].trim() });
      }
    });
    return links.filter(link => link.url); // Ensure URL exists
  };

  const parseCsvContent = (content: string): ExistingLink[] => {
    const links: ExistingLink[] = [];
    const rows = content.split('\n').map(row => row.trim()).filter(row => row);
    if (rows.length < 1) return links;

    const header = rows[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
    const titleIndex = header.indexOf('title');
    const urlIndex = header.indexOf('url');

    if (urlIndex === -1) { // URL is mandatory for existing links
      toast({ title: "CSV Parsing Error", description: "CSV must contain a 'URL' column.", variant: "destructive" });
      return [];
    }

    for (let i = 1; i < rows.length; i++) {
      // Basic CSV parsing, may need improvement for complex CSVs (e.g., values with commas)
      const values = rows[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));

      const url = values[urlIndex];
      if (url) {
        const title = titleIndex !== -1 ? values[titleIndex] : undefined;
        links.push({ title, url });
      }
    }
    return links.filter(link => link.url);
  };

  const parseJsonContent = (content: string): ExistingLink[] => {
    try {
      const parsed = JSON.parse(content);
      if (!Array.isArray(parsed)) {
        toast({ title: "JSON Parsing Error", description: "JSON file must contain an array of links.", variant: "destructive" });
        return [];
      }
      const links: ExistingLink[] = parsed.map((item: any) => ({
        title: typeof item.title === 'string' ? item.title : undefined,
        url: typeof item.url === 'string' ? item.url : '',
      })).filter(link => link.url); // Ensure URL exists and is a string

      if (links.length !== parsed.length) {
         toast({ title: "JSON Data Incomplete", description: "Some items in the JSON were missing a valid URL.", variant: "default" });
      }
      return links;
    } catch (e) {
      toast({ title: "JSON Parsing Error", description: "Invalid JSON format.", variant: "destructive" });
      return [];
    }
  };


  const onSubmit: SubmitHandler<SuggestionFormValues> = async (data) => {
    await onSuggest(data.keywords || "", (data.category || "") as LinkCategory | "", data.linkCount, parsedExistingLinks);
  };
  
  const handleCategoryChange = (value: string) => {
    setValue('category', value === "none" ? "" : value, { shouldValidate: true });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <Label htmlFor="keywords" className="text-sm font-medium">
          Keywords <span className="text-xs text-muted-foreground">(Optional)</span>
        </Label>
        <Input
          id="keywords"
          {...register('keywords')}
          placeholder="e.g., react state management, css animations"
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="ai-category" className="text-sm font-medium">
          Category for Suggestions <span className="text-xs text-muted-foreground">(Optional)</span>
        </Label>
        <Select value={selectedCategory || "none"} onValueChange={handleCategoryChange}>
          <SelectTrigger id="ai-category" className="w-full mt-1">
            <SelectValue placeholder="Select category (or leave random)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Any / Random Category</SelectItem>
            {ALL_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="linkCount" className="text-sm font-medium">
          Number of Links to Suggest: {linkCount}
        </Label>
        <Slider
          id="linkCount"
          min={1}
          max={20}
          step={1}
          defaultValue={[5]}
          onValueChange={(value) => setValue('linkCount', value[0])}
          className="mt-2"
          aria-label="Number of links to suggest"
        />
      </div>
      <div>
        <Label htmlFor="uploadLinks" className="text-sm font-medium">
          Upload Existing Links <span className="text-xs text-muted-foreground">(Optional .txt/.csv/.json, max {MAX_FILE_SIZE / (1024*1024)}MB)</span>
        </Label>
        <Input
          id="uploadLinks"
          type="file"
          accept=".txt,.csv,.json"
          onChange={handleFileChange}
          className="mt-1"
        />
        {uploadedFile && <p className="text-xs text-muted-foreground mt-1">File: {uploadedFile.name} ({parsedExistingLinks.length} links found)</p>}
      </div>
      <Button type="submit" disabled={isLoading} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Suggest Links'}
      </Button>
    </form>
  );
}

