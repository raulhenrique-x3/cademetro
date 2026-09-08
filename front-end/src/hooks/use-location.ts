import { useState, useCallback, useMemo } from 'react';
import {
  Coordinates,
  getCurrentLocation,
  findNearestStation,
  NearestStationResult,
} from '@/lib/location';
import { StationDto } from '@/api/types';
import { toast } from '@/context/toast-context';

export interface UseLocationOptions {
  stations?: StationDto[];
  showToastOnError?: boolean;
}

export function useLocation(options: UseLocationOptions = {}) {
  const { stations, showToastOnError = true } = options;
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = useCallback(async (): Promise<Coordinates | null> => {
    setIsLocating(true);
    setError(null);

    const result = await getCurrentLocation();

    setIsLocating(false);

    if (result.error) {
      setError(result.error);
      if (showToastOnError) {
        toast.warning(result.error);
      }
      return null;
    }

    if (result.coords) {
      setCoords(result.coords);
      return result.coords;
    }

    return null;
  }, [showToastOnError]);

  const nearestStation: NearestStationResult | null = useMemo(() => {
    if (!coords || !stations || stations.length === 0) return null;
    return findNearestStation(coords, stations);
  }, [coords, stations]);

  const clearLocation = useCallback(() => {
    setCoords(null);
    setError(null);
  }, []);

  return {
    coords,
    isLocating,
    error,
    requestLocation,
    clearLocation,
    nearestStation,
  };
}
