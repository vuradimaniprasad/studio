// Implemented the Genkit flow for generating a route based on a user prompt.

'use server';

/**
 * @fileOverview Generates an exploration route based on a user-provided prompt.
 *
 * - generateRoute - A function that generates an exploration route.
 * - GenerateRouteInput - The input type for the generateRoute function.
 * - GenerateRouteOutput - The return type for the generateRoute function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateRouteInputSchema = z.object({
  prompt: z.string().describe('A prompt describing the desired route, including preferences and constraints.'),
  radius: z.number().describe('The radius (in meters) within which to generate the route.'),
  timeLimit: z.number().describe('The maximum time (in minutes) for the route exploration.'),
  currentLocation: z
    .object({
      latitude: z.number().describe('The latitude of the current location.'),
      longitude: z.number().describe('The longitude of the current location.'),
    })
    .describe('The current GPS coordinates of the user.'),
});
export type GenerateRouteInput = z.infer<typeof GenerateRouteInputSchema>;

const RouteLocationSchema = z.object({
  name: z.string().describe('The name of the location.'),
  latitude: z.number().describe('The latitude of the location.'),
  longitude: z.number().describe('The longitude of the location.'),
  description: z.string().describe('A short description of the location.'),
});

const GenerateRouteOutputSchema = z.object({
  routeDescription: z.string().describe('A description of the generated route.'),
  locations: z.array(RouteLocationSchema).describe('An array of locations in the generated route.'),
  totalEstimatedTime: z.number().describe('Total estimated travel time in minutes'),
});
export type GenerateRouteOutput = z.infer<typeof GenerateRouteOutputSchema>;

export async function generateRoute(input: GenerateRouteInput): Promise<GenerateRouteOutput> {
  return generateRouteFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateRoutePrompt',
  input: {schema: GenerateRouteInputSchema},
  output: {schema: GenerateRouteOutputSchema},
  prompt: `You are an expert route planner specializing in creating personalized exploration routes.

  Given the user's current location (latitude: {{{currentLocation.latitude}}}, longitude: {{{currentLocation.longitude}}}), a desired exploration radius of {{radius}} meters, a time limit of {{timeLimit}} minutes, and the following prompt: {{{prompt}}},
  generate a route that satisfies the user's request.

  The route should include a list of locations (name, latitude, longitude, description) and a high-level description of the route. Also provide an estimated total travel time in minutes.

  Consider real-time data such as traffic conditions and time constraints to generate the best route for local exploration.
`,
});

const generateRouteFlow = ai.defineFlow(
  {
    name: 'generateRouteFlow',
    inputSchema: GenerateRouteInputSchema,
    outputSchema: GenerateRouteOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
