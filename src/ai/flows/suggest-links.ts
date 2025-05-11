
// src/ai/flows/suggest-links.ts
'use server';
/**
 * @fileOverview This file defines a Genkit flow for suggesting relevant links.
 * It can suggest links based on user-defined keywords and categories, or suggest random open-source/free links if no specific criteria are provided.
 *
 * - suggestLinks - A function that takes optional keywords and categories to suggest relevant links.
 * - SuggestLinksInput - The input type for the suggestLinks function.
 * - SuggestLinksOutput - The output type for the suggestLinks function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { ALL_CATEGORIES } from '@/data/staticLinks';

const SuggestLinksInputSchema = z.object({
  keywords: z.string().optional().describe('Optional keywords related to the desired links. If empty, suggest random links.'),
  category: z.string().optional().describe('Optional category of the links (e.g., learning, project repos, tools, videos). If empty, choose a random category or suggest from any category.'),
});
export type SuggestLinksInput = z.infer<typeof SuggestLinksInputSchema>;

const SuggestLinksOutputSchema = z.object({
  suggestedLinks: z
    .array(z.object({title: z.string(), url: z.string(), description: z.string()}))
    .describe('An array of suggested links with title, URL, and description. All links must be for open-source projects or free online resources (e.g., free e-books, tutorials).'),
});
export type SuggestLinksOutput = z.infer<typeof SuggestLinksOutputSchema>;

export async function suggestLinks(input: SuggestLinksInput): Promise<SuggestLinksOutput> {
  return suggestLinksFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestLinksPrompt',
  input: {schema: SuggestLinksInputSchema},
  output: {schema: SuggestLinksOutputSchema},
  prompt: `You are an expert in finding relevant links. All suggested links MUST be for open-source projects or free online resources (e.g., free e-books, tutorials, documentation, open-source software tools).

  {{#if keywords}}
  Based on the provided keywords "{{keywords}}"
  {{else}}
  Suggest some interesting and useful random open-source projects or free online resources.
  {{/if}}

  {{#if category}}
  for the category "{{category}}".
  {{else}}
  You can pick a suitable category or suggest from any relevant category. Possible categories include: ${ALL_CATEGORIES.join(', ')}.
  {{/if}}
  
  Each link should include a title, URL, and a brief description.

  Please provide the suggested links in the following JSON format:
  {
    "suggestedLinks": [
      {
        "title": "Link Title",
        "url": "Link URL",
        "description": "Link Description (ensure it's open-source or free)"
      }
    ]
  }`,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE', // Allow broader suggestions, but still expect open-source/free
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
    // If category is not provided, we can either let the LLM choose, 
    // or pick one randomly here. For now, we'll let the LLM handle it based on the prompt.
    const processedInput = {
        keywords: input.keywords || "", // Pass empty string if undefined
        category: input.category || "", // Pass empty string if undefined
    };
    const {output} = await prompt(processedInput);
    return output!;
  }
);
