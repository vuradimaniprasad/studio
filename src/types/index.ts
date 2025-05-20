
import type { GenerateRouteOutput as GenkitGeneratedRouteOutput, RouteLocation as GenkitRouteLocation } from '@/ai/flows/generate-route';
import type { SummarizeRouteOutput as GenkitSummarizeRouteOutput } from '@/ai/flows/route-summary';
import type { RouteAdjustmentOutput as GenkitRouteAdjustmentOutput } from '@/ai/flows/route-adjustment-suggestions';

export type Coordinates = {
  lat: number;
  lng: number;
};

export interface RouteLocation extends GenkitRouteLocation {
  // Any additional frontend-specific properties for a location can be added here
}

export interface GeneratedRouteData extends GenkitGeneratedRouteOutput {
  id: string; // Unique ID for this generated instance
}

export interface RouteSummaryData extends GenkitSummarizeRouteOutput {}

export interface RouteAdjustmentData extends GenkitRouteAdjustmentOutput {}

export interface SavedRoute extends GeneratedRouteData {
  savedAt: string; // ISO date string
  // userId: string; // For future real auth when not using mock
}

export type AttractionPreference = "monuments" | "malls" | "parks" | "restaurants" | "museums" | "cafes" | "historical sites";

export const attractionPreferencesOptions: AttractionPreference[] = [
  "monuments", "malls", "parks", "restaurants", "museums", "cafes", "historical sites"
];
