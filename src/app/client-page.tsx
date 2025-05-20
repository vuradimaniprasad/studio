
"use client";

import { useState, useEffect, useCallback } from 'react';
import MapDisplay from '@/components/map/MapDisplay';
import ControlPanel from '@/components/control-panel/ControlPanel';
import type { RouteGeneratorFormData } from '@/components/control-panel/RouteGenerator';
import type { RouteAdjusterFormData } from '@/components/control-panel/RouteAdjuster';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useToast } from '@/hooks/use-toast';
import { generateExplorationRoute, summarizeGeneratedRoute, adjustExplorationRoute } from '@/lib/actions';
import type { Coordinates, GeneratedRouteData, RouteSummaryData, RouteAdjustmentData } from '@/types';
import { Loader2 } from 'lucide-react';

const RoamFreeClientPage = () => {
  const { toast } = useToast();
  const { coordinates: userLocation, error: geoError, loading: geoLoading, getCurrentPosition } = useGeolocation();
  
  const [generatedRoute, setGeneratedRoute] = useState<GeneratedRouteData | null>(null);
  const [routeSummary, setRouteSummary] = useState<RouteSummaryData | null>(null);
  const [routeAdjustment, setRouteAdjustment] = useState<RouteAdjustmentData | null>(null);
  
  const [isLoading, setIsLoading] = useState({
    generating: false,
    summarizing: false,
    adjusting: false,
  });

  const [activeTab, setActiveTab] = useState<string>("generate");

  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (geoError) {
      toast({
        variant: "destructive",
        title: "Geolocation Error",
        description: geoError.message || "Could not fetch your location.",
      });
    }
  }, [geoError, toast]);

  const handleGenerateRoute = useCallback(async (data: RouteGeneratorFormData) => {
    if (!userLocation) {
      toast({
        variant: "destructive",
        title: "Location Needed",
        description: "Your current location is required to generate a route. Please enable location services.",
      });
      getCurrentPosition(); // Attempt to get location again
      return;
    }

    setIsLoading(prev => ({ ...prev, generating: true, summarizing: true }));
    setGeneratedRoute(null);
    setRouteSummary(null);
    setRouteAdjustment(null);
    setActiveTab("generate"); // Stay on generate or switch back if user navigated away

    const routeInput = {
      prompt: `${data.prompt} User is interested in: ${data.preferences.join(', ')}.`,
      radius: data.radius,
      timeLimit: data.timeLimit,
      currentLocation: {
        latitude: userLocation.lat,
        longitude: userLocation.lng,
      },
    };

    const routeResult = await generateExplorationRoute(routeInput);

    if ('error' in routeResult) {
      toast({ variant: "destructive", title: "Route Generation Failed", description: routeResult.error });
      setIsLoading(prev => ({ ...prev, generating: false, summarizing: false }));
      return;
    }
    
    setGeneratedRoute(routeResult);
    setIsLoading(prev => ({ ...prev, generating: false }));
    toast({ title: "Route Generated!", description: "Explore your new adventure." });

    // Now summarize the route
    const summaryInput = {
      routeDescription: routeResult.routeDescription,
      estimatedTime: `${routeResult.totalEstimatedTime} minutes`, 
      estimatedDistance: "Distance not calculated by AI", 
      attractionPreferences: data.preferences.join(', '),
    };
    const summaryResult = await summarizeGeneratedRoute(summaryInput);

    if ('error'in summaryResult) {
      toast({ variant: "destructive", title: "Route Summary Failed", description: summaryResult.error });
    } else {
      setRouteSummary(summaryResult);
    }
    setIsLoading(prev => ({ ...prev, summarizing: false }));
    setActiveTab("details"); // Switch to details tab after generation and summary

  }, [userLocation, toast, getCurrentPosition]);

  const handleAdjustRoute = useCallback(async (data: RouteAdjusterFormData) => {
    if (!generatedRoute || !userLocation) {
      toast({
        variant: "destructive",
        title: "Cannot Adjust Route",
        description: "A route must be generated first, and your location is required.",
      });
      return;
    }

    setIsLoading(prev => ({ ...prev, adjusting: true }));
    setRouteAdjustment(null);

    const adjustmentInput = {
      currentRoute: generatedRoute.routeDescription,
      trafficConditions: data.trafficConditions,
      timeConstraints: data.timeConstraints,
      radius: (generatedRoute.locations && generatedRoute.locations.length > 0) ? 5000 : 2000, 
    };

    const adjustmentResult = await adjustExplorationRoute(adjustmentInput);

    if ('error' in adjustmentResult) {
      toast({ variant: "destructive", title: "Route Adjustment Failed", description: adjustmentResult.error });
    } else {
      setRouteAdjustment(adjustmentResult);
      toast({ title: "Route Adjustments Suggested", description: "Check out the alternative plans." });
      setActiveTab("adjust"); // Optionally switch to adjust tab or stay
    }
    setIsLoading(prev => ({ ...prev, adjusting: false }));
  }, [generatedRoute, userLocation, toast]);

  if (geoLoading && !userLocation) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-foreground">Finding your location...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <div className="w-full md:w-[400px] lg:w-[450px] flex-shrink-0 h-full border-r border-border shadow-lg">
        <ControlPanel
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onGenerateRoute={handleGenerateRoute}
          onAdjustRoute={handleAdjustRoute}
          generatedRoute={generatedRoute}
          routeSummary={routeSummary}
          routeAdjustment={routeAdjustment}
          isLoading={isLoading}
          currentRouteDescription={generatedRoute?.routeDescription}
          userLocation={userLocation}
          mapsApiKey={mapsApiKey}
        />
      </div>
      <main className="flex-1 h-full p-4">
        <MapDisplay
          apiKey={mapsApiKey}
          userLocation={userLocation}
          routeLocations={generatedRoute?.locations || null}
          defaultCenter={userLocation || { lat: 40.7128, lng: -74.0060 }} 
        />
      </main>
    </div>
  );
};

export default RoamFreeClientPage;
