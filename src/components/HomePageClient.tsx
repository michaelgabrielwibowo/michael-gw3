
'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import type { LinkItem, LinkCategory, ExistingLink } from '@/types';
import { INITIAL_LINKS, CATEGORIES_INFO } from '@/data/staticLinks';
import { suggestLinks, SuggestLinksOutput } from '@/ai/flows/suggest-links';
// AppLayout is now used in src/app/page.tsx, wrapping this component
import { LinkList } from '@/components/LinkList';
import { FilterControls } from '@/components/FilterControls';
import { AISuggestionForm } from '@/components/AISuggestionForm';
import { ExportControls } from '@/components/ExportControls';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import { Lightbulb } from 'lucide-react'; 

// Props no longer include locale or messages
interface HomePageClientProps {}

export default function HomePageClient({}: HomePageClientProps) {
  const [allLinks, setAllLinks] = useState<LinkItem[]>([]); 
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('date-desc');
  const [isAISuggesting, setIsAISuggesting] = useState<boolean>(false);
  const { toast } = useToast();

  const [linksFromLastUpload, setLinksFromLastUpload] = useState<ExistingLink[]>([]);
  const [latestAiSuggestions, setLatestAiSuggestions] = useState<LinkItem[]>([]);

  useEffect(() => {
    setAllLinks(INITIAL_LINKS.map((link, index) => ({
      ...link, 
      addedTimestamp: Date.now() - (INITIAL_LINKS.length - index) * 1000 
    })));
  }, []);
  
  const handleAISuggest = async (
    keywords: string, 
    categories: string[], // Changed from LinkCategory | '' to string[]
    linkCount: number,
    existingLinksFromForm: ExistingLink[]
  ) => {
    setIsAISuggesting(true);
    setLinksFromLastUpload(existingLinksFromForm); 
    setLatestAiSuggestions([]);

    const allCurrentAppLinksForAI: ExistingLink[] = allLinks.map(link => ({ url: link.url, title: link.title }));
    const combinedExistingLinks = [...allCurrentAppLinksForAI, ...existingLinksFromForm];
    
    const uniqueExistingLinksMap = new Map<string, ExistingLink>();
    combinedExistingLinks.forEach(link => {
        if (!uniqueExistingLinksMap.has(link.url) || (link.title && !uniqueExistingLinksMap.get(link.url)?.title)) {
            uniqueExistingLinksMap.set(link.url, link);
        }
    });
    const uniqueExistingLinksForAI = Array.from(uniqueExistingLinksMap.values());

    try {
      const result: SuggestLinksOutput = await suggestLinks({ 
        keywords: keywords || undefined, 
        category: categories.length > 0 ? categories : undefined, // Pass array or undefined
        count: linkCount,
        existingLinks: uniqueExistingLinksForAI.length > 0 ? uniqueExistingLinksForAI : undefined,
      });

      if (result.suggestedLinks && result.suggestedLinks.length > 0) {
        const currentTimestamp = Date.now();
        const newLinks: LinkItem[] = result.suggestedLinks
          .filter(sl => !allLinks.some(al => al.url === sl.url)) // Avoid client-side duplicates too
          .map((suggestedLink, index) => ({
            id: `ai-${currentTimestamp}-${index}`, 
            title: suggestedLink.title,
            description: suggestedLink.description,
            url: suggestedLink.url,
            category: 'AI Generated', 
            icon: CATEGORIES_INFO['AI Generated']?.icon || Lightbulb,
            source: 'ai',
            addedTimestamp: currentTimestamp + index, 
        }));

        if (newLinks.length > 0) {
            setLatestAiSuggestions(newLinks); 
            setAllLinks(prevLinks => {
              const newCombinedLinks = [...prevLinks];
              newLinks.forEach(newLink => {
                if (!newCombinedLinks.some(existingLink => existingLink.url === newLink.url)) {
                  newCombinedLinks.push(newLink);
                }
              });
              return newCombinedLinks;
            });
            toast({
              title: "AI Suggestions Added",
              description: `${newLinks.length} new AI-suggested links have been added.`,
              variant: "default",
            });
        } else {
             toast({
              title: "No New Unique Suggestions",
              description: "The AI did not find any new unique links based on your criteria and existing links.",
              variant: "default",
            });
        }
      } else {
        toast({
          title: "No New Suggestions",
          description: "The AI could not find any new links based on your criteria.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error fetching AI suggestions:", error);
      toast({
        title: "AI Suggestion Failed",
        description: "There was an error fetching suggestions from the AI. Please try again.",
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
      case 'date-asc': 
        links.sort((a, b) => (a.addedTimestamp || 0) - (b.addedTimestamp || 0));
        break;
      case 'date-desc': 
      default:
        links.sort((a, b) => (b.addedTimestamp || 0) - (a.addedTimestamp || 0));
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-4 xl:col-span-3 space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>AI Link Suggestions</CardTitle>
              <CardDescription>Get new open-source/free link ideas. Optionally upload existing links to avoid duplicates.</CardDescription>
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
              <CardTitle>Filter & Sort Links</CardTitle>
              <CardDescription>Organize your link collection.</CardDescription>
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
              <CardDescription>Download your links in various formats.</CardDescription>
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
                Displaying {filteredAndSortedLinks.length} of {allLinks.length} total links.
                {selectedCategory !== 'All' && ` Filtered by: ${CATEGORIES_INFO[selectedCategory as LinkCategory]?.name || selectedCategory}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LinkList links={filteredAndSortedLinks} />
            </CardContent>
          </Card>
        </section>
      </div>
  );
}

