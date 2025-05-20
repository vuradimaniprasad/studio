
"use client";

import type { FC } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from "@/components/ui/slider";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { attractionPreferencesOptions, type AttractionPreference } from '@/types';
import { Wand2, MapPin, Clock, Search } from 'lucide-react';

const routeGeneratorSchema = z.object({
  prompt: z.string().min(10, { message: "Please describe your ideal exploration in at least 10 characters." }),
  radius: z.number().min(0.5, { message: "Radius must be at least 0.5 km." }).max(10, { message: "Radius cannot exceed 10 km." }),
  timeLimit: z.number().min(0.5, { message: "Time limit must be at least 0.5 hours." }).max(6, { message: "Time limit cannot exceed 6 hours." }),
  preferences: z.array(z.string()).refine(value => value.some(item => item), {
    message: "You have to select at least one preference.",
  }),
});

export type RouteGeneratorFormData = z.infer<typeof routeGeneratorSchema>;

interface RouteGeneratorProps {
  onSubmit: (data: RouteGeneratorFormData) => void;
  isLoading: boolean;
}

const RouteGenerator: FC<RouteGeneratorProps> = ({ onSubmit, isLoading }) => {
  const form = useForm<RouteGeneratorFormData>({
    resolver: zodResolver(routeGeneratorSchema),
    defaultValues: {
      prompt: "",
      radius: 2, // Default 2 km
      timeLimit: 2, // Default 2 hours
      preferences: [],
    },
  });

  const handleSubmit: SubmitHandler<RouteGeneratorFormData> = (data) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 p-1">
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
                <div>
                  <Slider
                    min={0.5}
                    max={10}
                    step={0.1}
                    defaultValue={[field.value]}
                    onValueChange={(value) => field.onChange(value[0])}
                    className="my-4"
                  />
                  <Input 
                    type="number" 
                    {...field} 
                    onChange={e => field.onChange(parseFloat(e.target.value) || 0)} 
                    step="0.1"
                    className="mt-1 appearance-none [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                  <span className="text-sm text-muted-foreground ml-2">{field.value} km</span>
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
                 <div>
                  <Slider
                    min={0.5}
                    max={6}
                    step={0.25} // 15 minute increments
                    defaultValue={[field.value]}
                    onValueChange={(value) => field.onChange(value[0])}
                    className="my-4"
                  />
                  <Input 
                    type="number" 
                    {...field} 
                    onChange={e => field.onChange(parseFloat(e.target.value) || 0)} 
                    step="0.25"
                    className="mt-1 appearance-none [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" 
                  />
                  <span className="text-sm text-muted-foreground ml-2">{field.value} hours</span>
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
                <FormLabel className="text-base">Attraction Preferences</FormLabel>
                <FormDescription>
                  Select the types of attractions you're interested in.
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


        <Button type="submit" disabled={isLoading} className="w-full">
          <Wand2 className="mr-2 h-4 w-4" />
          {isLoading ? 'Generating Your Adventure...' : 'Generate Route'}
        </Button>
      </form>
    </Form>
  );
};

export default RouteGenerator;
