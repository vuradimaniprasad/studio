'use server';

/**
 * @fileOverview Summarizes a generated route, providing estimated time, distance,
 * and a list of key attractions.
 *
 * - summarizeRoute - A function that handles the route summarization process.
 * - SummarizeRouteInput - The input type for the summarizeRoute function.
 * - SummarizeRouteOutput - The return type for the summarizeRoute function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeRouteInputSchema = z.object({
  routeDescription: z
    .string()
    .describe("A detailed description of the generated route, including all locations and directions."),
  estimatedTime: z.string().describe("The estimated time to complete the route, e.g., '2 hours 30 minutes'."),
  estimatedDistance: z.string().describe("The estimated distance of the route, e.g., '15.5 miles'."),
  attractionPreferences: z.string().describe("The user's preferences for types of attractions, e.g., 'historical sites, parks'."),
});
export type SummarizeRouteInput = z.infer<typeof SummarizeRouteInputSchema>;

const SummarizeRouteOutputSchema = z.object({
  summary: z.string().describe("A concise summary of the route, including estimated time, distance, and key attractions."),
});
export type SummarizeRouteOutput = z.infer<typeof SummarizeRouteOutputSchema>;

export async function summarizeRoute(input: SummarizeRouteInput): Promise<SummarizeRouteOutput> {
  return summarizeRouteFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeRoutePrompt',
  input: {schema: SummarizeRouteInputSchema},
  output: {schema: SummarizeRouteOutputSchema},
  prompt: `You are an expert travel assistant.  Please summarize the following route for the user, including the estimated time, distance, and a list of key attractions based on their preferences.

Route Description: {{{routeDescription}}}
Estimated Time: {{{estimatedTime}}}
Estimated Distance: {{{estimatedDistance}}}
Attraction Preferences: {{{attractionPreferences}}}

Summary: `,
});

const summarizeRouteFlow = ai.defineFlow(
  {
    name: 'summarizeRouteFlow',
    inputSchema: SummarizeRouteInputSchema,
    outputSchema: SummarizeRouteOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
