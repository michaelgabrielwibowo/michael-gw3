'use client';

import { useState } from 'react';
import type { LinkCategory, ExistingLink } from '@/types';
import { ALL_CATEGORIES, CATEGORIES_INFO } from '@/data/staticLinks';
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
import * as XLSX from 'xlsx';
import { useTranslations } from 'next-intl';


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
  const t = useTranslations();
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<SuggestionFormValues>({
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

  const parseTxtContent = (content: string): ExistingLink[] => {
    const links: ExistingLink[] = [];
    const entries = content.split('---');
    entries.forEach(entry => {
      const titleMatch = entry.match(/Title:\s*(.*)/i); // Case-insensitive title
      const urlMatch = entry.match(/URL:\s*(.*)/i); // Case-insensitive URL
      if (urlMatch?.[1]) {
        links.push({ title: titleMatch?.[1]?.trim() || undefined, url: urlMatch[1].trim() });
      }
    });
    return links.filter(link => link.url);
  };

  const parseCsvContent = (content: string): ExistingLink[] => {
    const links: ExistingLink[] = [];
    const rows = content.split('\n').map(row => row.trim()).filter(row => row);
    if (rows.length < 1) return links;

    const header = rows[0].split(',').map(h => String(h).trim().toLowerCase().replace(/"/g, ''));
    const titleIndex = header.indexOf('title');
    const urlIndex = header.indexOf('url');

    if (urlIndex === -1) {
      toast({ title: t('AISuggestionForm.csvParsingErrorTitle'), description: t('AISuggestionForm.csvParsingErrorURLColumn'), variant: "destructive" });
      return [];
    }

    for (let i = 1; i < rows.length; i++) {
      const values = rows[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => String(v).trim().replace(/^"|"$/g, ''));
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
        toast({ title: t('AISuggestionForm.jsonParsingErrorTitle'), description: t('AISuggestionForm.jsonParsingErrorArray'), variant: "destructive" });
        return [];
      }
      const links: ExistingLink[] = parsed.map((item: any) => ({
        title: typeof item.title === 'string' ? item.title : undefined,
        url: typeof item.url === 'string' ? item.url : '',
      })).filter(link => link.url);

      if (links.length !== parsed.length) {
         toast({ title: t('AISuggestionForm.jsonDataIncompleteTitle'), description: t('AISuggestionForm.jsonDataIncompleteDesc'), variant: "default" });
      }
      return links;
    } catch (e) {
      toast({ title: t('AISuggestionForm.jsonParsingErrorTitle'), description: t('AISuggestionForm.jsonParsingErrorFormat'), variant: "destructive" });
      return [];
    }
  };

  const parseXlsxContent = (buffer: ArrayBuffer): ExistingLink[] => {
    try {
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        toast({ title: t('AISuggestionForm.xlsxParsingErrorTitle'), description: t('AISuggestionForm.xlsxParsingErrorNoSheets'), variant: "destructive" });
        return [];
      }
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1 });

      if (jsonData.length === 0) return [];

      const headers = (jsonData[0] as any[]).map(h => String(h).toLowerCase().trim());
      const urlIndex = headers.indexOf('url');
      const titleIndex = headers.indexOf('title');

      if (urlIndex === -1) {
        toast({ title: t('AISuggestionForm.xlsxParsingErrorTitle'), description: t('AISuggestionForm.xlsxParsingErrorURLColumn'), variant: "destructive" });
        return [];
      }

      const links: ExistingLink[] = [];
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i] as any[];
        const url = row[urlIndex] ? String(row[urlIndex]).trim() : '';
        if (url) {
          const title = titleIndex !== -1 && row[titleIndex] ? String(row[titleIndex]).trim() : undefined;
          links.push({ title, url });
        }
      }
      return links.filter(link => link.url);
    } catch (error) {
      console.error("Error parsing XLSX file:", error);
      toast({ title: t('AISuggestionForm.xlsxParsingErrorTitle'), description: t('AISuggestionForm.xlsxParsingErrorGeneric'), variant: "destructive" });
      return [];
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: t('AISuggestionForm.fileTooLargeTitle'),
          description: t('AISuggestionForm.fileTooLargeDesc', { maxSize: MAX_FILE_SIZE / (1024*1024) }),
          variant: "destructive",
        });
        event.target.value = ''; 
        setUploadedFile(null);
        setParsedExistingLinks([]);
        return;
      }

      setUploadedFile(file);
      try {
        let links: ExistingLink[] = [];
        if (file.name.endsWith('.txt')) {
          links = parseTxtContent(await file.text());
        } else if (file.name.endsWith('.csv')) {
          links = parseCsvContent(await file.text());
        } else if (file.name.endsWith('.json')) {
          links = parseJsonContent(await file.text());
        } else if (file.name.endsWith('.xlsx')) {
          const arrayBuffer = await file.arrayBuffer();
          links = parseXlsxContent(arrayBuffer);
        }
         else {
          toast({ title: t('AISuggestionForm.unsupportedFileTypeTitle'), description: t('AISuggestionForm.unsupportedFileTypeDesc'), variant: "destructive" });
          setUploadedFile(null);
          setParsedExistingLinks([]);
          event.target.value = ''; 
          return;
        }
        setParsedExistingLinks(links);
        toast({ title: t('AISuggestionForm.fileProcessedTitle'), description: t('AISuggestionForm.fileProcessedDesc', { count: links.length, fileName: file.name }), variant: "default" });
      } catch (error) {
        console.error("Error parsing file:", error);
        toast({ title: t('AISuggestionForm.fileParsingErrorGenericTitle'), description: t('AISuggestionForm.fileParsingErrorGenericDesc'), variant: "destructive" });
        setUploadedFile(null);
        setParsedExistingLinks([]);
        event.target.value = ''; 
      }
    } else {
      setUploadedFile(null);
      setParsedExistingLinks([]);
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
          {t('AISuggestionForm.keywordsLabel')} <span className="text-xs text-muted-foreground">({t('AISuggestionForm.optionalLabel')})</span>
        </Label>
        <Input
          id="keywords"
          {...register('keywords')}
          placeholder={t('AISuggestionForm.keywordsPlaceholder')}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="ai-category" className="text-sm font-medium">
          {t('AISuggestionForm.categoryLabel')} <span className="text-xs text-muted-foreground">({t('AISuggestionForm.optionalLabel')})</span>
        </Label>
        <Select value={selectedCategory || "none"} onValueChange={handleCategoryChange}>
          <SelectTrigger id="ai-category" className="w-full mt-1">
            <SelectValue placeholder={t('AISuggestionForm.categoryPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{t('AISuggestionForm.anyCategory')}</SelectItem>
            {ALL_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                 {CATEGORIES_INFO[cat]?.name ? t(`categories.${cat.toLowerCase().replace(/\s+/g, '')}`) : cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="linkCount" className="text-sm font-medium">
          {t('AISuggestionForm.linkCountLabel', { count: linkCount })}
        </Label>
        <Slider
          id="linkCount"
          min={1}
          max={20}
          step={1}
          defaultValue={[5]}
          onValueChange={(value) => setValue('linkCount', value[0])}
          className="mt-2"
          aria-label={t('AISuggestionForm.linkCountAriaLabel')}
        />
      </div>
      <div>
        <Label htmlFor="uploadLinks" className="text-sm font-medium">
          {t('AISuggestionForm.uploadLabel')} <span className="text-xs text-muted-foreground">({t('AISuggestionForm.uploadHint', { maxSize: MAX_FILE_SIZE / (1024*1024) })})</span>
        </Label>
        <Input
          id="uploadLinks"
          type="file"
          accept=".txt,.csv,.json,.xlsx"
          onChange={handleFileChange}
          className="mt-1"
        />
        {uploadedFile && <p className="text-xs text-muted-foreground mt-1">{t('AISuggestionForm.fileInfo', { fileName: uploadedFile.name, count: parsedExistingLinks.length })}</p>}
      </div>
      <Button type="submit" disabled={isLoading} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : t('AISuggestionForm.submitButton')}
      </Button>
    </form>
  );
}
