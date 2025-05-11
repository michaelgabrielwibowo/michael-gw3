'use client';

import type { LinkItem } from '@/types';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download } from 'lucide-react';
import html2canvas from 'html2canvas';

interface ExportControlsProps {
  linksToExport: LinkItem[];
}

export function ExportControls({ linksToExport }: ExportControlsProps) {
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

  const handleExportTXT = () => {
    const data = linksToExport
      .map(link => `Title: ${link.title}\nURL: ${link.url}\nDescription: ${link.description}\nCategory: ${link.category}\nSource: ${link.source}\n---`)
      .join('\n\n');
    const blob = createBlob(data, 'text/plain;charset=utf-8');
    downloadFile(blob, 'linksage_export.txt');
  };

  const handleExportCSV = () => {
    const header = 'ID,Title,URL,Description,Category,Source\n';
    const rows = linksToExport
      .map(link => `"${link.id}","${link.title.replace(/"/g, '""')}","${link.url}","${link.description.replace(/"/g, '""')}","${link.category}","${link.source}"`)
      .join('\n');
    const data = header + rows;
    const blob = createBlob(data, 'text/csv;charset=utf-8');
    downloadFile(blob, 'linksage_export.csv');
  };

  const handleExportPNG = async () => {
    const elementToCapture = document.getElementById('link-list-container');
    if (elementToCapture) {
      try {
        const canvas = await html2canvas(elementToCapture, {
          backgroundColor: getComputedStyle(document.body).getPropertyValue('--background') || '#F5F5F5', // Use theme background
          scale: 1.5, // Increase scale for better quality
        });
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = 'linksage_export.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error('Error exporting to PNG:', error);
        alert('Failed to export as PNG. Check console for details.');
      }
    } else {
      alert('Could not find element to export. Ensure links are visible.');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full">
          <Download className="mr-2 h-4 w-4" /> Export Links
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuItem onClick={handleExportTXT}>Export as TXT</DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportCSV}>Export as CSV</DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportPNG}>Export as PNG</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
