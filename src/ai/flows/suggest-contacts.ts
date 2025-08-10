'use server';

/**
 * @fileOverview Contact suggestion AI agent.
 *
 * - suggestContacts - A function that suggests relevant contacts.
 * - SuggestContactsInput - The input type for the suggestContacts function.
 * - SuggestContactsOutput - The return type for the suggestContacts function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestContactsInputSchema = z.object({
  profileInformation: z
    .string()
    .describe('User profile information, including username and profile picture.'),
  communicationPatterns: z
    .string()
    .describe(
      'User communication patterns, including frequently contacted users and groups.'
    ),
});
export type SuggestContactsInput = z.infer<typeof SuggestContactsInputSchema>;

const SuggestContactsOutputSchema = z.object({
  suggestedContacts: z
    .array(z.string())
    .describe('A list of suggested contacts based on profile information and communication patterns.'),
});
export type SuggestContactsOutput = z.infer<typeof SuggestContactsOutputSchema>;

export async function suggestContacts(input: SuggestContactsInput): Promise<SuggestContactsOutput> {
  return suggestContactsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestContactsPrompt',
  input: {schema: SuggestContactsInputSchema},
  output: {schema: SuggestContactsOutputSchema},
  prompt: `You are an AI assistant specializing in suggesting relevant contacts.

Based on the user's profile information and communication patterns, suggest a list of contacts that the user may find relevant.

Profile Information: {{{profileInformation}}}
Communication Patterns: {{{communicationPatterns}}}

Suggested Contacts:`, // The prompt should guide the LLM to suggest contacts based on the provided info
});

const suggestContactsFlow = ai.defineFlow(
  {
    name: 'suggestContactsFlow',
    inputSchema: SuggestContactsInputSchema,
    outputSchema: SuggestContactsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
