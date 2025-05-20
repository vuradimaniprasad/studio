// route-adjustment-suggestions.ts
'use server';

/**
 * @fileOverview Route adjustment suggestion AI agent.
 *
 * - getRouteAdjustmentSuggestions - A function that suggests route adjustments based on traffic and time constraints.
 * - RouteAdjustmentInput - The input type for the getRouteAdjustmentSuggestions function.
 * - RouteAdjustmentOutput - The return type for the getRouteAdjustmentSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RouteAdjustmentInputSchema = z.object({
  currentRoute: z.string().describe('The current route the user is taking.'),
  trafficConditions: z.string().describe('Real-time traffic conditions on the current route.'),
  timeConstraints: z.string().describe('Time constraints the user has for reaching their destination.'),
  radius: z.number().describe('The radius in meters to search for alternative routes and attractions.'),
});
export type RouteAdjustmentInput = z.infer<typeof RouteAdjustmentInputSchema>;

const RouteAdjustmentOutputSchema = z.object({
  alternativeRoutes: z
    .array(z.string())
    .describe('Suggested alternative routes based on traffic and time constraints.'),
  estimatedArrivalTimes: z
    .array(z.string())
    .describe('Estimated arrival times for each alternative route.'),
  reasonsForSuggestion: z
    .array(z.string())
    .describe('Reasons for suggesting each alternative route (e.g., avoids traffic delays).'),
});
export type RouteAdjustmentOutput = z.infer<typeof RouteAdjustmentOutputSchema>;

export async function getRouteAdjustmentSuggestions(input: RouteAdjustmentInput): Promise<RouteAdjustmentOutput> {
  return routeAdjustmentSuggestionsFlow(input);
}

const routeAdjustmentSuggestionsPrompt = ai.definePrompt({
  name: 'routeAdjustmentSuggestionsPrompt',
  input: {schema: RouteAdjustmentInputSchema},
  output: {schema: RouteAdjustmentOutputSchema},
  prompt: `You are a route optimization expert. Given the user's current route, traffic conditions, and time constraints, suggest alternative routes that avoid traffic delays and help the user reach their destination on time.

Current Route: {{{currentRoute}}}
Traffic Conditions: {{{trafficConditions}}}
Time Constraints: {{{timeConstraints}}}
Radius: {{{radius}}}

Suggest alternative routes, estimated arrival times for each route, and reasons for suggesting each route.`,
});

const routeAdjustmentSuggestionsFlow = ai.defineFlow(
  {
    name: 'routeAdjustmentSuggestionsFlow',
    inputSchema: RouteAdjustmentInputSchema,
    outputSchema: RouteAdjustmentOutputSchema,
  },
  async input => {
    const {output} = await routeAdjustmentSuggestionsPrompt(input);
    return output!;
  }
);
