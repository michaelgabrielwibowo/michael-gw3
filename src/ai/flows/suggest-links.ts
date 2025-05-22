
// src/ai/flows/suggest-links.ts
'use server';
/**
 * @fileOverview This file defines a Genkit flow for suggesting relevant links.
 * It suggests links based on user-defined keywords, an array of categories, a desired count,
 * and a list of existing links to avoid. If no specific criteria are provided, it suggests random links.
 * All links must be for open-source projects or free online resources.
 * The AI will attempt to categorize each link into one of the functional categories.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { ALL_CATEGORIES, CATEGORIES_INFO } from '@/data/staticLinks';
import type { LinkCategory, ExistingLink, SuggestLinksInput as PublicSuggestLinksInput, SuggestLinksOutput as PublicSuggestLinksOutput } from '@/types'; // Renamed to avoid conflict

// Schema for data sent TO the AI prompt
const AIPromptInputSchema = z.object({
  keywords: z.string().optional().describe('Optional keywords related to the desired links. If empty, suggest random links.'),
  preferredCategories: z.array(z.string()).optional().describe('Optional array of preferred categories (e.g., Learning, Tools). If empty, suggest from any valid category.'),
  validCategories: z.array(z.string()).describe('The list of all valid categories the AI must assign to each link.'),
  count: z.number().min(1).max(50).default(5).describe('The number of new, unique links to suggest. Defaults to 5 if not specified.'),
  existingLinks: z.array(z.object({
    title: z.string().optional(),
    url: z.string().describe('The URL of an existing link (primary identifier).'),
  })).optional().describe('An array of existing links (URL is primary key) to avoid suggesting duplicates. The AI should not suggest any link whose URL is in this list.'),
});
type AIPromptInput = z.infer<typeof AIPromptInputSchema>;

// Schema for data received directly FROM the AI prompt (category is a string here)
const AIPromptOutputSchema = z.object({
  suggestedLinks: z
    .array(z.object({
      title: z.string(),
      url: z.string(),
      description: z.string(),
      category: z.string().describe(`The category of the link. Must be one of: ${ALL_CATEGORIES.join(', ')}`),
    }))
    .describe('An array of suggested links with title, URL, description, and category. All links must be for open-source projects or free online resources. The number of links should match the requested count.'),
});

// Final output schema for the flow (category is the strict LinkCategory type)
// Uses ALL_CATEGORIES directly which is now `as const`
const SuggestLinksFlowOutputSchema = z.object({
    suggestedLinks: z.array(z.object({
        title: z.string(),
        url: z.string(),
        description: z.string(),
        category: z.enum(ALL_CATEGORIES),
    })),
});

export async function suggestLinks(input: PublicSuggestLinksInput): Promise<PublicSuggestLinksOutput> {
  // Map PublicSuggestLinksInput to AIPromptInput if necessary, though they are compatible here
  return suggestLinksFlow(input as AIPromptInput) as Promise<PublicSuggestLinksOutput>;
}

const suggestLinksPrompt = ai.definePrompt({
  name: 'suggestLinksPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: { schema: AIPromptInputSchema },
  output: { schema: AIPromptOutputSchema },
  prompt: `You are an expert in finding relevant, open-source projects or free online resources (like free e-books, tutorials, documentation, open-source software tools).
Suggest exactly {{count}} new, unique links. Each link must have a title, URL, a brief description, and a category.
Ensure all suggested links are genuinely open-source or completely free to access/use.

Analyze the content of each link (title, description) and assign it the MOST appropriate category from the following list:
{{#each validCategories}}
- "{{this}}"
{{/each}}
Default to "Other" if no other category is a strong fit.

{{#if keywords}}
Base your suggestions on the provided keywords: "{{keywords}}".
{{/if}}

{{#if preferredCategories.length}}
Try to focus on the following preferred categories if relevant to the keywords:
{{#each preferredCategories}}
- "{{this}}"
{{/each}}
{{else}}
You can suggest from any relevant category from the valid list provided above.
{{/if}}

{{#if existingLinks.length}}
IMPORTANT: Do NOT suggest any of the following links as they are already known. Avoid suggesting any link if its URL is present in this list:
{{#each existingLinks}}
- {{#if this.title}}Title: {{this.title}}, {{/if}}URL: {{this.url}}
{{/each}}
{{/if}}

Provide the suggested links in the specified JSON format, ensuring the 'category' for each link is one of the valid categories listed above.
`,
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  }
});

const MAX_ATTEMPTS_OVERALL = 50;
const MAX_CONSECUTIVE_NO_NEW_LINKS = 3;
const MAX_CONSECUTIVE_MALFORMED_RESPONSES = 2;
const BATCH_SIZE_PER_ATTEMPT_FACTOR = 1.5;

const suggestLinksFlow = ai.defineFlow(
  {
    name: 'suggestLinksFlow',
    inputSchema: AIPromptInputSchema, // Flow input uses the internal AIPromptInput
    outputSchema: SuggestLinksFlowOutputSchema, // Flow output uses strict schema
  },
  async (input: AIPromptInput): Promise<z.infer<typeof SuggestLinksFlowOutputSchema>> => {
    const targetCount = input.count || 5;
    let accumulatedSuggestions: z.infer<typeof SuggestLinksFlowOutputSchema>['suggestedLinks'] = [];
    let currentKnownLinks = [...(input.existingLinks || [])];
    let attempts = 0;
    let consecutiveNoNewUniqueLinks = 0;
    let consecutiveMalformedResponses = 0;

    while (accumulatedSuggestions.length < targetCount && attempts < MAX_ATTEMPTS_OVERALL) {
      attempts++;
      const remainingCount = targetCount - accumulatedSuggestions.length;
      const countToRequestThisAttempt = Math.min(20, Math.max(1, Math.ceil(remainingCount * BATCH_SIZE_PER_ATTEMPT_FACTOR)));

      const processedInput: AIPromptInput = {
        keywords: input.keywords || undefined,
        preferredCategories: input.preferredCategories && input.preferredCategories.length > 0 ? input.preferredCategories : undefined,
        validCategories: ALL_CATEGORIES as unknown as string[], // Pass all valid categories for AI to choose from
        count: countToRequestThisAttempt,
        existingLinks: currentKnownLinks.length > 0 ? currentKnownLinks : undefined,
      };

      console.log(`Attempt ${attempts}: Requesting ${countToRequestThisAttempt} links. Known links: ${currentKnownLinks.length}. Accumulated: ${accumulatedSuggestions.length}`);

      try {
        const response = await suggestLinksPrompt(processedInput);

        if (!response || !response.output || !response.output.suggestedLinks) {
          console.error(`AI prompt returned no/malformed output on attempt ${attempts}. Response:`, JSON.stringify(response, null, 2));
          consecutiveMalformedResponses++;
          if (consecutiveMalformedResponses >= MAX_CONSECUTIVE_MALFORMED_RESPONSES) {
            console.warn(`Max consecutive malformed responses reached (${MAX_CONSECUTIVE_MALFORMED_RESPONSES}). Aborting further attempts.`);
            throw new Error("AI returned malformed output multiple times.");
          }
          continue;
        }
        consecutiveMalformedResponses = 0;

        const newLinksFromAI = response.output.suggestedLinks;
        let newUniqueLinksAddedThisAttempt = 0;

        for (const aiLink of newLinksFromAI) {
          if (accumulatedSuggestions.length >= targetCount) break;

          const isDuplicateInSession = accumulatedSuggestions.some(l => l.url === aiLink.url);
          const isDuplicateInKnown = currentKnownLinks.some(l => l.url === aiLink.url);

          if (!isDuplicateInSession && !isDuplicateInKnown) {
            let normalizedCategory = ALL_CATEGORIES.find(cat => cat.toLowerCase() === aiLink.category.toLowerCase()) as LinkCategory | undefined;
            if (!normalizedCategory) {
                 console.warn(`AI suggested category "${aiLink.category}", which is not in ALL_CATEGORIES. Defaulting to "Other". Link: ${aiLink.title}`);
                 normalizedCategory = 'Other';
            } else if (normalizedCategory.toLowerCase() !== aiLink.category.toLowerCase() && normalizedCategory !== 'Other') {
                 console.warn(`AI suggested category "${aiLink.category}", normalized to "${normalizedCategory}". Link: ${aiLink.title}`);
            }
            
            accumulatedSuggestions.push({
              ...aiLink,
              category: normalizedCategory,
            });
            currentKnownLinks.push({ url: aiLink.url, title: aiLink.title });
            newUniqueLinksAddedThisAttempt++;
          }
        }

        if (newUniqueLinksAddedThisAttempt === 0 && newLinksFromAI.length > 0) {
          consecutiveNoNewUniqueLinks++;
        } else {
          consecutiveNoNewUniqueLinks = 0;
        }

        if (consecutiveNoNewUniqueLinks >= MAX_CONSECUTIVE_NO_NEW_LINKS) {
          console.warn(`No new unique links found for ${MAX_CONSECUTIVE_NO_NEW_LINKS} consecutive attempts. Stopping.`);
          break;
        }

      } catch (flowError: any) {
        console.error(`Error during suggestLinksPrompt attempt ${attempts}:`, flowError.message || flowError);
        if (flowError.cause) console.error("Underlying cause:", flowError.cause);
        consecutiveMalformedResponses++;
         if (consecutiveMalformedResponses >= MAX_CONSECUTIVE_MALFORMED_RESPONSES) {
            console.warn(`Max consecutive errors/malformed responses reached (${MAX_CONSECUTIVE_MALFORMED_RESPONSES}). Aborting further attempts.`);
            throw flowError;
         }
      }
    }

    if (accumulatedSuggestions.length < targetCount) {
      console.warn(`Flow finished. Suggested ${accumulatedSuggestions.length} links, but target was ${targetCount}. Attempts: ${attempts}`);
    } else {
      console.log(`Flow finished. Successfully suggested ${accumulatedSuggestions.length} links. Attempts: ${attempts}`);
    }

    return { suggestedLinks: accumulatedSuggestions.slice(0, targetCount) };
  }
);
