import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// The googleAI plugin will use the GOOGLE_API_KEY from the .env file.
// Ensure your .env file has GOOGLE_API_KEY set with the value you provided.
// e.g., GOOGLE_API_KEY=AIzaSyChiAOop8Y7ODLbmrhBuK8omBnUjWEa0ZA
export const ai = genkit({
  plugins: [googleAI({ apiKey: process.env.GOOGLE_API_KEY })],
  // No global default model specified here; it will be set per-prompt or use plugin defaults.
});
