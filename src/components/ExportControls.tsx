'use client';

import type { LinkItem, ExistingLink } from '@/types';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { useTranslations } from 'next-intl';

interface ExportControlsProps {
  linksToExport: LinkItem[];
  uploadedLinks?: ExistingLink[];
  latestAISuggestions?: LinkItem[];
}

export function ExportControls({ linksToExport, uploadedLinks, latestAISuggestions }: ExportControlsProps) {
  const t = useTranslations('ExportControls');

  const getCurrentDateTimeFormatted = () => {
    return format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
  };

  const createBlob = (data: string, type: string) => new Blob([data], { type });

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportElementAsPNG = async (elementId: string, filename: string) => {
    const elementToCapture = document.getElementById(elementId);
    if (elementToCapture) {
      try {
        const canvas = await html2canvas(elementToCapture, {
          backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--background').trim() || '#FFFFFF',
          scale: 1.5, 
        });
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error(`Error exporting ${elementId} to PNG as ${filename}:`, error);
        alert(`Failed to export as PNG (${filename}). Check console for details.`);
      }
    } else {
      alert(`Could not find element "${elementId}" to export. Ensure it is visible.`);
    }
  };

  const handleExportTXT = (combined = false) => {
    const dateTimeStr = getCurrentDateTimeFormatted();
    let data;
    let filenameSuffix = 'export';

    if (combined && canExportCombined) {
      data = t('uploadedLinksHeader') + "\n---\n";
      data += (uploadedLinks ?? [])
        .map(link => `Title: ${link.title || 'N/A'}\nURL: ${link.url}\n---`)
        .join('\n\n');
      data += "\n\n" + t('aiSuggestionsHeader') + "\n---\n";
      data += (latestAISuggestions ?? [])
        .map(link => `Title: ${link.title}\nURL: ${link.url}\nDescription: ${link.description}\nCategory: ${link.category}\nSource: ${link.source}\n---`)
        .join('\n\n');
      filenameSuffix = 'combined_export';
    } else {
      data = linksToExport
        .map(link => `Title: ${link.title}\nURL: ${link.url}\nDescription: ${link.description}\nCategory: ${link.category}\nSource: ${link.source}\n---`)
        .join('\n\n');
    }
    const blob = createBlob(data, 'text/plain;charset=utf-8');
    downloadFile(blob, `linksage_${filenameSuffix}_${dateTimeStr}.txt`);
  };

  const handleExportCSV = (combined = false) => {
    const dateTimeStr = getCurrentDateTimeFormatted();
    const header = 'Title,URL,Description,Category,Source,Origin\n';
    let rows = '';
    let filenameSuffix = 'export';

    if (combined && canExportCombined) {
      rows += (uploadedLinks ?? [])
        .map(link => `"${(link.title || 'N/A').replace(/"/g, '""')}","${link.url.replace(/"/g, '""')}","","","","Uploaded"`)
        .join('\n');
      if ((uploadedLinks?.length ?? 0) > 0 && (latestAISuggestions?.length ?? 0) > 0) {
        rows += '\n';
      }
      rows += (latestAISuggestions ?? [])
        .map(link => `"${link.title.replace(/"/g, '""')}","${link.url.replace(/"/g, '""')}","${link.description.replace(/"/g, '""')}","${link.category}","${link.source}","AI Generated"`)
        .join('\n');
      filenameSuffix = 'combined_export';
    } else {
      rows = linksToExport
        .map(link => `"${link.title.replace(/"/g, '""')}","${link.url.replace(/"/g, '""')}","${link.description.replace(/"/g, '""')}","${link.category}","${link.source}","${link.source === 'ai' ? 'AI Generated' : 'Curated'}"`)
        .join('\n');
    }
    const data = header + rows;
    const blob = createBlob(data, 'text/csv;charset=utf-8');
    downloadFile(blob, `linksage_${filenameSuffix}_${dateTimeStr}.csv`);
  };
  
  const handleExportJSON = (combined = false) => {
    const dateTimeStr = getCurrentDateTimeFormatted();
    let exportData;
    let filenameSuffix = 'export';

    if (combined && canExportCombined) {
      exportData = {
        uploadedLinks: uploadedLinks,
        newlySuggestedAILinks: latestAISuggestions,
      };
      filenameSuffix = 'combined_export';
    } else {
      exportData = linksToExport;
    }
    const data = JSON.stringify(exportData, null, 2);
    const blob = createBlob(data, 'application/json;charset=utf-8');
    downloadFile(blob, `linksage_${filenameSuffix}_${dateTimeStr}.json`);
  };

  const handleExportXLSX = (combined = false) => {
    const dateTimeStr = getCurrentDateTimeFormatted();
    let sheetData;
    let filenameSuffix = 'export';
    let sheetName = 'Links';

    if (combined && canExportCombined) {
      const uploadedSheetData = (uploadedLinks ?? []).map(link => ({
        Title: link.title || 'N/A',
        URL: link.url,
        Description: '',
        Category: '',
        Source: '',
        Origin: 'Uploaded',
      }));
      const aiSheetData = (latestAISuggestions ?? []).map(link => ({
        Title: link.title,
        URL: link.url,
        Description: link.description,
        Category: link.category,
        Source: link.source,
        Origin: 'AI Generated',
      }));
      sheetData = [...uploadedSheetData, ...aiSheetData];
      filenameSuffix = 'combined_export';
      sheetName = 'Combined Links';
    } else {
      sheetData = linksToExport.map(link => ({
        ID: link.id,
        Title: link.title,
        URL: link.url,
        Description: link.description,
        Category: link.category,
        Source: link.source,
        Origin: link.source === 'ai' ? 'AI Generated' : 'Curated',
      }));
    }
    
    const ws = XLSX.utils.json_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `linksage_${filenameSuffix}_${dateTimeStr}.xlsx`);
  };


  const handleExportPNG = (combined = false) => {
    const dateTimeStr = getCurrentDateTimeFormatted();
    let filenameSuffix = 'export';
    if(combined && canExportCombined) {
      filenameSuffix = 'combined_export';
    }
    // Note: PNG export captures the current view. If "combined" means specific data not just current view, this needs adjustment.
    // For now, assumes it captures whatever is in 'link-list-container'.
    exportElementAsPNG('link-list-container', `linksage_${filenameSuffix}_${dateTimeStr}.png`);
  };

  const canExportCombined = (uploadedLinks && uploadedLinks.length > 0) || (latestAISuggestions && latestAISuggestions.length > 0);


  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full">
          <Download className="mr-2 h-4 w-4" /> {t('exportLinksButton')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>{t('currentViewLabel')}</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => handleExportTXT()}>{t('exportAsTXT')}</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExportCSV()}>{t('exportAsCSV')}</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExportJSON()}>{t('exportAsJSON')}</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExportXLSX()}>{t('exportAsXLSX')}</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExportPNG()}>{t('exportAsPNG')}</DropdownMenuItem>
        
        { canExportCombined ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>{t('combinedExportLabel')}</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => handleExportTXT(true)}>{t('exportCombinedTXT')}</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExportCSV(true)}>{t('exportCombinedCSV')}</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExportJSON(true)}>{t('exportCombinedJSON')}</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExportXLSX(true)}>{t('exportCombinedXLSX')}</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExportPNG(true)}>{t('exportCombinedPNG')}</DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
