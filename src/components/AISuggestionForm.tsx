
'use client';

import { useState } from 'react';
import type { ExistingLink, LinkCategory } from '@/types';
import { ALL_CATEGORIES, CATEGORIES_INFO } from '@/data/staticLinks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Loader2, ChevronDown } from 'lucide-react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from "@/hooks/use-toast";
import ExcelJS from 'exceljs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const SuggestionFormSchema = z.object({
  keywords: z.string().optional(),
  category: z.array(z.string()).optional().default([]),
  linkCount: z.number().min(1).max(50).default(5),
});

type SuggestionFormValues = z.infer<typeof SuggestionFormSchema>;

interface AISuggestionFormProps {
  onSuggest: (
    keywords: string, 
    categories: string[],
    linkCount: number, 
    existingLinks: ExistingLink[]
  ) => Promise<void>;
  isLoading: boolean;
}

export function AISuggestionForm({ onSuggest, isLoading }: AISuggestionFormProps) {
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<SuggestionFormValues>({
    resolver: zodResolver(SuggestionFormSchema),
    defaultValues: {
      keywords: "",
      category: [],
      linkCount: 5,
    }
  });
  const { toast } = useToast();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedExistingLinks, setParsedExistingLinks] = useState<ExistingLink[]>([]);

  const selectedCategories = watch('category', []);
  const linkCount = watch('linkCount');

  const parseTxtContent = (content: string): ExistingLink[] => {
    const links: ExistingLink[] = [];
    const entries = content.split('---');
    entries.forEach(entry => {
      const titleMatch = entry.match(/Title:\s*(.*)/i);
      const urlMatch = entry.match(/URL:\s*(.*)/i);
      if (urlMatch?.[1]) {
        links.push({ title: titleMatch?.[1]?.trim() || undefined, url: urlMatch[1].trim() });
      }
    });
    return links.filter(link => link.url);
  };

  const parseCsvContent = (content: string): ExistingLink[] => {
    const links: ExistingLink[] = [];
    const rows = content.split('\\n').map(row => row.trim()).filter(row => row);
    if (rows.length < 1) return links;

    const header = rows[0].split(',').map(h => String(h).trim().toLowerCase().replace(/"/g, ''));
    const titleIndex = header.indexOf('title');
    const urlIndex = header.indexOf('url');

    if (urlIndex === -1) {
      toast({ title: "CSV Parsing Error", description: "CSV file must contain a 'url' column.", variant: "destructive" });
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
        toast({ title: "JSON Parsing Error", description: "JSON file must contain an array of link objects.", variant: "destructive" });
        return [];
      }
      const links: ExistingLink[] = parsed.map((item: any) => ({
        title: typeof item.title === 'string' ? item.title : undefined,
        url: typeof item.url === 'string' ? item.url : '',
      })).filter(link => link.url);

      if (links.length !== parsed.length) {
         toast({ title: "Incomplete JSON Data", description: "Some items in the JSON array were missing a 'url' and were ignored.", variant: "default" });
      }
      return links;
    } catch (e) {
      toast({ title: "JSON Parsing Error", description: "Could not parse JSON file. Ensure it's a valid JSON array.", variant: "destructive" });
      return [];
    }
  };

  const parseXlsxContent = async (buffer: ArrayBuffer): Promise<ExistingLink[]> => {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      const worksheet = workbook.worksheets[0]; 

      if (!worksheet) {
        toast({ title: "XLSX Parsing Error", description: "No sheets found in the XLSX file.", variant: "destructive" });
        return [];
      }

      const links: ExistingLink[] = [];
      let urlColIndex = -1; 
      let titleColIndex = -1; 

      const firstRow = worksheet.getRow(1);
      if (firstRow.actualCellCount === 0 && worksheet.actualRowCount === 0) {
          return [];
      }

      firstRow.eachCell((cell, colNumber) => {
        const cellValue = String(cell.value || '').toLowerCase().trim();
        if (cellValue === 'url') urlColIndex = colNumber;
        if (cellValue === 'title') titleColIndex = colNumber;
      });

      if (urlColIndex === -1) {
        toast({ title: "XLSX Parsing Error", description: "XLSX file must contain a 'url' column in the first sheet.", variant: "destructive" });
        return [];
      }

      for (let i = 2; i <= worksheet.rowCount; i++) {
        const row = worksheet.getRow(i);
        if (row.actualCellCount === 0) continue; 

        const urlCell = row.getCell(urlColIndex);
        const url = (urlCell.text || String(urlCell.value || '')).trim();

        if (url) {
          let title: string | undefined = undefined;
          if (titleColIndex !== -1) {
            const titleCell = row.getCell(titleColIndex);
            title = (titleCell.text || String(titleCell.value || '')).trim() || undefined;
          }
          links.push({ title, url });
        }
      }
      return links.filter(link => link.url);
    } catch (error) {
      console.error("Error parsing XLSX file with exceljs:", error);
      toast({ title: "XLSX Parsing Error", description: "Could not parse XLSX file.", variant: "destructive" });
      return [];
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
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
          links = await parseXlsxContent(arrayBuffer); // Await the async parsing
        }
         else {
          toast({ title: "Unsupported File Type", description: "Please upload a .txt, .csv, .json, or .xlsx file.", variant: "destructive" });
          setUploadedFile(null);
          setParsedExistingLinks([]);
          event.target.value = ''; 
          return;
        }
        setParsedExistingLinks(links);
        toast({ title: "File Processed", description: `${links.length} links parsed from ${file.name}.`, variant: "default" });
      } catch (error) {
        console.error("Error parsing file:", error);
        toast({ title: "File Parsing Error", description: "An error occurred while parsing the file.", variant: "destructive" });
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
    await onSuggest(data.keywords || "", data.category || [], data.linkCount, parsedExistingLinks);
  };
  
  const getCategoryButtonLabel = () => {
    if (!selectedCategories || selectedCategories.length === 0) {
      return "Suggest from any category";
    }
    if (selectedCategories.length === 1) {
      const catInfo = CATEGORIES_INFO[selectedCategories[0] as LinkCategory];
      return catInfo?.name || selectedCategories[0];
    }
    return `${selectedCategories.length} categories selected`;
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
          placeholder="e.g., react, machine learning, free cooking course"
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="ai-category-dropdown-trigger" className="text-sm font-medium">
          Categories <span className="text-xs text-muted-foreground">(Optional, select multiple)</span>
        </Label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" id="ai-category-dropdown-trigger" className="w-full mt-1 justify-between">
              <span>{getCategoryButtonLabel()}</span>
              <ChevronDown className="ml-2 h-4 w-4 opacity-50 shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-full max-h-60 overflow-y-auto">
            <DropdownMenuLabel>Select Categories</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {ALL_CATEGORIES.map((cat) => (
              <DropdownMenuCheckboxItem
                key={cat}
                checked={selectedCategories.includes(cat)}
                onCheckedChange={(checked) => {
                  const currentSelection = selectedCategories || [];
                  if (checked) {
                    setValue('category', [...currentSelection, cat], { shouldValidate: true });
                  } else {
                    setValue('category', currentSelection.filter(c => c !== cat), { shouldValidate: true });
                  }
                }}
              >
                {CATEGORIES_INFO[cat as LinkCategory]?.name || cat}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div>
        <Label htmlFor="linkCount" className="text-sm font-medium">
          Number of Links to Suggest: {linkCount}
        </Label>
        <Slider
          id="linkCount"
          min={1}
          max={50}
          step={1}
          defaultValue={[5]}
          onValueChange={(value) => setValue('linkCount', value[0])}
          className="mt-2"
          aria-label="Number of links to suggest slider"
        />
      </div>
      <div>
        <Label htmlFor="uploadLinks" className="text-sm font-medium">
          Upload Existing Links <span className="text-xs text-muted-foreground">(Optional, .txt, .csv, .json, .xlsx)</span>
        </Label>
        <p className="text-xs text-destructive mt-0.5">Warning: Uploading very large files may impact browser performance due to RAM usage.</p>
        <Input
          id="uploadLinks"
          type="file"
          accept=".txt,.csv,.json,.xlsx"
          onChange={handleFileChange}
          className="mt-1"
        />
        {uploadedFile && <p className="text-xs text-muted-foreground mt-1">{uploadedFile.name} ({parsedExistingLinks.length} links parsed)</p>}
      </div>
      <Button type="submit" disabled={isLoading} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Suggest Links"}
      </Button>
    </form>
  );
}
