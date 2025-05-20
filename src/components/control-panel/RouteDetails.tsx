
"use client";

import type { FC } from 'react';
import type { GeneratedRouteData, RouteSummaryData, RouteLocation, Coordinates, SavedRoute } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ListChecks, Clock, Info, MapPin, Map as MapIcon, Heart, Trash2 } from 'lucide-react';
import MapDisplay from '@/components/map/MapDisplay';

interface RouteDetailsProps {
  routeData: GeneratedRouteData | null;
  summaryData: RouteSummaryData | null;
  userLocation: Coordinates | null;
  mapsApiKey: string | undefined;
  onAddToWishlist: (route: GeneratedRouteData) => void;
  onRemoveFromWishlist: (routeId: string) => void;
  wishlist: SavedRoute[];
  customStartLocation: Coordinates | null; // Added for consistency if needed in future mini-map
}

const formatTime = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  let result = '';
  if (h > 0) result += `${h} hour${h > 1 ? 's' : ''} `;
  if (m > 0) result += `${m} minute${m > 1 ? 's' : ''}`;
  return result.trim() || 'N/A';
};

const RouteDetails: FC<RouteDetailsProps> = ({
  routeData,
  summaryData,
  userLocation,
  mapsApiKey,
  onAddToWishlist,
  onRemoveFromWishlist,
  wishlist,
  customStartLocation, // Destructure though not directly used in mini-map logic yet
}) => {
  if (!routeData && !summaryData) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Info size={20} />Awaiting Route</CardTitle>
          <CardDescription>Generate a route or select one from your wishlist to see its details here.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const hasRouteLocations = routeData?.locations && routeData.locations.length > 0;
  const isInWishlist = routeData ? wishlist.some(item => item.id === routeData.id) : false;

  // For the mini-map in details, prioritize the first point of the *generated route* as the center.
  // If there's a customStartLocation that was used for generation, that info is implicit in routeData.locations[0]
  // if the route was generated from it. Otherwise, use userLocation or a fallback.
  const mapDefaultCenter = hasRouteLocations && routeData?.locations[0]
    ? { lat: routeData.locations[0].latitude, lng: routeData.locations[0].longitude }
    : customStartLocation || userLocation || undefined;


  return (
    <ScrollArea className="h-[calc(100vh-200px)] pr-2">
      <div className="space-y-4">
        {routeData && (
          <div className="flex justify-end mb-2 sticky top-0 z-10 bg-background/80 backdrop-blur-sm py-2 -mx-1 px-1 rounded">
            {isInWishlist ? (
              <Button variant="outline" onClick={() => onRemoveFromWishlist(routeData.id)}>
                <Trash2 size={16} className="mr-2 text-destructive" /> Remove from Wishlist
              </Button>
            ) : (
              <Button variant="default" onClick={() => onAddToWishlist(routeData)}>
                <Heart size={16} className="mr-2" /> Add to Wishlist
              </Button>
            )}
          </div>
        )}

        {hasRouteLocations && mapsApiKey && routeData && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><MapIcon size={20} />Route Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full rounded-md overflow-hidden border border-border">
                <MapDisplay
                  apiKey={mapsApiKey}
                  userLocation={userLocation} 
                  routeLocations={routeData.locations}
                  defaultCenter={mapDefaultCenter}
                  defaultZoom={13} 
                  // No onMapClick for the details mini-map
                  customStartMarker={customStartLocation} // Show custom start if it was active for this route
                />
              </div>
            </CardContent>
          </Card>
        )}

        {summaryData && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ListChecks size={20} />Route Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{summaryData.summary}</p>
            </CardContent>
          </Card>
        )}

        {routeData && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><MapPin size={20} />Route Details</CardTitle>
              <CardDescription>{routeData.routeDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <Badge variant="secondary" className="flex items-center gap-1 py-1 px-2">
                  <Clock size={14} />
                  Est. Time:
                </Badge>
                <span className="text-sm font-medium">{formatTime(routeData.totalEstimatedTime)}</span>
              </div>
              
              <Separator />

              <div>
                <h4 className="font-semibold mb-2 text-sm">Locations:</h4>
                {routeData.locations.length > 0 ? (
                  <ul className="space-y-3">
                    {routeData.locations.map((location: RouteLocation, index: number) => (
                      <li key={`${location.name}-${index}-${location.latitude}`} className="p-3 bg-muted/50 rounded-md border border-border">
                        <div className="flex items-center justify-between mb-1">
                           <h5 className="font-medium text-sm text-primary-foreground bg-primary px-2 py-1 rounded-full w-6 h-6 flex items-center justify-center text-xs">{index + 1}</h5>
                           <h5 className="font-medium text-sm flex-1 ml-2">{location.name}</h5>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{location.description}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No specific locations listed for this route.</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
};

export default RouteDetails;
