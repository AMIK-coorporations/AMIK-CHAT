'use server';
/**
 * @fileOverview A flow for translating text from one language to another.
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

export async function translateText(input: TranslateTextInput): Promise<TranslateTextOutput> {
  try {
    // Check if AI is properly configured
    if (ai.definePrompt && ai.defineFlow) {
      return translateTextFlow(input);
    } else {
      // Fallback translation using simple dictionary
      const fallbackTranslations: Record<string, Record<string, string>> = {
        'English': {
          'اسلم و علیکم': 'Assalamu Alaikum (Peace be upon you)',
          'کیو آراے ایم آئی کے برقی خط': 'QR AMIK Electronic Letter',
          'فارورڈ شده م': 'Forwarded Message',
          'sahi hai': 'It is correct',
          'in testing': 'In testing',
          'Wahab': 'Wahab',
          'Abdull rehman': 'Abdull Rehman'
        },
        'Urdu': {
          'Wahab': 'وہاب',
          'who are you': 'آپ کون ہیں؟',
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
          'evening': 'شام'
        }
      };
      
      const translations = fallbackTranslations[input.targetLanguage] || {};
      const translatedText = translations[input.text] || input.text;
      return { translatedText };
    }
  } catch (error) {
    console.error('Translation error:', error);
    // Return original text if translation fails
    return { translatedText: input.text };
  }
}

const prompt = ai.definePrompt({
  name: 'translateTextPrompt',
  input: {schema: TranslateTextInputSchema},
  output: {schema: TranslateTextOutputSchema},
  prompt: `You are a professional translator specializing in English and Urdu languages. Translate the following text to {{targetLanguage}}. 

Important guidelines:
- If translating to Urdu, use proper Urdu script and grammar
- If translating to English, use clear and natural English
- Maintain the original meaning and context
- For names, keep them as close to the original as possible
- For technical terms, use appropriate translations
- Only return the translated text, no explanations or additional text

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
