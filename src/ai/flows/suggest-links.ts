// src/ai/flows/suggest-links.ts
'use server';
/**
 * @fileOverview This file defines a Genkit flow for suggesting relevant links based on user-defined keywords.
 *
 * - suggestLinks - A function that takes keywords and categories to suggest relevant links.
 * - SuggestLinksInput - The input type for the suggestLinks function.
 * - SuggestLinksOutput - The output type for the suggestLinks function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestLinksInputSchema = z.object({
  keywords: z.string().describe('Keywords related to the desired links.'),
  category: z.string().describe('Category of the links (e.g., learning, project repos, tools, videos).'),
});
export type SuggestLinksInput = z.infer<typeof SuggestLinksInputSchema>;

const SuggestLinksOutputSchema = z.object({
  suggestedLinks: z
    .array(z.object({title: z.string(), url: z.string(), description: z.string()}))
    .describe('An array of suggested links with title, URL, and description.'),
});
export type SuggestLinksOutput = z.infer<typeof SuggestLinksOutputSchema>;

export async function suggestLinks(input: SuggestLinksInput): Promise<SuggestLinksOutput> {
  return suggestLinksFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestLinksPrompt',
  input: {schema: SuggestLinksInputSchema},
  output: {schema: SuggestLinksOutputSchema},
  prompt: `You are an expert in finding relevant links based on user-defined keywords for different categories.

  Based on the provided keywords and category, suggest a list of relevant links. Each link should include a title, URL, and a brief description.

  Category: {{{category}}}
  Keywords: {{{keywords}}}

  Please provide the suggested links in the following JSON format:
  {
    "suggestedLinks": [
      {
        "title": "Link Title",
        "url": "Link URL",
        "description": "Link Description"
      }
    ]
  }`,
});

const suggestLinksFlow = ai.defineFlow(
  {
    name: 'suggestLinksFlow',
    inputSchema: SuggestLinksInputSchema,
    outputSchema: SuggestLinksOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
