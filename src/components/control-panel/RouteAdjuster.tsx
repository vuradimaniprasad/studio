"use client";

import type { FC } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { RouteAdjustmentData } from '@/types';
import { GitFork, AlertTriangle, TrafficCone } from 'lucide-react';

const routeAdjusterSchema = z.object({
  trafficConditions: z.string().min(5, { message: "Describe traffic conditions briefly." }),
  timeConstraints: z.string().min(5, { message: "Describe your time constraints." }),
  // Radius will be implicitly taken from the main route generation settings or a default
});

export type RouteAdjusterFormData = Pick<z.infer<typeof routeAdjusterSchema>, 'trafficConditions' | 'timeConstraints'>;


interface RouteAdjusterProps {
  onSubmit: (data: RouteAdjusterFormData) => void;
  isLoading: boolean;
  adjustmentData: RouteAdjustmentData | null;
  currentRouteDescription?: string | null;
}

const RouteAdjuster: FC<RouteAdjusterProps> = ({ onSubmit, isLoading, adjustmentData, currentRouteDescription }) => {
  const form = useForm<RouteAdjusterFormData>({
    resolver: zodResolver(routeAdjusterSchema.omit({radius: true})), // Omit radius as it's not a direct user input here
    defaultValues: {
      trafficConditions: "",
      timeConstraints: "",
    },
  });

  const handleSubmit: SubmitHandler<RouteAdjusterFormData> = (data) => {
    onSubmit(data);
  };

  if (!currentRouteDescription) {
     return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><AlertTriangle size={20} />No Active Route</CardTitle>
          <CardDescription>Generate a route first to enable adjustments.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6 p-1">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="trafficConditions"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2"><TrafficCone size={16} />Current Traffic Conditions</FormLabel>
                <FormControl>
                  <Textarea placeholder="e.g., Heavy traffic on Main Street, accident near the bridge." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="timeConstraints"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Time Constraints</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Need to finish in 1 hour, have an appointment at 3 PM." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isLoading} className="w-full">
            <GitFork className="mr-2 h-4 w-4" />
            {isLoading ? 'Analyzing Alternatives...' : 'Suggest Adjustments'}
          </Button>
        </form>
      </Form>

      {adjustmentData && (
        <Card className="mt-6 shadow-lg">
          <CardHeader>
            <CardTitle>Adjustment Suggestions</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64"> {/* Adjust height as needed */}
              <ul className="space-y-4">
                {adjustmentData.alternativeRoutes.map((route, index) => (
                  <li key={index} className="p-3 bg-muted/50 rounded-md border border-border">
                    <h4 className="font-semibold text-sm mb-1">Alternative Route {index + 1}</h4>
                    <p className="text-xs text-muted-foreground mb-1">Route: {route}</p>
                    {adjustmentData.estimatedArrivalTimes[index] && (
                      <p className="text-xs text-muted-foreground mb-1">Est. Arrival: {adjustmentData.estimatedArrivalTimes[index]}</p>
                    )}
                    {adjustmentData.reasonsForSuggestion[index] && (
                      <p className="text-xs text-muted-foreground">Reason: {adjustmentData.reasonsForSuggestion[index]}</p>
                    )}
                  </li>
                ))}
                {adjustmentData.alternativeRoutes.length === 0 && (
                    <p className="text-sm text-muted-foreground">No alternative routes suggested based on current inputs.</p>
                )}
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RouteAdjuster;
