
"use client";

import type { FC } from 'react';
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
import { Wand2, MapPin, Clock, Search, XCircle, LocateFixed } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
  const form = useForm<RouteGeneratorFormData>({
    resolver: zodResolver(routeGeneratorSchema),
    defaultValues: {
      prompt: "",
      radius: 2, 
      timeLimit: 2,
      preferences: [],
    },
  });

  const handleSubmit: SubmitHandler<RouteGeneratorFormData> = (data) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 p-1">
        
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
                           Using your current location. Click map to set a custom start.
                        </AlertDescription>
                    </>
                ) : userLocation ? (
                     <>
                        <LocateFixed className="h-4 w-4 inline-block mr-2 text-green-500" />
                        <AlertTitle className="inline align-middle">Using Current Location</AlertTitle>
                         <AlertDescription className="text-xs">
                            Lat: {userLocation.lat.toFixed(4)}, Lng: {userLocation.lng.toFixed(4)}. Click map for custom start.
                        </AlertDescription>
                    </>
                ) : (
                     <>
                        <XCircle className="h-4 w-4 inline-block mr-2 text-destructive" />
                        <AlertTitle className="inline align-middle">Location Unknown</AlertTitle>
                        <AlertDescription className="text-xs">
                            Enable location services or click the map to set a starting point.
                        </AlertDescription>
                    </>
                )}
            </div>
             {customStartLocation && (
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setCustomStartLocation(null)} 
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
