
'use client';

import type { LinkItem, ExistingLink } from '@/types';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';
import ExcelJS from 'exceljs';
import { useToast } from "@/hooks/use-toast";


interface ExportControlsProps {
  linksToExport: LinkItem[];
  uploadedLinks?: ExistingLink[];
  latestAISuggestions?: LinkItem[];
}

export function ExportControls({ linksToExport, uploadedLinks, latestAISuggestions }: ExportControlsProps) {
  const { toast } = useToast();
  const getCurrentDateTimeFormatted = () => {
    return format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
  };

  const createBlob = (data: string | ArrayBuffer, type: string) => new Blob([data], { type });

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
      data = "Uploaded Links\n---\n";
      data += (uploadedLinks ?? [])
        .map(link => `Title: ${link.title || 'N/A'}\nURL: ${link.url}\n---`)
        .join('\\n\\n');
      data += "\n\nAI Suggestions\n---\n";
      data += (latestAISuggestions ?? [])
        .map(link => `Title: ${link.title}\nURL: ${link.url}\nDescription: ${link.description}\nCategory: ${link.category}\nSource: ${link.source}\n---`)
        .join('\\n\\n');
      filenameSuffix = 'combined_export';
    } else {
      data = linksToExport
        .map(link => `Title: ${link.title}\nURL: ${link.url}\nDescription: ${link.description}\nCategory: ${link.category}\nSource: ${link.source}\n---`)
        .join('\\n\\n');
    }
    const blob = createBlob(data, 'text/plain;charset=utf-8');
    downloadFile(blob, `usefuls_${filenameSuffix}_${dateTimeStr}.txt`);
  };

  const handleExportCSV = (combined = false) => {
    const dateTimeStr = getCurrentDateTimeFormatted();
    const header = 'Title,URL,Description,Category,Source,Origin\\n';
    let rows = '';
    let filenameSuffix = 'export';

    if (combined && canExportCombined) {
      rows += (uploadedLinks ?? [])
        .map(link => `"${(link.title || 'N/A').replace(/"/g, '""')}","${link.url.replace(/"/g, '""')}","","","","Uploaded"`)
        .join('\\n');
      if ((uploadedLinks?.length ?? 0) > 0 && (latestAISuggestions?.length ?? 0) > 0) {
        rows += '\\n';
      }
      rows += (latestAISuggestions ?? [])
        .map(link => `"${link.title.replace(/"/g, '""')}","${link.url.replace(/"/g, '""')}","${link.description.replace(/"/g, '""')}","${link.category}","${link.source}","AI Generated"`)
        .join('\\n');
      filenameSuffix = 'combined_export';
    } else {
      rows = linksToExport
        .map(link => `"${link.title.replace(/"/g, '""')}","${link.url.replace(/"/g, '""')}","${link.description.replace(/"/g, '""')}","${link.category}","${link.source}","${link.source === 'ai' ? 'AI Generated' : 'Curated'}"`)
        .join('\\n');
    }
    const data = header + rows;
    const blob = createBlob(data, 'text/csv;charset=utf-8');
    downloadFile(blob, `usefuls_${filenameSuffix}_${dateTimeStr}.csv`);
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
    downloadFile(blob, `usefuls_${filenameSuffix}_${dateTimeStr}.json`);
  };

  const handleExportXLSX = async (combined = false) => {
    const dateTimeStr = getCurrentDateTimeFormatted();
    let excelSheetData;
    let filenameSuffix = 'export';
    let sheetName = 'Links';

    if (combined && canExportCombined) {
      const uploadedSheetItems = (uploadedLinks ?? []).map(link => ({
        Title: link.title || 'N/A',
        URL: link.url,
        Description: '',
        Category: '',
        Source: '',
        Origin: 'Uploaded',
      }));
      const aiSheetItems = (latestAISuggestions ?? []).map(link => ({
        Title: link.title,
        URL: link.url,
        Description: link.description,
        Category: link.category,
        Source: link.source,
        Origin: 'AI Generated',
      }));
      excelSheetData = [...uploadedSheetItems, ...aiSheetItems];
      filenameSuffix = 'combined_export';
      sheetName = 'Combined Links';
    } else {
      excelSheetData = linksToExport.map(link => ({
        ID: link.id,
        Title: link.title,
        URL: link.url,
        Description: link.description,
        Category: link.category,
        Source: link.source,
        Origin: link.source === 'ai' ? 'AI Generated' : 'Curated',
      }));
    }
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    const columns = [
      { header: 'Title', key: 'Title', width: 30 },
      { header: 'URL', key: 'URL', width: 50 },
      { header: 'Description', key: 'Description', width: 50 },
      { header: 'Category', key: 'Category', width: 20 },
      { header: 'Source', key: 'Source', width: 15 },
      { header: 'Origin', key: 'Origin', width: 15 },
    ];
    if (!combined) {
       columns.unshift({ header: 'ID', key: 'ID', width: 30 });
    }
    worksheet.columns = columns;
    worksheet.addRows(excelSheetData);

    try {
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = createBlob(buffer, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      downloadFile(blob, `usefuls_${filenameSuffix}_${dateTimeStr}.xlsx`);
    } catch (error) {
        console.error("Error exporting XLSX with exceljs:", error);
        toast({ title: "XLSX Export Error", description: "Could not generate XLSX file.", variant: "destructive" });
    }
  };

  const handleExportPNG = (combined = false) => {
    const dateTimeStr = getCurrentDateTimeFormatted();
    let filenameSuffix = 'export';
    if(combined && canExportCombined) {
      filenameSuffix = 'combined_export';
    }
    exportElementAsPNG('link-list-container', `usefuls_${filenameSuffix}_${dateTimeStr}.png`);
  };

  const canExportCombined = (uploadedLinks && uploadedLinks.length > 0) || (latestAISuggestions && latestAISuggestions.length > 0);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full">
          <Download className="mr-2 h-4 w-4" /> Export Links
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Current View</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => handleExportTXT()}>Export as TXT</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExportCSV()}>Export as CSV</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExportJSON()}>Export as JSON</DropdownMenuItem>
        <DropdownMenuItem onClick={async () => await handleExportXLSX()}>Export as XLSX</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExportPNG()}>Export as PNG</DropdownMenuItem>
        
        { canExportCombined ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Combined Export</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => handleExportTXT(true)}>Export Combined TXT</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExportCSV(true)}>Export Combined CSV</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExportJSON(true)}>Export Combined JSON</DropdownMenuItem>
            <DropdownMenuItem onClick={async () => await handleExportXLSX(true)}>Export Combined XLSX</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExportPNG(true)}>Export Combined PNG</DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
