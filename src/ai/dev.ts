import { config } from 'dotenv';
config();

import '@/ai/flows/route-summary.ts';
import '@/ai/flows/generate-route.ts';
import '@/ai/flows/route-adjustment-suggestions.ts';