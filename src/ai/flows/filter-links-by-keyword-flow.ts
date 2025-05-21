'use server';
/**
 * @fileOverview A Genkit flow to filter a list of links based on keywords.
 *
 * - filterLinksByKeyword - A function that takes links and keywords and returns relevant links.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { FilterLinksByKeywordInput, FilterLinksByKeywordOutput } from '@/types'; // Import from shared types

// Internal Zod schema for the AI prompt's input (not exported)
const AIPromptInputSchema = z.object({
  linksToFilter: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().optional(),
    url: z.string(),
    category: z.string().optional(),
  })).describe('An array of link objects to filter.'),
  searchKeywords: z.string().describe('Keywords to filter the links by. Links relevant to these keywords should be returned.'),
});

// Internal Zod schema for the AI prompt's output (not exported)
const AIPromptOutputSchema = z.object({
  relevantLinkIds: z.array(z.string()).describe('An array of IDs of the links that are relevant to the searchKeywords.'),
});

// Zod schema for the flow's input, used internally by Genkit (not exported)
const InternalFilterLinksByKeywordInputSchema = z.object({
    linksToFilter: z.array(z.object({
        id: z.string(),
        title: z.string(),
        description: z.string(),
        url: z.string(),
        category: z.string(),
        addedTimestamp: z.number().optional(),
    })),
    searchKeywords: z.string(),
});

// Zod schema for the flow's output, used internally by Genkit (not exported)
const InternalFilterLinksByKeywordOutputSchema = z.object({
  relevantLinks: z.array(z.object({
    id: z.string(),
  })),
});

const filterPrompt = ai.definePrompt({
  name: 'filterLinksByKeywordPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: { schema: AIPromptInputSchema },
  output: { schema: AIPromptOutputSchema },
  prompt: `You are a link filtering assistant. Given a list of links and search keywords, identify which links are relevant to the keywords.
Only return the IDs of the relevant links.

Links to filter:
{{#each linksToFilter}}
- ID: {{this.id}}, Title: "{{this.title}}", Description: "{{this.description}}", URL: {{this.url}}, Category: {{this.category}}
{{/each}}

Search Keywords: "{{searchKeywords}}"

Return ONLY an array of IDs for the links that are relevant to the search keywords. If no links are relevant, return an empty array.
Consider the title, description, URL, and category of each link for relevance.
`,
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    ],
  }
});

const filterLinksFlow = ai.defineFlow(
  {
    name: 'filterLinksByKeywordFlow',
    inputSchema: InternalFilterLinksByKeywordInputSchema,
    outputSchema: InternalFilterLinksByKeywordOutputSchema,
  },
  async (input: FilterLinksByKeywordInput): Promise<FilterLinksByKeywordOutput> => {
    if (!input.searchKeywords.trim() || input.linksToFilter.length === 0) {
      if (!input.searchKeywords.trim()) {
          return { relevantLinks: input.linksToFilter.map(link => ({ id: link.id })) };
      }
      return { relevantLinks: [] };
    }

    const linksForAIPrompt = input.linksToFilter.map(link => ({
      id: link.id,
      title: link.title,
      description: link.description || undefined,
      url: link.url,
      category: link.category || undefined,
    }));

    const promptInputForAI: z.infer<typeof AIPromptInputSchema> = {
      linksToFilter: linksForAIPrompt,
      searchKeywords: input.searchKeywords,
    };

    const response = await filterPrompt(promptInputForAI);

    if (!response || !response.output || !response.output.relevantLinkIds) {
      console.error('AI prompt for filtering returned no/malformed output. Response:', JSON.stringify(response, null, 2));
      return { relevantLinks: [] };
    }

    const relevantLinksOutput = response.output.relevantLinkIds.map(id => ({ id }));

    return { relevantLinks: relevantLinksOutput };
  }
);

export async function filterLinksByKeyword(input: FilterLinksByKeywordInput): Promise<FilterLinksByKeywordOutput> {
  return filterLinksFlow(input);
}
