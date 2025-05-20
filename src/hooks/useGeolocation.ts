
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Coordinates } from '@/types';

interface GeolocationState {
  coordinates: Coordinates | null;
  error: GeolocationPositionError | Error | null;
  loading: boolean;
  isSupported: boolean;
}

export function useGeolocation(options?: PositionOptions): GeolocationState & { getCurrentPosition: () => void } {
  const [state, setState] = useState<GeolocationState>({
    coordinates: null,
    error: null,
    loading: true,
    isSupported: typeof navigator !== 'undefined' && 'geolocation' in navigator,
  });

  const getCurrentPosition = useCallback(() => {
    if (!state.isSupported) {
      setState(prev => ({ ...prev, error: new Error("Geolocation is not supported by this browser."), loading: false }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState(prev => ({
          ...prev,
          coordinates: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          loading: false,
        }));
      },
      (error) => {
        setState(prev => ({
          ...prev,
          error,
          loading: false,
        }));
      },
      options
    );
  }, [options, state.isSupported]);

  useEffect(() => {
    // Automatically fetch location on mount if supported
    if (state.isSupported) {
      getCurrentPosition();
    }
  }, [getCurrentPosition, state.isSupported]);

  return { ...state, getCurrentPosition };
}
