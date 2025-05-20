
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import MapDisplay from '@/components/map/MapDisplay';
import ControlPanel from '@/components/control-panel/ControlPanel';
import type { RouteGeneratorFormData } from '@/components/control-panel/RouteGenerator';
import type { RouteAdjusterFormData } from '@/components/control-panel/RouteAdjuster';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useToast } from '@/hooks/use-toast';
import { generateExplorationRoute, summarizeGeneratedRoute, adjustExplorationRoute } from '@/lib/actions';
import type { Coordinates, GeneratedRouteData, RouteSummaryData, RouteAdjustmentData, SavedRoute } from '@/types';
import { Loader2 } from 'lucide-react';

const RoamFreeClientPage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const { coordinates: userLocation, error: geoError, loading: geoLoading, getCurrentPosition } = useGeolocation();
  
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null); // null initially, then boolean
  const [generatedRoute, setGeneratedRoute] = useState<GeneratedRouteData | null>(null);
  const [routeSummary, setRouteSummary] = useState<RouteSummaryData | null>(null);
  const [routeAdjustment, setRouteAdjustment] = useState<RouteAdjustmentData | null>(null);
  const [wishlist, setWishlist] = useState<SavedRoute[]>([]);
  
  const [isLoading, setIsLoading] = useState({
    generating: false,
    summarizing: false,
    adjusting: false,
    authCheck: true,
  });

  const [activeTab, setActiveTab] = useState<string>("generate");

  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Authentication Check
  useEffect(() => {
    const token = localStorage.getItem('mockAuthToken');
    if (!token) {
      router.push('/login');
    } else {
      setIsAuthenticated(true);
    }
    setIsLoading(prev => ({ ...prev, authCheck: false }));
  }, [router]);

  // Load wishlist from localStorage
  useEffect(() => {
    if (isAuthenticated) {
      const storedWishlist = localStorage.getItem('roamfreeWishlist');
      if (storedWishlist) {
        try {
          setWishlist(JSON.parse(storedWishlist));
        } catch (error) {
          console.error("Failed to parse wishlist from localStorage", error);
          localStorage.removeItem('roamfreeWishlist'); // Clear corrupted data
        }
      }
    }
  }, [isAuthenticated]);

  // Save wishlist to localStorage
  useEffect(() => {
    if (isAuthenticated && wishlist.length >= 0) { // Ensure wishlist is initialized before saving
      localStorage.setItem('roamfreeWishlist', JSON.stringify(wishlist));
    }
  }, [wishlist, isAuthenticated]);


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
      getCurrentPosition();
      return;
    }

    setIsLoading(prev => ({ ...prev, generating: true, summarizing: true }));
    setGeneratedRoute(null);
    setRouteSummary(null);
    setRouteAdjustment(null);
    setActiveTab("generate");

    // Convert radius from km to meters and timeLimit from hours to minutes
    const radiusInMeters = data.radius * 1000;
    const timeLimitInMinutes = data.timeLimit * 60;

    const routeInput = {
      prompt: `${data.prompt} User is interested in: ${data.preferences.join(', ')}.`,
      radius: radiusInMeters,
      timeLimit: timeLimitInMinutes,
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
    
    const newGeneratedRouteWithId: GeneratedRouteData = {
        ...routeResult,
        id: `route-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    setGeneratedRoute(newGeneratedRouteWithId);
    setIsLoading(prev => ({ ...prev, generating: false }));
    toast({ title: "Route Generated!", description: "Explore your new adventure." });

    const summaryInput = {
      routeDescription: newGeneratedRouteWithId.routeDescription,
      estimatedTime: `${newGeneratedRouteWithId.totalEstimatedTime} minutes`, 
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
    setActiveTab("details");

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
      setActiveTab("adjust");
    }
    setIsLoading(prev => ({ ...prev, adjusting: false }));
  }, [generatedRoute, userLocation, toast]);

  const handleLogout = () => {
    localStorage.removeItem('mockAuthToken');
    setIsAuthenticated(false);
    setGeneratedRoute(null);
    setRouteSummary(null);
    setRouteAdjustment(null);
    setWishlist([]);
    setActiveTab("generate");
    toast({title: "Logged Out", description: "You have been successfully logged out."})
    router.push('/login');
  };

  const handleAddToWishlist = (route: GeneratedRouteData) => {
    if (wishlist.find(r => r.id === route.id)) {
      toast({ title: "Already in Wishlist", variant: "default" });
      return;
    }
    const newSavedRoute: SavedRoute = { ...route, savedAt: new Date().toISOString() };
    setWishlist(prev => [...prev, newSavedRoute]);
    toast({ title: "Added to Wishlist!" });
  };

  const handleRemoveFromWishlist = (routeId: string) => {
    setWishlist(prev => prev.filter(r => r.id !== routeId));
    toast({ title: "Removed from Wishlist" });
    // If the removed route was the currently viewed generatedRoute, clear it
    if (generatedRoute && generatedRoute.id === routeId) {
        setGeneratedRoute(null);
        setRouteSummary(null);
        setActiveTab("generate");
    }
  };

  const handleSelectWishlistItem = (route: SavedRoute) => {
    setGeneratedRoute(route); 
    // Attempt to find or create a summary for the wishlisted item
    // For now, a simple placeholder summary or re-use existing if available logic
    setRouteSummary({ summary: `Showing details for wishlisted route: ${route.routeDescription.substring(0,100)}...` });
    setRouteAdjustment(null); // Clear any previous adjustments
    setActiveTab("details");
  };

  if (isLoading.authCheck || isAuthenticated === null) {
     return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-foreground">Loading application...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // This case should ideally be handled by the redirect in useEffect,
    // but as a fallback or if routing is slow:
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-foreground">Redirecting to login...</p>
      </div>
    );
  }
  
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
          onLogout={handleLogout}
          wishlist={wishlist}
          onAddToWishlist={handleAddToWishlist}
          onRemoveFromWishlist={handleRemoveFromWishlist}
          onSelectWishlistItem={handleSelectWishlistItem}
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
