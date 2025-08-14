import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Only initialize genkit on the server side
let ai: any;

if (typeof window === 'undefined') {
  // Server-side only
  ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.0-flash',
});
} else {
  // Client-side fallback
  ai = {
    definePrompt: () => ({}),
    defineFlow: () => ({}),
  };
}

export { ai };
