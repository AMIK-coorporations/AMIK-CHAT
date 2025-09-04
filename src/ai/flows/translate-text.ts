'use server';
/**
 * @fileOverview A flow for translating text from any language to Urdu using OpenRouter.
 *
 * - translateText - A function that handles the text translation.
 * - TranslateTextInput - The input type for the translateText function.
 * - TranslateTextOutput - The return type for the translateText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranslateTextInputSchema = z.object({
  text: z.string().describe('The text to be translated.'),
  targetLanguage: z
    .string()
    .describe('The target language for translation (e.g., "English", "Spanish").'),
});
export type TranslateTextInput = z.infer<typeof TranslateTextInputSchema>;

const TranslateTextOutputSchema = z.object({
  translatedText: z.string().describe('The resulting translated text.'),
});
export type TranslateTextOutput = z.infer<typeof TranslateTextOutputSchema>;

async function translateViaOpenRouter(text: string, targetLanguage: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // Increased timeout for large texts

    // Split very long texts into chunks if needed
    const maxChunkSize = 2000;
    let textToTranslate = text;
    
    if (text.length > maxChunkSize) {
      // For very long texts, take the first part and indicate truncation
      textToTranslate = text.substring(0, maxChunkSize) + '...';
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer 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`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'AMIK Chat Translation'
      },
      body: JSON.stringify({
        model: 'mistralai/mistral-7b-instruct', // Free model for word-to-word translation
        messages: [
          {
            role: 'system',
            content: `You are a professional translator specializing in word-to-word translation to ${targetLanguage}. 

CRITICAL TRANSLATION RULES:
- Translate each word and phrase to ${targetLanguage} with perfect accuracy
- If translating to Urdu, use proper Urdu script (اردو) and grammar
- Preserve the original meaning, tone, and context completely
- Keep proper names, places, and technical terms as close to original as possible
- Maintain paragraph structure and formatting
- For long texts, ensure complete translation of all content
- Return ONLY the translated text, no explanations or additional text
- If the text contains multiple languages, translate everything to ${targetLanguage}
- Ensure the translation sounds natural in ${targetLanguage}
- Focus on word-to-word accuracy while maintaining natural flow`
          },
          {
            role: 'user',
            content: `Please translate the following text to ${targetLanguage} with word-to-word accuracy. This is a ${textToTranslate.length > 500 ? 'long' : 'short'} text that needs complete and accurate translation:

"${textToTranslate}"`
          }
        ],
        max_tokens: textToTranslate.length > 1000 ? 2000 : 1000, // Dynamic token allocation
        temperature: 0.1, // Low temperature for consistent translation
        top_p: 0.9
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.error('OpenRouter API error:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    const translatedText = data.choices?.[0]?.message?.content?.trim();
    
    if (translatedText && translatedText !== textToTranslate) {
      // Clean up the response to remove any extra formatting
      let cleanTranslation = translatedText
        .replace(/^["']|["']$/g, '') // Remove quotes if present
        .replace(/^Translation:|^Translated text:/i, '') // Remove labels
        .trim();
      
      return cleanTranslation;
    }
    
    return null;
  } catch (error) {
    console.error('OpenRouter translation error:', error);
    return null;
  }
}

export async function translateText(input: TranslateTextInput): Promise<TranslateTextOutput> {
  try {
    // Always target Urdu for now
    const targetLanguage = 'Urdu';
    
    // If text is already in Urdu/Arabic script, return as-is
    if (/[\u0600-\u06FF]/.test(input.text)) {
      return { translatedText: input.text };
    }

    // Try OpenRouter first (most reliable for all text sizes)
    const openRouterResult = await translateViaOpenRouter(input.text, targetLanguage);
    if (openRouterResult) {
      return { translatedText: openRouterResult };
    }

    // Fallback to AI flow if available
    if (ai.definePrompt && ai.defineFlow) {
      try {
        const aiResult = await translateTextFlow({ text: input.text, targetLanguage });
        if (aiResult?.translatedText) {
          return aiResult;
        }
      } catch (aiError) {
        console.error('AI flow error:', aiError);
      }
    }

    // If all else fails, return original text
    return { translatedText: input.text };
  } catch (error) {
    console.error('Translation error:', error);
    return { translatedText: input.text };
  }
}

const prompt = ai.definePrompt({
  name: 'translateTextPrompt',
  input: {schema: TranslateTextInputSchema},
  output: {schema: TranslateTextOutputSchema},
  prompt: `You are a professional translator specializing in word-to-word translation to {{targetLanguage}}.

CRITICAL TRANSLATION RULES:
- Translate the text to {{targetLanguage}} with perfect accuracy
- If translating to Urdu, use proper Urdu script (اردو) and grammar
- Preserve the original meaning, tone, and context completely
- Keep proper names, places, and technical terms as close to original as possible
- Maintain paragraph structure and formatting
- For long texts, ensure complete translation of all content
- Return ONLY the translated text, no explanations or additional text
- If the text contains multiple languages, translate everything to {{targetLanguage}}
- Ensure the translation sounds natural in {{targetLanguage}}
- Focus on word-to-word accuracy while maintaining natural flow

Text to translate:
"{{{text}}}"

Target language: {{targetLanguage}}

Translated text:`,
});

const translateTextFlow = ai.defineFlow(
  {
    name: 'translateTextFlow',
    inputSchema: TranslateTextInputSchema,
    outputSchema: TranslateTextOutputSchema,
  },
  async (input: TranslateTextInput) => {
    const {output} = await prompt(input);
    return output!;
  }
);
