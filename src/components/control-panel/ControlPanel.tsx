
"use client";

import type { FC } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import RouteGenerator, { type RouteGeneratorFormData } from './RouteGenerator';
import RouteDetails from './RouteDetails';
import RouteAdjuster, { type RouteAdjusterFormData } from './RouteAdjuster';
import type { GeneratedRouteData, RouteSummaryData, RouteAdjustmentData, Coordinates } from '@/types';
import { SlidersHorizontal, ListOrdered, Shuffle, Route } from 'lucide-react';

interface ControlPanelProps {
  activeTab: string;
  setActiveTab: (value: string) => void;
  onGenerateRoute: (data: RouteGeneratorFormData) => void;
  onAdjustRoute: (data: RouteAdjusterFormData) => void;
  generatedRoute: GeneratedRouteData | null;
  routeSummary: RouteSummaryData | null;
  routeAdjustment: RouteAdjustmentData | null;
  isLoading: {
    generating: boolean;
    summarizing: boolean;
    adjusting: boolean;
  };
  currentRouteDescription?: string | null;
  userLocation: Coordinates | null;
  mapsApiKey: string | undefined;
}

const ControlPanel: FC<ControlPanelProps> = ({
  activeTab,
  setActiveTab,
  onGenerateRoute,
  onAdjustRoute,
  generatedRoute,
  routeSummary,
  routeAdjustment,
  isLoading,
  currentRouteDescription,
  userLocation,
  mapsApiKey,
}) => {
  return (
    <Card className="h-full flex flex-col shadow-xl border-r-0 rounded-r-none">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center text-2xl">
          <Route size={28} className="mr-3 text-primary" />
          RoamFree Controls
        </CardTitle>
        <CardDescription>Plan and manage your explorations.</CardDescription>
      </CardHeader>
      <CardContent className="p-0 flex-grow overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3 rounded-none border-b">
            <TabsTrigger value="generate" className="py-3 text-sm">
              <SlidersHorizontal size={16} className="mr-2" /> Generate
            </TabsTrigger>
            <TabsTrigger value="details" className="py-3 text-sm">
              <ListOrdered size={16} className="mr-2" /> Details
            </TabsTrigger>
            <TabsTrigger value="adjust" className="py-3 text-sm">
              <Shuffle size={16} className="mr-2" /> Adjust
            </TabsTrigger>
          </TabsList>
          
          <ScrollArea className="flex-grow p-4 bg-background/30">
            <TabsContent value="generate">
              <RouteGenerator onSubmit={onGenerateRoute} isLoading={isLoading.generating || isLoading.summarizing} />
            </TabsContent>
            <TabsContent value="details">
              <RouteDetails
                routeData={generatedRoute}
                summaryData={routeSummary}
                userLocation={userLocation}
                mapsApiKey={mapsApiKey}
              />
            </TabsContent>
            <TabsContent value="adjust">
              <RouteAdjuster
                onSubmit={onAdjustRoute}
                isLoading={isLoading.adjusting}
                adjustmentData={routeAdjustment}
                currentRouteDescription={currentRouteDescription}
              />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ControlPanel;
