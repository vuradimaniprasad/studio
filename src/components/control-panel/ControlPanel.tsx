
"use client";

import type { FC } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import RouteGenerator, { type RouteGeneratorFormData } from './RouteGenerator';
import RouteDetails from './RouteDetails';
import RouteAdjuster, { type RouteAdjusterFormData } from './RouteAdjuster';
import WishlistTab from './WishlistTab';
import type { GeneratedRouteData, RouteSummaryData, RouteAdjustmentData, Coordinates, SavedRoute } from '@/types';
import { SlidersHorizontal, ListOrdered, Shuffle, Route, LogOut, Heart } from 'lucide-react';

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
    authCheck?: boolean; 
  };
  currentRouteDescription?: string | null;
  userLocation: Coordinates | null;
  mapsApiKey: string | undefined;
  onLogout: () => void; 
  wishlist: SavedRoute[]; 
  onAddToWishlist: (route: GeneratedRouteData) => void; 
  onRemoveFromWishlist: (routeId: string) => void; 
  onSelectWishlistItem: (route: SavedRoute) => void; 
  customStartLocation: Coordinates | null;
  setCustomStartLocation: (coords: Coordinates | null) => void;
  isGeolocating: boolean;
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
  onLogout,
  wishlist,
  onAddToWishlist,
  onRemoveFromWishlist,
  onSelectWishlistItem,
  customStartLocation,
  setCustomStartLocation,
  isGeolocating,
}) => {
  return (
    <Card className="h-full flex flex-col shadow-xl border-r-0 rounded-r-none">
      <CardHeader className="border-b">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center text-2xl">
            <Route size={28} className="mr-3 text-primary" />
            RoamFree Controls
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onLogout} title="Logout">
            <LogOut size={18} />
          </Button>
        </div>
        <CardDescription>Plan and manage your explorations.</CardDescription>
      </CardHeader>
      <CardContent className="p-0 flex-grow overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-4 rounded-none border-b"> 
            <TabsTrigger value="generate" className="py-3 text-sm">
              <SlidersHorizontal size={16} className="mr-2" /> Generate
            </TabsTrigger>
            <TabsTrigger value="details" className="py-3 text-sm">
              <ListOrdered size={16} className="mr-2" /> Details
            </TabsTrigger>
            <TabsTrigger value="adjust" className="py-3 text-sm">
              <Shuffle size={16} className="mr-2" /> Adjust
            </TabsTrigger>
            <TabsTrigger value="wishlist" className="py-3 text-sm"> 
              <Heart size={16} className="mr-2" /> Wishlist
            </TabsTrigger>
          </TabsList>
          
          <ScrollArea className="flex-grow p-4 bg-background/30">
            <TabsContent value="generate">
              <RouteGenerator
                onSubmit={onGenerateRoute}
                isLoading={isLoading.generating || isLoading.summarizing}
                customStartLocation={customStartLocation}
                setCustomStartLocation={setCustomStartLocation}
                userLocation={userLocation}
                isGeolocating={isGeolocating}
              />
            </TabsContent>
            <TabsContent value="details">
              <RouteDetails
                routeData={generatedRoute}
                summaryData={routeSummary}
                userLocation={userLocation} 
                mapsApiKey={mapsApiKey}     
                onAddToWishlist={onAddToWishlist}
                onRemoveFromWishlist={onRemoveFromWishlist}
                wishlist={wishlist}
                customStartLocation={customStartLocation}
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
            <TabsContent value="wishlist"> 
              <WishlistTab
                wishlist={wishlist}
                onSelectWishlistItem={onSelectWishlistItem}
                onRemoveFromWishlist={onRemoveFromWishlist}
              />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ControlPanel;
