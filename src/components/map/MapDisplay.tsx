
"use client";

import type { FC } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import type { Coordinates, RouteLocation } from '@/types';
import { useState, useEffect } from 'react';
import { Compass, MapPin as MapPinIcon, Pin as PinIconLucide } from 'lucide-react';

interface MapDisplayProps {
  apiKey: string | undefined;
  userLocation: Coordinates | null;
  routeLocations: RouteLocation[] | null;
  defaultCenter?: Coordinates;
  defaultZoom?: number;
  onMapClick?: (coords: Coordinates) => void;
  customStartMarker?: Coordinates | null;
}

const MapDisplay: FC<MapDisplayProps> = ({
  apiKey,
  userLocation,
  routeLocations,
  defaultCenter = { lat: 37.7749, lng: -122.4194 },
  defaultZoom = 12,
  onMapClick,
  customStartMarker,
}) => {
  const [mapCenter, setMapCenter] = useState<Coordinates>(defaultCenter);
  const [selectedMarker, setSelectedMarker] = useState<RouteLocation | null>(null);

  useEffect(() => {
    if (customStartMarker) {
      setMapCenter(customStartMarker);
    } else if (userLocation) {
      setMapCenter(userLocation);
    } else if (routeLocations && routeLocations.length > 0) {
      setMapCenter({ lat: routeLocations[0].latitude, lng: routeLocations[0].longitude });
    } else {
      setMapCenter(defaultCenter);
    }
  }, [userLocation, routeLocations, defaultCenter, customStartMarker]);

  const handleMapClickHandler = (event: google.maps.MapMouseEvent) => {
    if (onMapClick && event.latLng) {
      onMapClick({ lat: event.latLng.lat(), lng: event.latLng.lng() });
    }
  };

  if (!apiKey) {
    return <div className="flex items-center justify-center h-full bg-muted rounded-lg shadow-inner"><p className="text-destructive-foreground p-4 bg-destructive rounded-md">Google Maps API Key is missing.</p></div>;
  }

  return (
    <APIProvider apiKey={apiKey} libraries={['places', 'geocoding', 'marker']}>
      <Map
        mapId="roamfree_map_main"
        center={mapCenter}
        zoom={customStartMarker || userLocation || (routeLocations && routeLocations.length > 0) ? 14 : defaultZoom}
        gestureHandling={'greedy'}
        disableDefaultUI={true}
        className="rounded-lg shadow-md w-full h-full"
        onClick={handleMapClickHandler} // Added onClick for map
      >
        {userLocation && (
          <AdvancedMarker position={userLocation} title="Your Current Location">
            <div className="p-1 bg-primary rounded-full shadow-lg">
              <Compass className="w-6 h-6 text-primary-foreground" />
            </div>
          </AdvancedMarker>
        )}

        {customStartMarker && (
          <AdvancedMarker position={customStartMarker} title="Custom Start Location">
            {/* Use a Pin component or a custom div for the custom start marker */}
             <div className="p-1 bg-secondary rounded-full shadow-lg">
                <PinIconLucide className="w-6 h-6 text-secondary-foreground" />
            </div>
          </AdvancedMarker>
        )}

        {routeLocations?.map((location, index) => (
          <AdvancedMarker
            key={`${location.name}-${index}-${location.latitude}-${location.longitude}`}
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
            <div className="p-2 max-w-xs">
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
