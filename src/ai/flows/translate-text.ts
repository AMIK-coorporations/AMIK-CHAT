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
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer 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`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'AMIK Chat Translation'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-haiku', // Fast and reliable for translation
        messages: [
          {
            role: 'system',
            content: `You are a professional translator. Translate the given text to ${targetLanguage}. 
            
IMPORTANT RULES:
- Only return the translated text, nothing else
- No explanations, no quotes, no additional text
- Preserve the original meaning and tone
- If translating to Urdu, use proper Urdu script and grammar
- Keep names as close to original as possible
- For technical terms, use appropriate translations`
          },
          {
            role: 'user',
            content: `Translate this text to ${targetLanguage}: "${text}"`
          }
        ],
        max_tokens: 500,
        temperature: 0.1
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
    
    if (translatedText && translatedText !== text) {
      return translatedText;
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

    // Try OpenRouter first (most reliable)
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

    // Final dictionary fallback for common phrases
    const fallbackTranslations: Record<string, string> = {
      'hello': 'ہیلو',
      'hi': 'ہائے',
      'how are you': 'آپ کیسے ہیں؟',
      'good morning': 'صبح بخیر',
      'good night': 'شب بخیر',
      'thank you': 'شکریہ',
      'welcome': 'خوش آمدید',
      'yes': 'ہاں',
      'no': 'نہیں',
      'okay': 'ٹھیک ہے',
      'good': 'اچھا',
      'bad': 'برا',
      'love': 'محبت',
      'friend': 'دوست',
      'family': 'خاندان',
      'home': 'گھر',
      'work': 'کام',
      'time': 'وقت',
      'day': 'دن',
      'night': 'رات',
      'morning': 'صبح',
      'evening': 'شام',
      'who am i': 'میں کون ہوں؟',
      'who are you': 'آپ کون ہیں؟',
      'nihao': 'ہیلو',
      '你好': 'ہیلو'
    };

    const lowerText = input.text.toLowerCase();
    const fallbackResult = fallbackTranslations[lowerText] || fallbackTranslations[input.text];
    
    if (fallbackResult) {
      return { translatedText: fallbackResult };
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
  prompt: `You are a professional translator. Translate the following text to {{targetLanguage}}.

Important guidelines:
- If translating to Urdu, use proper Urdu script and grammar
- Keep names as-is where appropriate
- Preserve meaning and tone
- Return ONLY the translated text, nothing else

Text:
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
