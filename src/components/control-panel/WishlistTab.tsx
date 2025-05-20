
"use client";

import type { FC } from 'react';
import type { SavedRoute } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Heart, Trash2, Eye, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface WishlistTabProps {
  wishlist: SavedRoute[];
  onSelectWishlistItem: (route: SavedRoute) => void;
  onRemoveFromWishlist: (routeId: string) => void;
}

const formatTime = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  let result = '';
  if (h > 0) result += `${h}hr `;
  if (m > 0) result += `${m}min`;
  return result.trim() || 'N/A';
};

const WishlistTab: FC<WishlistTabProps> = ({ wishlist, onSelectWishlistItem, onRemoveFromWishlist }) => {
  if (wishlist.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Info size={20} />Your Wishlist is Empty</CardTitle>
          <CardDescription>Save your favorite generated routes to see them here.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-200px)] pr-2"> {/* Adjust height as needed */}
      <div className="space-y-4 p-1">
        {wishlist.map((route) => (
          <Card key={route.id} className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base leading-tight flex-1 pr-2">
                  {route.routeDescription.substring(0, 60)}...
                </CardTitle>
                <Badge variant="secondary" className="text-xs whitespace-nowrap">
                  Saved: {format(new Date(route.savedAt), "MMM d, yyyy")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{route.locations.length} Locations</span>
                <span>Est. Time: {formatTime(route.totalEstimatedTime)}</span>
              </div>
              <div className="flex gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectWishlistItem(route)}
                  className="flex-1"
                >
                  <Eye size={14} className="mr-2" /> View
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onRemoveFromWishlist(route.id)}
                  className="flex-1"
                >
                  <Trash2 size={14} className="mr-2" /> Remove
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
};

export default WishlistTab;
