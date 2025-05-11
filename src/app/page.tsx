'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import type { LinkItem, LinkCategory, ExistingLink } from '@/types';
import { INITIAL_LINKS, CATEGORIES_INFO } from '@/data/staticLinks';
import { suggestLinks, SuggestLinksOutput } from '@/ai/flows/suggest-links';
import { AppLayout } from '@/components/AppLayout';
import { LinkList } from '@/components/LinkList';
import { FilterControls } from '@/components/FilterControls';
import { AISuggestionForm } from '@/components/AISuggestionForm';
import { ExportControls } from '@/components/ExportControls';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import { Globe } from 'lucide-react'; 

export default function HomePage() {
  const [allLinks, setAllLinks] = useState<LinkItem[]>(INITIAL_LINKS);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('title-asc');
  const [isAISuggesting, setIsAISuggesting] = useState<boolean>(false);
  const { toast } = useToast();

  const [linksFromLastUpload, setLinksFromLastUpload] = useState<ExistingLink[]>([]);
  const [latestAiSuggestions, setLatestAiSuggestions] = useState<LinkItem[]>([]);


  useEffect(() => {
    // Ensure initial links are set on client, even if empty
    setAllLinks(INITIAL_LINKS);
  }, []);
  
  const handleAISuggest = async (
    keywords: string, 
    category: LinkCategory | '', 
    linkCount: number,
    existingLinksFromForm: ExistingLink[]
  ) => {
    setIsAISuggesting(true);
    setLinksFromLastUpload(existingLinksFromForm); // Store for combined export
    setLatestAiSuggestions([]); // Clear previous batch

    try {
      const result: SuggestLinksOutput = await suggestLinks({ 
        keywords: keywords || undefined, 
        category: category || undefined,
        count: linkCount,
        existingLinks: existingLinksFromForm.length > 0 ? existingLinksFromForm : undefined,
      });

      if (result.suggestedLinks && result.suggestedLinks.length > 0) {
        const newLinks: LinkItem[] = result.suggestedLinks.map((suggestedLink, index) => ({
          id: `ai-${Date.now()}-${index}`, // Ensure unique ID
          title: suggestedLink.title,
          description: suggestedLink.description,
          url: suggestedLink.url,
          category: 'AI Generated', // All AI suggestions go to this category
          icon: CATEGORIES_INFO['AI Generated']?.icon || Globe,
          source: 'ai',
        }));
        setLatestAiSuggestions(newLinks); // Store current batch for combined export
        setAllLinks(prevLinks => [...prevLinks, ...newLinks]);
        toast({
          title: "AI Suggestions Added",
          description: `${newLinks.length} new link(s) suggested by AI.`,
          variant: "default",
        });
      } else {
        toast({
          title: "No New Suggestions Found",
          description: "AI could not find new relevant open-source/free links based on your criteria.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error fetching AI suggestions:", error);
      toast({
        title: "AI Suggestion Failed",
        description: "There was an error getting suggestions from AI. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAISuggesting(false);
    }
  };

  const filteredAndSortedLinks = useMemo(() => {
    let links = [...allLinks];

    if (selectedCategory !== 'All') {
      links = links.filter(link => link.category === selectedCategory);
    }

    switch (sortBy) {
      case 'title-asc':
        links.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'title-desc':
        links.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case 'category-asc':
        links.sort((a, b) => {
          const catComp = a.category.localeCompare(b.category);
          if (catComp !== 0) return catComp;
          return a.title.localeCompare(b.title);
        });
        break;
      case 'source-asc': // Curated first
        links.sort((a,b) => {
          if (a.source === 'curated' && b.source === 'ai') return -1;
          if (a.source === 'ai' && b.source === 'curated') return 1;
          return a.title.localeCompare(b.title);
        });
        break;
      case 'source-desc': // AI first
        links.sort((a,b) => {
          if (a.source === 'ai' && b.source === 'curated') return -1;
          if (a.source === 'curated' && b.source === 'ai') return 1;
          return a.title.localeCompare(b.title);
        });
        break;
      default:
        // Default sort by title if sortBy is unrecognized
        links.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }
    return links;
  }, [allLinks, selectedCategory, sortBy]);

  const handleCategorySelect = useCallback((category: string) => {
    setSelectedCategory(category);
  }, []);

  const handleSortChange = useCallback((newSortBy: string) => {
    setSortBy(newSortBy);
  }, []);


  return (
    <AppLayout>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-4 xl:col-span-3 space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>AI Link Suggestions</CardTitle>
              <CardDescription>Get new open-source/free link ideas. Optionally upload existing links to avoid duplicates. You can export new suggestions combined with your uploaded list via the "Export Links" section.</CardDescription>
            </CardHeader>
            <CardContent>
              <AISuggestionForm 
                onSuggest={handleAISuggest} 
                isLoading={isAISuggesting} 
              />
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Filter & Sort</CardTitle>
              <CardDescription>Refine your view of the links.</CardDescription>
            </CardHeader>
            <CardContent>
              <FilterControls
                selectedCategory={selectedCategory}
                onSelectCategory={handleCategorySelect}
                currentSort={sortBy}
                onSortChange={handleSortChange}
              />
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Export Data</CardTitle>
              <CardDescription>Download the current list of links.</CardDescription>
            </CardHeader>
            <CardContent>
              <ExportControls 
                linksToExport={filteredAndSortedLinks} 
                uploadedLinks={linksFromLastUpload}
                latestAISuggestions={latestAiSuggestions}
              />
            </CardContent>
          </Card>
        </aside>

        <section className="lg:col-span-8 xl:col-span-9">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Link Collection</CardTitle>
              <CardDescription>
                Showing {filteredAndSortedLinks.length} of {allLinks.length} total links. 
                {selectedCategory !== 'All' && ` Filtered by "${selectedCategory}".`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LinkList links={filteredAndSortedLinks} />
            </CardContent>
          </Card>
        </section>
      </div>
    </AppLayout>
  );
}
