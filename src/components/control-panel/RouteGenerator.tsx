
"use client";

import type { FC } from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { attractionPreferencesOptions, type AttractionPreference, type Coordinates } from '@/types';
import { Wand2, MapPin, Clock, Search, XCircle, LocateFixed, SearchIcon, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// Removed: import { usePlacesAutocompleteService } from '@vis.gl/react-google-maps';
import { useToast } from '@/hooks/use-toast';

const routeGeneratorSchema = z.object({
  prompt: z.string().min(10, { message: "Please describe your ideal exploration in at least 10 characters." }),
  radius: z.number().min(0.5, { message: "Radius must be at least 0.5 km." }).max(10, { message: "Radius cannot exceed 10 km." }),
  timeLimit: z.number().min(0.5, { message: "Time limit must be at least 0.5 hours." }).max(6, { message: "Time limit cannot exceed 6 hours." }),
  preferences: z.array(z.string()).default([]),
});

export type RouteGeneratorFormData = z.infer<typeof routeGeneratorSchema>;

interface RouteGeneratorProps {
  onSubmit: (data: RouteGeneratorFormData) => void;
  isLoading: boolean;
  customStartLocation: Coordinates | null;
  setCustomStartLocation: (coords: Coordinates | null) => void;
  userLocation: Coordinates | null;
  isGeolocating: boolean;
}

const RouteGenerator: FC<RouteGeneratorProps> = ({ 
  onSubmit, 
  isLoading, 
  customStartLocation, 
  setCustomStartLocation,
  userLocation,
  isGeolocating
}) => {
  const { toast } = useToast();
  const form = useForm<RouteGeneratorFormData>({
    resolver: zodResolver(routeGeneratorSchema),
    defaultValues: {
      prompt: "",
      radius: 2, 
      timeLimit: 2,
      preferences: [],
    },
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const [autocompleteService, setAutocompleteService] = useState<google.maps.places.AutocompleteService | null>(null);
  const [sessionToken, setSessionToken] = useState<google.maps.places.AutocompleteSessionToken | null>(null);
  const [isPredictionLoading, setIsPredictionLoading] = useState(false);

  useEffect(() => {
    // Initialize Google Maps services when the API is loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      if (!autocompleteService) {
        setAutocompleteService(new window.google.maps.places.AutocompleteService());
      }
      if (!sessionToken) {
        setSessionToken(new window.google.maps.places.AutocompleteSessionToken());
      }
    }
    // This effect depends on the global google object, which loads asynchronously.
    // It will re-run if autocompleteService or sessionToken are null and then google maps api becomes available.
  }, [autocompleteService, sessionToken]);


  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (value.trim() !== '') {
      if (autocompleteService && sessionToken) {
        setIsPredictionLoading(true);
        autocompleteService.getPlacePredictions(
          { input: value, sessionToken: sessionToken },
          (newPredictions, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && newPredictions) {
              setPredictions(newPredictions);
            } else {
              setPredictions([]);
              if (status !== google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                console.error('Google Places Autocomplete API error:', status);
                // Optionally, show a toast for other errors
                // toast({ variant: "destructive", title: "Search Error", description: "Could not fetch place suggestions." });
              }
            }
            setIsPredictionLoading(false);
          }
        );
        setShowPredictions(true);
      } else {
        // Autocomplete service not ready yet
        setPredictions([]);
        setShowPredictions(true); // Show to potentially display a "not ready" or "loading service" message
      }
    } else {
      setPredictions([]);
      setShowPredictions(false);
    }
  };

  const handlePredictionClick = (prediction: google.maps.places.AutocompletePrediction) => {
    setSearchQuery(prediction.description);
    setShowPredictions(false);
    setPredictions([]);

    if (!window.google || !window.google.maps || !window.google.maps.Geocoder) {
      toast({ variant: "destructive", title: "Error", description: "Geocoder service is not available." });
      return;
    }
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ placeId: prediction.place_id }, (results, status) => {
      if (status === 'OK' && results && results[0] && results[0].geometry) {
        const location = results[0].geometry.location;
        setCustomStartLocation({ lat: location.lat(), lng: location.lng() });
        toast({ title: "Location Set", description: `Starting point set to ${prediction.description}.` });
      } else {
        toast({ variant: "destructive", title: "Geocoding Error", description: `Could not find coordinates for ${prediction.description}. Status: ${status}` });
        console.error('Geocode was not successful for the following reason: ' + status);
      }
    });
  };
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowPredictions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


  const handleSubmit: SubmitHandler<RouteGeneratorFormData> = (data) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 p-1">
        
        <div className="relative" ref={searchContainerRef}>
          <Label htmlFor="location-search" className="flex items-center gap-2 mb-1">
            <SearchIcon size={16}/> Set Custom Start Location (Optional)
          </Label>
          <Input
            id="location-search"
            type="text"
            placeholder="Search for a place..."
            value={searchQuery}
            onChange={handleSearchInputChange}
            onFocus={() => { if (searchQuery.trim()) setShowPredictions(true);}}
            className="mb-1"
          />
          {showPredictions && (
            <ul className="absolute z-50 w-full bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
              {isPredictionLoading && <li className="p-2 text-sm text-muted-foreground flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading...</li>}
              {!isPredictionLoading && predictions.length === 0 && searchQuery.trim() !== '' && (
                 <li className="p-2 text-sm text-muted-foreground">No results found.</li>
              )}
               {!isPredictionLoading && predictions.length === 0 && searchQuery.trim() !== '' && !autocompleteService && (
                 <li className="p-2 text-sm text-muted-foreground">Autocomplete service loading...</li>
              )}
              {predictions.map((p) => (
                <li 
                  key={p.place_id} 
                  onClick={() => handlePredictionClick(p)} 
                  className="p-2 text-sm hover:bg-accent cursor-pointer"
                >
                  {p.description}
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <Alert variant={customStartLocation ? "default" : "destructive"} className="mb-4 border-dashed">
           <div className="flex items-center justify-between">
            <div>
                {customStartLocation ? (
                    <>
                        <LocateFixed className="h-4 w-4 inline-block mr-2 text-primary" />
                        <AlertTitle className="inline align-middle">Custom Start Location Active</AlertTitle>
                        <AlertDescription className="text-xs">
                            Lat: {customStartLocation.lat.toFixed(4)}, Lng: {customStartLocation.lng.toFixed(4)}.
                            Routes will start from this point.
                        </AlertDescription>
                    </>
                ) : isGeolocating ? (
                     <>
                        <LocateFixed className="h-4 w-4 animate-pulse inline-block mr-2" />
                        <AlertTitle className="inline align-middle">Detecting Location...</AlertTitle>
                        <AlertDescription className="text-xs">
                           Using your current location. Search or click map to set a custom start.
                        </AlertDescription>
                    </>
                ) : userLocation ? (
                     <>
                        <LocateFixed className="h-4 w-4 inline-block mr-2 text-green-500" />
                        <AlertTitle className="inline align-middle">Using Current Location</AlertTitle>
                         <AlertDescription className="text-xs">
                            Lat: {userLocation.lat.toFixed(4)}, Lng: {userLocation.lng.toFixed(4)}. Search or click map for custom start.
                        </AlertDescription>
                    </>
                ) : (
                     <>
                        <XCircle className="h-4 w-4 inline-block mr-2 text-destructive" />
                        <AlertTitle className="inline align-middle">Location Unknown</AlertTitle>
                        <AlertDescription className="text-xs">
                            Enable location services, search, or click the map to set a starting point.
                        </AlertDescription>
                    </>
                )}
            </div>
             {customStartLocation && (
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                        setCustomStartLocation(null);
                        setSearchQuery(''); 
                        toast({ title: "Custom Start Cleared", description: "Using current location if available."})
                    }} 
                    className="text-xs p-1 h-auto"
                    title="Clear custom start location"
                >
                    <XCircle className="h-4 w-4 mr-1" /> Clear
                </Button>
            )}
           </div>
        </Alert>

        <FormField
          control={form.control}
          name="prompt"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2"><Search size={16}/>Describe Your Exploration</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g., A scenic walk with historical landmarks and a good coffee stop."
                  {...field}
                  className="min-h-[100px]"
                />
              </FormControl>
              <FormDescription>
                What kind of adventure are you looking for today?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="radius"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2"><MapPin size={16}/>Exploration Radius (kilometers)</FormLabel>
              <FormControl>
                <div className="flex items-center gap-2">
                  <Input 
                    type="number" 
                    {...field} 
                    onChange={e => field.onChange(e.target.valueAsNumber)} 
                    step="0.1"
                    className="w-32 appearance-none [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                  <span className="text-sm text-muted-foreground">km</span>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="timeLimit"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2"><Clock size={16}/>Available Time (hours)</FormLabel>
              <FormControl>
                 <div className="flex items-center gap-2">
                  <Input 
                    type="number" 
                    {...field} 
                    onChange={e => field.onChange(e.target.valueAsNumber)}
                    step="0.25"
                    className="w-32 appearance-none [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" 
                  />
                  <span className="text-sm text-muted-foreground">hours</span>
                 </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="preferences"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">Attraction Preferences (Optional)</FormLabel>
                <FormDescription>
                  Select any types of attractions you're interested in.
                </FormDescription>
              </div>
              <div className="grid grid-cols-2 gap-2">
              {attractionPreferencesOptions.map((item) => (
                <FormField
                  key={item}
                  control={form.control}
                  name="preferences"
                  render={({ field }) => {
                    return (
                      <FormItem
                        key={item}
                        className="flex flex-row items-start space-x-3 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(item)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...(field.value || []), item])
                                : field.onChange(
                                    (field.value || []).filter(
                                      (value) => value !== item
                                    )
                                  )
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal capitalize">
                          {item}
                        </FormLabel>
                      </FormItem>
                    )
                  }}
                />
              ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading || (!userLocation && !customStartLocation && !isGeolocating)} className="w-full">
          <Wand2 className="mr-2 h-4 w-4" />
          {isLoading ? 'Generating Your Adventure...' : 'Generate Route'}
        </Button>
      </form>
    </Form>
  );
};

export default RouteGenerator;

