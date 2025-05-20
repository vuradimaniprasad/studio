"use client";

import type { FC } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import type { Coordinates, RouteLocation } from '@/types';
import { useState, useEffect } from 'react';
import { Compass, MapPin as MapPinIcon } from 'lucide-react'; // Use MapPinIcon to avoid conflict

interface MapDisplayProps {
  apiKey: string | undefined;
  userLocation: Coordinates | null;
  routeLocations: RouteLocation[] | null;
  defaultCenter?: Coordinates;
  defaultZoom?: number;
}

const MapDisplay: FC<MapDisplayProps> = ({
  apiKey,
  userLocation,
  routeLocations,
  defaultCenter = { lat: 37.7749, lng: -122.4194 }, // Default to San Francisco
  defaultZoom = 12,
}) => {
  const [mapCenter, setMapCenter] = useState<Coordinates>(defaultCenter);
  const [selectedMarker, setSelectedMarker] = useState<RouteLocation | null>(null);

  useEffect(() => {
    if (userLocation) {
      setMapCenter(userLocation);
    } else if (routeLocations && routeLocations.length > 0) {
      setMapCenter({ lat: routeLocations[0].latitude, lng: routeLocations[0].longitude });
    }
  }, [userLocation, routeLocations]);

  if (!apiKey) {
    return <div className="flex items-center justify-center h-full bg-muted rounded-lg shadow-inner"><p className="text-destructive-foreground p-4 bg-destructive rounded-md">Google Maps API Key is missing.</p></div>;
  }

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        defaultCenter={defaultCenter}
        center={mapCenter}
        defaultZoom={defaultZoom}
        zoom={userLocation || (routeLocations && routeLocations.length > 0) ? 14 : defaultZoom}
        gestureHandling={'greedy'}
        disableDefaultUI={true}
        mapId="roamfree_map"
        className="rounded-lg shadow-md"
      >
        {userLocation && (
          <AdvancedMarker position={userLocation} title="Your Location">
            <div className="p-1 bg-primary rounded-full shadow-lg">
              <Compass className="w-6 h-6 text-primary-foreground" />
            </div>
          </AdvancedMarker>
        )}

        {routeLocations?.map((location, index) => (
          <AdvancedMarker
            key={`${location.name}-${index}`}
            position={{ lat: location.latitude, lng: location.longitude }}
            title={location.name}
            onClick={() => setSelectedMarker(location)}
          >
            <Pin
              background={'hsl(var(--accent))'}
              borderColor={'hsl(var(--accent-foreground))'}
              glyphColor={'hsl(var(--accent-foreground))'}
            >
              <span className="text-xs font-bold">{index + 1}</span>
            </Pin>
          </AdvancedMarker>
        ))}

        {selectedMarker && (
          <InfoWindow
            position={{ lat: selectedMarker.latitude, lng: selectedMarker.longitude }}
            onCloseClick={() => setSelectedMarker(null)}
            pixelOffset={[0,-30]}
          >
            <div className="p-2">
              <h3 className="font-semibold text-sm text-foreground mb-1">{selectedMarker.name}</h3>
              <p className="text-xs text-muted-foreground">{selectedMarker.description}</p>
            </div>
          </InfoWindow>
        )}
      </Map>
    </APIProvider>
  );
};

export default MapDisplay;
