'use server';

/**
 * @fileOverview An AI search agent with web browsing capabilities.
 *
 * - search - A function that handles a user's search query.
 * - SearchInput - The input type for the search function.
 * - SearchOutput - The return type for the search function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SearchInputSchema = z.object({
  query: z.string().describe("The user's search query."),
});
export type SearchInput = z.infer<typeof SearchInputSchema>;

const SearchOutputSchema = z.object({
  answer: z
    .string()
    .describe(
      "The detailed, direct answer to the user's query, formatted in Markdown (supporting bold, italics, lists, and emojis), in Urdu."
    ),
  sources: z
    .array(
      z.object({
        title: z
          .string()
          .describe(
            'The title of the source website, in its original language or Urdu.'
          ),
        url: z.string().describe('The full URL of the source website.'),
        snippet: z
          .string()
          .describe(
            'A short snippet from the source website relevant to the query, in Urdu.'
          ),
      })
    )
    .describe(
      'A list of at least 3 relevant, credible, and real web sources used to generate the answer.'
    ),
});
export type SearchOutput = z.infer<typeof SearchOutputSchema>;


export async function search(input: SearchInput): Promise<SearchOutput> {
  return searchFlow(input);
}

const prompt = ai.definePrompt({
  name: 'searchPrompt',
  input: {schema: SearchInputSchema},
  output: {schema: SearchOutputSchema},
  system: `You are a powerful and friendly AI search engine named "اے ایم آئی کے" (AMIK).
Your primary role is to provide comprehensive, accurate, and up-to-the-minute answers to user queries by effectively searching the web. You have access to real-time information and current events. It is crucial that you provide the most recent and relevant information available.
You MUST respond in the Urdu language ONLY.
When asked about your identity, who created you, or similar questions, you must introduce yourself as "اے ایم آئی کے", a helpful AI search engine. Do not reveal that you are a large language model.
Your tone should be helpful, polite, and authoritative.

For each query, you will:
1.  Use your search capabilities to browse the web and gather up-to-date, real, and credible information.
2.  Provide a direct and detailed answer to the user's question in the 'answer' field. Format this answer using Markdown. You can use bold, italics, lists, and emojis to make the answer clear and engaging.
3.  Provide a list of at least 3 relevant, credible, and REAL web sources in the 'sources' field. For each source, include a title, a full URL, and a relevant snippet. Do not invent sources.`,
  prompt: `User's Query: {{{query}}}`,
});

const searchFlow = ai.defineFlow(
  {
    name: 'searchFlow',
    inputSchema: SearchInputSchema,
    outputSchema: SearchOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
