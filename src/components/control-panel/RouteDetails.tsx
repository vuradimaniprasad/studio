
"use client";

import type { FC } from 'react';
import type { GeneratedRouteData, RouteSummaryData, RouteLocation, Coordinates } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ListChecks, Clock, Info, MapPin, Map as MapIcon } from 'lucide-react';
import MapDisplay from '@/components/map/MapDisplay';

interface RouteDetailsProps {
  routeData: GeneratedRouteData | null;
  summaryData: RouteSummaryData | null;
  userLocation: Coordinates | null;
  mapsApiKey: string | undefined;
}

const formatTime = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  let result = '';
  if (h > 0) result += `${h} hour${h > 1 ? 's' : ''} `;
  if (m > 0) result += `${m} minute${m > 1 ? 's' : ''}`;
  return result.trim() || 'N/A';
};

const RouteDetails: FC<RouteDetailsProps> = ({ routeData, summaryData, userLocation, mapsApiKey }) => {
  if (!routeData && !summaryData) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Info size={20} />Awaiting Route</CardTitle>
          <CardDescription>Generate a route to see its details here.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const hasRouteLocations = routeData?.locations && routeData.locations.length > 0;

  return (
    <ScrollArea className="h-[calc(100vh-200px)] pr-2"> {/* Adjust height as needed */}
      <div className="space-y-4">
        {hasRouteLocations && mapsApiKey && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><MapIcon size={20} />Route Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full rounded-md overflow-hidden border border-border">
                <MapDisplay
                  apiKey={mapsApiKey}
                  userLocation={userLocation}
                  routeLocations={routeData!.locations}
                  defaultCenter={
                    routeData!.locations[0]
                      ? { lat: routeData!.locations[0].latitude, lng: routeData!.locations[0].longitude }
                      : userLocation || undefined 
                  }
                  defaultZoom={13} 
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
                      <li key={index} className="p-3 bg-muted/50 rounded-md border border-border">
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
