import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Only initialize genkit on the server side
let ai: any;

if (typeof window === 'undefined') {
  // Server-side only
  try {
    console.log('Initializing genkit on server side...');
    console.log('GOOGLE_AI_API_KEY exists:', !!process.env.GOOGLE_AI_API_KEY);
    
    // Check if Google AI API key is available
    if (process.env.GOOGLE_AI_API_KEY) {
      console.log('Setting up Google AI plugin...');
      ai = genkit({
        plugins: [googleAI()],
        model: 'googleai/gemini-2.0-flash',
      });
      console.log('Genkit initialized with Google AI plugin');
    } else {
      console.warn('Google AI API key not found. Translation will use fallback method.');
      // Create a mock AI object for fallback
      ai = {
        definePrompt: () => ({}),
        defineFlow: () => ({}),
      };
      console.log('Genkit initialized with fallback mode');
    }
  } catch (error) {
    console.error('Error initializing genkit:', error);
    // Create a mock AI object for fallback
    ai = {
      definePrompt: () => ({}),
      defineFlow: () => ({}),
    };
    console.log('Genkit initialized with error fallback mode');
  }
} else {
  // Client-side fallback
  console.log('Genkit initialized on client side (fallback mode)');
  ai = {
    definePrompt: () => ({}),
    defineFlow: () => ({}),
  };
}

export { ai };
