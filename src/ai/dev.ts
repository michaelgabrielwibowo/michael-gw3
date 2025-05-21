import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-links.ts';
import '@/ai/flows/filter-links-by-keyword-flow.ts'; // Ensure this flow is registered
