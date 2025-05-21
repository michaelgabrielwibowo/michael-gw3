
'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
// Import types from @/types
import type { LinkItem, LinkCategory, ExistingLink, LinkDataItemForAI, SuggestLinksInput, SuggestLinksOutput, FilterLinksByKeywordInput, FilterLinksByKeywordOutput } from '@/types';
import { INITIAL_LINKS, CATEGORIES_INFO, ALL_CATEGORIES } from '@/data/staticLinks';

// Import flow functions
import { suggestLinks } from '@/ai/flows/suggest-links';
import { filterLinksByKeyword } from '@/ai/flows/filter-links-by-keyword-flow';

import { LinkList } from '@/components/LinkList';
import { FilterControls } from '@/components/FilterControls';
import { AISuggestionForm } from '@/components/AISuggestionForm';
import { ExportControls } from '@/components/ExportControls';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import { HelpCircle } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';


interface HomePageClientProps {
}

export default function HomePageClient({}: HomePageClientProps) {
  const [allLinks, setAllLinks] = useState<LinkItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('date-desc');
  const [isAISuggesting, setIsAISuggesting] = useState<boolean>(false);
  const { toast } = useToast();

  const [linksFromLastUpload, setLinksFromLastUpload] = useState<ExistingLink[]>([]);
  const [latestAiSuggestions, setLatestAiSuggestions] = useState<LinkItem[]>([]);

  // AI Keyword Search State
  const [searchKeywords, setSearchKeywords] = useState<string>('');
  const debouncedSearchKeywords = useDebounce(searchKeywords, 500);
  const [aiFilteredLinkIds, setAiFilteredLinkIds] = useState<Set<string> | null>(null);
  const [isAIFiltering, setIsAIFiltering] = useState<boolean>(false);

  useEffect(() => {
    setAllLinks(INITIAL_LINKS.map((link, index) => ({
      ...link,
      addedTimestamp: Date.now() - (INITIAL_LINKS.length - index) * 1000
    })));
  }, []);

  const handleAISuggest = async (
    keywords: string,
    preferredCategories: string[],
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
        const inputForAI: SuggestLinksInput = {
            keywords: keywords || undefined,
            preferredCategories: preferredCategories.length > 0 ? preferredCategories : undefined,
            validCategories: ALL_CATEGORIES,
            count: linkCount,
            existingLinks: uniqueExistingLinksForAI.length > 0 ? uniqueExistingLinksForAI : undefined,
        }
      const result: SuggestLinksOutput = await suggestLinks(inputForAI);

      if (result.suggestedLinks && result.suggestedLinks.length > 0) {
        const currentTimestamp = Date.now();
        const newLinks: LinkItem[] = result.suggestedLinks
          .filter(sl => !allLinks.some(al => al.url === sl.url))
          .map((suggestedLink, index) => {
            return {
              id: `ai-${currentTimestamp}-${index}`,
              title: suggestedLink.title,
              description: suggestedLink.description,
              url: suggestedLink.url,
              category: suggestedLink.category, 
              icon: CATEGORIES_INFO[suggestedLink.category]?.icon || CATEGORIES_INFO['Other']?.icon || HelpCircle,
              addedTimestamp: currentTimestamp + index,
            };
          });

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
            description: `${newLinks.length} new AI-suggested links have been added and categorized.`,
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
    } catch (error: any) {
      console.error("Error fetching AI suggestions:", error);
      toast({
        title: "AI Suggestion Failed",
        description: error.message || "There was an error fetching suggestions from the AI. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAISuggesting(false);
    }
  };
  
  useEffect(() => {
    if (debouncedSearchKeywords && debouncedSearchKeywords.trim() !== '') {
      const performAISearch = async () => {
        setIsAIFiltering(true);
        setAiFilteredLinkIds(null); 
        
        const linksToFilterForAI: LinkDataItemForAI[] = allLinks.map(link => ({
            id: link.id,
            title: link.title,
            description: link.description,
            url: link.url,
            category: link.category, 
            addedTimestamp: link.addedTimestamp
        }));

        try {
          const inputForFilter: FilterLinksByKeywordInput = {
            linksToFilter: linksToFilterForAI,
            searchKeywords: debouncedSearchKeywords,
          };
          const result: FilterLinksByKeywordOutput = await filterLinksByKeyword(inputForFilter);
          
          const relevantIds = new Set(result.relevantLinks.map(link => link.id));
          setAiFilteredLinkIds(relevantIds);
          if (relevantIds.size === 0) {
            toast({ title: "AI Search", description: "No links matched your keywords.", variant: "default"});
          }
        } catch (error: any) {
          console.error("Error during AI keyword filter:", error);
          toast({
            title: "AI Search Failed",
            description: error.message || "Could not filter links using AI. Please try again.",
            variant: "destructive",
          });
          setAiFilteredLinkIds(new Set()); 
        } finally {
          setIsAIFiltering(false);
        }
      };
      performAISearch();
    } else {
      setAiFilteredLinkIds(null); 
      setIsAIFiltering(false);
    }
  }, [debouncedSearchKeywords, allLinks, toast]);


  const filteredAndSortedLinks = useMemo(() => {
    let linksToProcess = [...allLinks];

    if (debouncedSearchKeywords.trim() !== '' && aiFilteredLinkIds !== null) {
        linksToProcess = linksToProcess.filter(link => aiFilteredLinkIds.has(link.id));
    } else if (debouncedSearchKeywords.trim() !== '' && isAIFiltering) {
        return []; 
    }

    if (selectedCategory !== 'All') {
      linksToProcess = linksToProcess.filter(link => link.category === selectedCategory);
    }

    switch (sortBy) {
      case 'title-asc':
        linksToProcess.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'title-desc':
        linksToProcess.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case 'category-asc':
        linksToProcess.sort((a, b) => {
          const catComp = a.category.localeCompare(b.category);
          if (catComp !== 0) return catComp;
          return a.title.localeCompare(b.title);
        });
        break;
      case 'date-asc': // First Added
        linksToProcess.sort((a, b) => (a.addedTimestamp || 0) - (b.addedTimestamp || 0));
        break;
      case 'date-desc': // Last Added
      default:
        linksToProcess.sort((a, b) => (b.addedTimestamp || 0) - (a.addedTimestamp || 0));
        break;
    }
    return linksToProcess;
  }, [allLinks, selectedCategory, sortBy, debouncedSearchKeywords, aiFilteredLinkIds, isAIFiltering]);

  const handleCategorySelect = useCallback((category: string) => {
    setSelectedCategory(category);
  }, []);

  const handleSortChange = useCallback((newSortBy: string) => {
    setSortBy(newSortBy);
  }, []);

  const handleKeywordChange = useCallback((keywords: string) => {
    setSearchKeywords(keywords);
  }, []);

  const getCategoryDisplayName = (categoryKey: string) => {
    return CATEGORIES_INFO[categoryKey as LinkCategory]?.name || categoryKey;
  };

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
              searchKeywords={searchKeywords}
              onKeywordChange={handleKeywordChange}
              selectedCategory={selectedCategory}
              onSelectCategory={handleCategorySelect}
              currentSort={sortBy}
              onSortChange={handleSortChange}
              isAIFiltering={isAIFiltering} 
              isAISearchActive={debouncedSearchKeywords.trim() !== ''}
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
              {debouncedSearchKeywords.trim() !== '' && ` Filtered by AI for keywords: "${debouncedSearchKeywords}".`}
              {selectedCategory !== 'All' && ` Further filtered by category: ${getCategoryDisplayName(selectedCategory)}.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isAIFiltering && debouncedSearchKeywords.trim() !== '' ? (
                <div className="text-center py-10 text-muted-foreground">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin mb-2" />
                    <p className="text-xl">AI is filtering links...</p>
                </div>
            ) : (
                <LinkList links={filteredAndSortedLinks} />
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

// Loader2 icon component (can be moved to a shared ui/icons file if used elsewhere)
const Loader2 = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);
