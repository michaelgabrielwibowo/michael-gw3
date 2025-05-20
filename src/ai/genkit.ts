import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// The googleAI plugin will automatically look for the GOOGLE_API_KEY 
// or GOOGLE_GEMINI_API_KEY environment variable.
// Ensure your .env file has GOOGLE_API_KEY set.
export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.0-flash',
});
