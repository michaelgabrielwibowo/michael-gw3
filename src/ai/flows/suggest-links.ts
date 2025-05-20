
// src/ai/flows/suggest-links.ts
'use server';
/**
 * @fileOverview This file defines a Genkit flow for suggesting relevant links.
 * It can suggest links based on user-defined keywords, an array of categories, a desired count, and a list of existing links to avoid.
 * If no specific criteria are provided, it suggests random open-source/free links.
 * All links must be for open-source projects or free online resources.
 *
 * - suggestLinks - A function that takes optional keywords, categories, count, and existing links to suggest relevant new links.
 * - SuggestLinksInput - The input type for the suggestLinks function.
 * - SuggestLinksOutput - The output type for the suggestLinks function.
 */

import {ai} from '@/ai/genkit';
import { z } from 'zod'; // Corrected import
import { ALL_CATEGORIES } from '@/data/staticLinks';

const ExistingLinkSchema = z.object({
  title: z.string().optional().describe('The title of an existing link.'),
  url: z.string().describe('The URL of an existing link (primary identifier).'),
});

const SuggestLinksInputSchema = z.object({
  keywords: z.string().optional().describe('Optional keywords related to the desired links. If empty, suggest random links.'),
  category: z.array(z.string()).optional().describe('Optional array of categories of the links (e.g., learning, project repos, tools, videos). If empty or not provided, choose a random category or suggest from any category.'),
  count: z.number().min(1).max(20).default(5).describe('The number of new, unique links to suggest. Defaults to 5 if not specified.'),
  existingLinks: z.array(ExistingLinkSchema).optional().describe('An array of existing links (URL is primary key) to avoid suggesting duplicates. The AI should not suggest any link whose URL is in this list.'),
});
export type SuggestLinksInput = z.infer<typeof SuggestLinksInputSchema>;

const SuggestLinksOutputSchema = z.object({
  suggestedLinks: z
    .array(z.object({title: z.string(), url: z.string(), description: z.string()}))
    .describe('An array of suggested links with title, URL, and description. All links must be for open-source projects or free online resources (e.g., free e-books, tutorials). The number of links should match the requested count.'),
});
export type SuggestLinksOutput = z.infer<typeof SuggestLinksOutputSchema>;

export async function suggestLinks(input: SuggestLinksInput): Promise<SuggestLinksOutput> {
  return suggestLinksFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestLinksPrompt',
  input: {schema: SuggestLinksInputSchema},
  output: {schema: SuggestLinksOutputSchema},
  prompt: `You are an expert in finding relevant, open-source projects or free online resources (like free e-books, tutorials, documentation, open-source software tools).
Suggest exactly {{count}} new, unique links. Each link must have a title, URL, and a brief description.
Ensure all suggested links are genuinely open-source or completely free to access/use. For example, GitHub repositories for open-source projects, free online courses, free e-books, or free software tools.

{{#if keywords}}
Base your suggestions on the provided keywords: "{{keywords}}".
{{/if}}

{{#if category.length}}
Focus on the following categories:
{{#each category}}
- "{{this}}"
{{/each}}
{{else}}
You can pick a suitable category or suggest from any relevant category. Possible categories include: ${ALL_CATEGORIES.join(', ')}.
{{/if}}

{{#if existingLinks}}
IMPORTANT: Do NOT suggest any of the following links as they are already known. Avoid suggesting any link if its URL is present in this list:
{{#each existingLinks}}
- {{#if this.title}}Title: {{this.title}}, {{/if}}URL: {{this.url}}
{{/each}}
{{/if}}

Provide the suggested links in the specified JSON format.
`,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
       {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
    ],
  }
});

const suggestLinksFlow = ai.defineFlow(
  {
    name: 'suggestLinksFlow',
    inputSchema: SuggestLinksInputSchema,
    outputSchema: SuggestLinksOutputSchema,
  },
  async (input) => {
    const processedInput = {
        keywords: input.keywords || undefined,
        category: input.category && input.category.length > 0 ? input.category : undefined,
        count: input.count || 5, // Default to 5 if not provided
        existingLinks: input.existingLinks && input.existingLinks.length > 0 ? input.existingLinks : undefined,
    };
    const {output} = await prompt(processedInput);
    return output!;
  }
);
