
'use client';

import type { LinkItem, ExistingLink } from '@/types';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';

interface ExportControlsProps {
  linksToExport: LinkItem[];
  uploadedLinks?: ExistingLink[];
  latestAISuggestions?: LinkItem[];
}

export function ExportControls({ linksToExport, uploadedLinks, latestAISuggestions }: ExportControlsProps) {
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
          backgroundColor: getComputedStyle(document.body).getPropertyValue('--background') || '#FFFFFF', // Default to white if CSS var not found
          scale: 1.5, // Increase scale for better quality
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

  const handleExportTXT = () => {
    const dateTimeStr = getCurrentDateTimeFormatted();
    const data = linksToExport
      .map(link => `Title: ${link.title}\nURL: ${link.url}\nDescription: ${link.description}\nCategory: ${link.category}\nSource: ${link.source}\n---`)
      .join('\n\n');
    const blob = createBlob(data, 'text/plain;charset=utf-8');
    downloadFile(blob, `linksage_export_${dateTimeStr}.txt`);
  };

  const handleExportCSV = () => {
    const dateTimeStr = getCurrentDateTimeFormatted();
    const header = 'ID,Title,URL,Description,Category,Source\n';
    const rows = linksToExport
      .map(link => `"${link.id}","${link.title.replace(/"/g, '""')}","${link.url}","${link.description.replace(/"/g, '""')}","${link.category}","${link.source}"`)
      .join('\n');
    const data = header + rows;
    const blob = createBlob(data, 'text/csv;charset=utf-8');
    downloadFile(blob, `linksage_export_${dateTimeStr}.csv`);
  };
  
  const handleExportJSON = () => {
    const dateTimeStr = getCurrentDateTimeFormatted();
    const data = JSON.stringify(linksToExport, null, 2);
    const blob = createBlob(data, 'application/json;charset=utf-8');
    downloadFile(blob, `linksage_export_${dateTimeStr}.json`);
  };

  const handleExportPNG = () => {
    const dateTimeStr = getCurrentDateTimeFormatted();
    exportElementAsPNG('link-list-container', `linksage_export_${dateTimeStr}.png`);
  };

  const handleExportCombinedTXT = () => {
    if (!uploadedLinks || !latestAISuggestions) return;
    const dateTimeStr = getCurrentDateTimeFormatted();

    let data = "Uploaded Links:\n---\n";
    data += uploadedLinks
      .map(link => `Title: ${link.title || 'N/A'}\nURL: ${link.url}\n---`)
      .join('\n\n');
    
    data += "\n\nNewly Suggested AI Links:\n---\n";
    data += latestAISuggestions
      .map(link => `Title: ${link.title}\nURL: ${link.url}\nDescription: ${link.description}\nCategory: ${link.category}\nSource: ${link.source}\n---`)
      .join('\n\n');

    const blob = createBlob(data, 'text/plain;charset=utf-8');
    downloadFile(blob, `linksage_combined_export_${dateTimeStr}.txt`);
  };

  const handleExportCombinedCSV = () => {
    if (!uploadedLinks || !latestAISuggestions) return;
    const dateTimeStr = getCurrentDateTimeFormatted();

    const header = 'Title,URL,Description,Category,Source,Origin\n';
    let rows = '';

    rows += uploadedLinks
      .map(link => `"${(link.title || '').replace(/"/g, '""')}","${link.url.replace(/"/g, '""')}","","","","Uploaded"`)
      .join('\n');
    
    if (uploadedLinks.length > 0 && latestAISuggestions.length > 0) {
      rows += '\n'; // Add a newline if both lists have content
    }

    rows += latestAISuggestions
      .map(link => `"${link.title.replace(/"/g, '""')}","${link.url.replace(/"/g, '""')}","${link.description.replace(/"/g, '""')}","${link.category}","${link.source}","AI Generated"`)
      .join('\n');

    const data = header + rows;
    const blob = createBlob(data, 'text/csv;charset=utf-8');
    downloadFile(blob, `linksage_combined_export_${dateTimeStr}.csv`);
  };
  
  const handleExportCombinedJSON = () => {
    if (!uploadedLinks || !latestAISuggestions) return;
    const dateTimeStr = getCurrentDateTimeFormatted();
    const combinedData = {
      uploadedLinks: uploadedLinks,
      newlySuggestedAILinks: latestAISuggestions,
    };
    const data = JSON.stringify(combinedData, null, 2);
    const blob = createBlob(data, 'application/json;charset=utf-8');
    downloadFile(blob, `linksage_combined_export_${dateTimeStr}.json`);
  };

  const handleExportCombinedPNG = () => {
    // This action is guarded by canExportCombined in the DropdownMenuItem.
    // It exports the current view of 'link-list-container' with a "combined" filename.
    // The 'link-list-container' will show 'latestAISuggestions' if they've been added to 'allLinks',
    // but it won't explicitly show 'uploadedLinks' separately unless the UI is designed to do so.
    const dateTimeStr = getCurrentDateTimeFormatted();
    exportElementAsPNG('link-list-container', `linksage_combined_export_${dateTimeStr}.png`);
  };

  const canExportCombined = uploadedLinks && uploadedLinks.length > 0 && latestAISuggestions && latestAISuggestions.length > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full">
          <Download className="mr-2 h-4 w-4" /> Export Links
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Current View</DropdownMenuLabel>
        <DropdownMenuItem onClick={handleExportTXT}>Export as TXT</DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportCSV}>Export as CSV</DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportJSON}>Export as JSON</DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportPNG}>Export as PNG</DropdownMenuItem>
        
        { (uploadedLinks && uploadedLinks.length > 0) || (latestAISuggestions && latestAISuggestions.length > 0) ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Combined with Uploaded</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={handleExportCombinedTXT}
              disabled={!canExportCombined}
            >
              Export Combined (TXT)
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleExportCombinedCSV}
              disabled={!canExportCombined}
            >
              Export Combined (CSV)
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleExportCombinedJSON}
              disabled={!canExportCombined}
            >
              Export Combined (JSON)
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleExportCombinedPNG}
              disabled={!canExportCombined}
            >
              Export Combined (PNG)
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
