
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
  linksToExport: LinkItem[]; // These are the currently filtered/sorted links visible to the user
  uploadedLinks?: ExistingLink[]; // Links from the last file upload via AISuggestionForm
}

export function ExportControls({ linksToExport, uploadedLinks }: ExportControlsProps) {
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

  const handleExportTXT = (forCombinedExport = false) => {
    const dateTimeStr = getCurrentDateTimeFormatted();
    let data = "";
    let filenameSuffix = 'current_view_export';

    if (forCombinedExport && canExportCombined) {
      filenameSuffix = 'combined_export';
      if (uploadedLinks && uploadedLinks.length > 0) {
        data += "Uploaded Links (from form)\n---\n";
        data += uploadedLinks
          .map(link => `Title: ${link.title || 'N/A'}\nURL: ${link.url}\n---`)
          .join('\\n\\n');
        if (linksToExport.length > 0) data += "\\n\\nLinks from Collection\n---\n";
      }
    }
    
    data += linksToExport
      .map(link => `Title: ${link.title}\nURL: ${link.url}\nDescription: ${link.description}\nCategory: ${link.category}\n---`) // Source/Origin removed
      .join('\\n\\n');
      
    const blob = createBlob(data, 'text/plain;charset=utf-8');
    downloadFile(blob, `usefuls_${filenameSuffix}_${dateTimeStr}.txt`);
  };

  const handleExportCSV = (forCombinedExport = false) => {
    const dateTimeStr = getCurrentDateTimeFormatted();
    // Source and Origin columns removed
    const header = 'Title,URL,Description,Category\\n';
    let rows = '';
    let filenameSuffix = 'current_view_export';

    if (forCombinedExport && canExportCombined) {
        filenameSuffix = 'combined_export';
        if (uploadedLinks && uploadedLinks.length > 0) {
             rows += uploadedLinks
            .map(link => `"${(link.title || 'N/A').replace(/"/g, '""')}","${link.url.replace(/"/g, '""')}","",""`) // No desc/cat for uploaded
            .join('\\n');
            if (linksToExport.length > 0) rows += '\\n';
        }
    }

    rows += linksToExport
      .map(link => `"${link.title.replace(/"/g, '""')}","${link.url.replace(/"/g, '""')}","${link.description.replace(/"/g, '""')}","${link.category}"`)
      .join('\\n');
      
    const data = header + rows;
    const blob = createBlob(data, 'text/csv;charset=utf-8');
    downloadFile(blob, `usefuls_${filenameSuffix}_${dateTimeStr}.csv`);
  };
  
  const handleExportJSON = (forCombinedExport = false) => {
    const dateTimeStr = getCurrentDateTimeFormatted();
    let exportData;
    let filenameSuffix = 'current_view_export';

    const cleanLinksForExport = (links: LinkItem[]) => links.map(({ source, ...rest }) => rest); // Remove source if it existed

    if (forCombinedExport && canExportCombined) {
      filenameSuffix = 'combined_export';
      exportData = {
        uploadedLinksFromForm: uploadedLinks || [],
        currentLinkCollection: cleanLinksForExport(linksToExport),
      };
    } else {
      exportData = cleanLinksForExport(linksToExport);
    }
    const data = JSON.stringify(exportData, null, 2);
    const blob = createBlob(data, 'application/json;charset=utf-8');
    downloadFile(blob, `usefuls_${filenameSuffix}_${dateTimeStr}.json`);
  };

  const handleExportXLSX = async (forCombinedExport = false) => {
    const dateTimeStr = getCurrentDateTimeFormatted();
    const workbook = new ExcelJS.Workbook();
    let filenameSuffix = 'current_view_export';
    
    if (forCombinedExport && canExportCombined) {
        filenameSuffix = 'combined_export';
        if (uploadedLinks && uploadedLinks.length > 0) {
            const uploadedSheet = workbook.addWorksheet('Uploaded Links (from form)');
            uploadedSheet.columns = [
                { header: 'Title', key: 'Title', width: 30 },
                { header: 'URL', key: 'URL', width: 50 },
            ];
            uploadedSheet.addRows(uploadedLinks.map(link => ({
                Title: link.title || 'N/A',
                URL: link.url,
            })));
        }
    }

    const collectionSheet = workbook.addWorksheet(forCombinedExport ? 'Current Link Collection' : 'Links');
    // Source and Origin columns removed
    collectionSheet.columns = [
      { header: 'ID', key: 'ID', width: 30 },
      { header: 'Title', key: 'Title', width: 30 },
      { header: 'URL', key: 'URL', width: 50 },
      { header: 'Description', key: 'Description', width: 50 },
      { header: 'Category', key: 'Category', width: 20 },
      { header: 'Added Timestamp', key: 'AddedTimestamp', width: 20}
    ];
    collectionSheet.addRows(linksToExport.map(link => ({
      ID: link.id,
      Title: link.title,
      URL: link.url,
      Description: link.description,
      Category: link.category,
      AddedTimestamp: link.addedTimestamp ? new Date(link.addedTimestamp).toISOString() : ''
    })));

    try {
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = createBlob(buffer, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      downloadFile(blob, `usefuls_${filenameSuffix}_${dateTimeStr}.xlsx`);
    } catch (error) {
        console.error("Error exporting XLSX with exceljs:", error);
        toast({ title: "XLSX Export Error", description: "Could not generate XLSX file.", variant: "destructive" });
    }
  };

  const handleExportPNG = () => { // PNG export doesn't have combined/current view distinction, it captures the current list
    const dateTimeStr = getCurrentDateTimeFormatted();
    exportElementAsPNG('link-list-container', `usefuls_link_list_${dateTimeStr}.png`);
  };

  // Combined export is possible if there are uploaded links to combine with the current collection
  const canExportCombined = uploadedLinks && uploadedLinks.length > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full">
          <Download className="mr-2 h-4 w-4" /> Export Links
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Current View ({linksToExport.length} links)</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => handleExportTXT()}>Export as TXT</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExportCSV()}>Export as CSV</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExportJSON()}>Export as JSON</DropdownMenuItem>
        <DropdownMenuItem onClick={async () => await handleExportXLSX()}>Export as XLSX</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExportPNG()}>Export as PNG</DropdownMenuItem>
        
        { canExportCombined && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Combined Data</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => handleExportTXT(true)}>TXT (Uploaded + Current)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExportCSV(true)}>CSV (Uploaded + Current)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExportJSON(true)}>JSON (Uploaded + Current)</DropdownMenuItem>
            <DropdownMenuItem onClick={async () => await handleExportXLSX(true)}>XLSX (Uploaded + Current)</DropdownMenuItem>
            {/* PNG is always current view, so no specific combined PNG option */}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
