"use server";

import { generateRoute, type GenerateRouteInput, type GenerateRouteOutput } from '@/ai/flows/generate-route';
import { summarizeRoute, type SummarizeRouteInput, type SummarizeRouteOutput } from '@/ai/flows/route-summary';
import { getRouteAdjustmentSuggestions, type RouteAdjustmentInput, type RouteAdjustmentOutput } from '@/ai/flows/route-adjustment-suggestions';

export async function generateExplorationRoute(input: GenerateRouteInput): Promise<GenerateRouteOutput | { error: string }> {
  try {
    const result = await generateRoute(input);
    if (!result || !result.locations) {
        // This case might happen if the AI returns an empty or malformed response.
        return { error: "Failed to generate route: AI returned invalid data." };
    }
    return result;
  } catch (error) {
    console.error("Error in generateExplorationRoute:", error);
    return { error: error instanceof Error ? error.message : "An unknown error occurred while generating the route." };
  }
}

export async function summarizeGeneratedRoute(input: SummarizeRouteInput): Promise<SummarizeRouteOutput | { error: string }> {
  try {
    const result = await summarizeRoute(input);
     if (!result || typeof result.summary !== 'string') {
        return { error: "Failed to summarize route: AI returned invalid data." };
    }
    return result;
  } catch (error) {
    console.error("Error in summarizeGeneratedRoute:", error);
    return { error: error instanceof Error ? error.message : "An unknown error occurred while summarizing the route." };
  }
}

export async function adjustExplorationRoute(input: RouteAdjustmentInput): Promise<RouteAdjustmentOutput | { error: string }> {
  try {
    const result = await getRouteAdjustmentSuggestions(input);
    if (!result || !result.alternativeRoutes) {
        return { error: "Failed to adjust route: AI returned invalid data." };
    }
    return result;
  } catch (error) {
    console.error("Error in adjustExplorationRoute:", error);
    return { error: error instanceof Error ? error.message : "An unknown error occurred while adjusting the route." };
  }
}
