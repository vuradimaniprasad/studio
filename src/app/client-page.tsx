
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
  
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [generatedRoute, setGeneratedRoute] = useState<GeneratedRouteData | null>(null);
  const [routeSummary, setRouteSummary] = useState<RouteSummaryData | null>(null);
  const [routeAdjustment, setRouteAdjustment] = useState<RouteAdjustmentData | null>(null);
  const [wishlist, setWishlist] = useState<SavedRoute[]>([]);
  const [customStartLocation, setCustomStartLocation] = useState<Coordinates | null>(null);
  
  const [isLoading, setIsLoading] = useState({
    generating: false,
    summarizing: false,
    adjusting: false,
    authCheck: true,
  });

  const [activeTab, setActiveTab] = useState<string>("generate");

  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    const token = localStorage.getItem('mockAuthToken');
    if (!token) {
      router.push('/login');
    } else {
      setIsAuthenticated(true);
    }
    setIsLoading(prev => ({ ...prev, authCheck: false }));
  }, [router]);

  useEffect(() => {
    if (isAuthenticated) {
      const storedWishlist = localStorage.getItem('roamfreeWishlist');
      if (storedWishlist) {
        try {
          setWishlist(JSON.parse(storedWishlist));
        } catch (error) {
          console.error("Failed to parse wishlist from localStorage", error);
          localStorage.removeItem('roamfreeWishlist');
        }
      }
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && wishlist.length >= 0) {
      localStorage.setItem('roamfreeWishlist', JSON.stringify(wishlist));
    }
  }, [wishlist, isAuthenticated]);


  useEffect(() => {
    if (geoError) {
      toast({
        variant: "destructive",
        title: "Geolocation Error",
        description: geoError.message || "Could not fetch your location. You can set a starting point manually on the map.",
      });
    }
  }, [geoError, toast]);

  const handleGenerateRoute = useCallback(async (data: RouteGeneratorFormData) => {
    const locationForGeneration = customStartLocation || userLocation;

    if (!locationForGeneration) {
      toast({
        variant: "destructive",
        title: "Location Needed",
        description: "Your current location is unavailable and no custom start point is set. Please enable location services or click on the map to set a starting point.",
      });
      if (!userLocation) getCurrentPosition(); // Attempt to get position again if it's the one missing
      return;
    }

    setIsLoading(prev => ({ ...prev, generating: true, summarizing: true }));
    setGeneratedRoute(null);
    setRouteSummary(null);
    setRouteAdjustment(null);
    setActiveTab("generate");

    const radiusInMeters = data.radius * 1000;
    const timeLimitInMinutes = data.timeLimit * 60;

    const routeInput = {
      prompt: `${data.prompt} User is interested in: ${data.preferences.join(', ')}.`,
      radius: radiusInMeters,
      timeLimit: timeLimitInMinutes,
      currentLocation: {
        latitude: locationForGeneration.lat,
        longitude: locationForGeneration.lng,
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

  }, [userLocation, customStartLocation, toast, getCurrentPosition]);

  const handleAdjustRoute = useCallback(async (data: RouteAdjusterFormData) => {
    const locationForAdjustment = customStartLocation || userLocation;
    if (!generatedRoute || !locationForAdjustment) {
      toast({
        variant: "destructive",
        title: "Cannot Adjust Route",
        description: "A route must be generated first, and a starting location (current or custom) is required.",
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
  }, [generatedRoute, userLocation, customStartLocation, toast]);

  const handleLogout = () => {
    localStorage.removeItem('mockAuthToken');
    setIsAuthenticated(false);
    setGeneratedRoute(null);
    setRouteSummary(null);
    setRouteAdjustment(null);
    setWishlist([]);
    setCustomStartLocation(null);
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
    if (generatedRoute && generatedRoute.id === routeId) {
        setGeneratedRoute(null);
        setRouteSummary(null);
        setActiveTab("generate");
    }
  };

  const handleSelectWishlistItem = (route: SavedRoute) => {
    setGeneratedRoute(route); 
    setRouteSummary({ summary: `Showing details for wishlisted route: ${route.routeDescription.substring(0,100)}...` });
    setRouteAdjustment(null);
    setCustomStartLocation(null); // Clear custom start when loading a wishlist item
    setActiveTab("details");
  };

  const handleMapClick = useCallback((coords: Coordinates) => {
    setCustomStartLocation(coords);
    toast({ title: "Custom Start Location Set", description: "Route generation will use this point." });
  }, [toast]);

  if (isLoading.authCheck || isAuthenticated === null) {
     return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-foreground">Loading application...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-foreground">Redirecting to login...</p>
      </div>
    );
  }
  
  // GeoLoading check is now more nuanced; if custom location can be used, we don't strictly need geo.
  // However, initial geo fetch is still good for user convenience.
  if (geoLoading && !userLocation && !customStartLocation) {
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
          customStartLocation={customStartLocation}
          setCustomStartLocation={setCustomStartLocation}
          isGeolocating={geoLoading}
        />
      </div>
      <main className="flex-1 h-full p-4">
        <MapDisplay
          apiKey={mapsApiKey}
          userLocation={userLocation}
          routeLocations={generatedRoute?.locations || null}
          defaultCenter={customStartLocation || userLocation || { lat: 40.7128, lng: -74.0060 }} 
          defaultZoom={12}
          onMapClick={handleMapClick}
          customStartMarker={customStartLocation}
        />
      </main>
    </div>
  );
};

export default RoamFreeClientPage;
