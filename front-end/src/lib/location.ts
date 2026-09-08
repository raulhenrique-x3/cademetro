import * as Location from 'expo-location';
import { StationDto } from '@/api/types';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface NearestStationResult {
  station: StationDto;
  distanceMeters: number;
  formattedDistance: string;
}

export interface StationWithDistance extends StationDto {
  distanceMeters: number;
  formattedDistance: string;
}

export interface LocationResult {
  coords: Coordinates | null;
  error: string | null;
}

/**
 * Calculate the great-circle distance between two geographic coordinates
 * using the Haversine formula (result in meters).
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  if (
    lat1 === undefined ||
    lon1 === undefined ||
    lat2 === undefined ||
    lon2 === undefined ||
    isNaN(lat1) ||
    isNaN(lon1) ||
    isNaN(lat2) ||
    isNaN(lon2)
  ) {
    return Infinity;
  }

  const R = 6371000; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Format meters into human-readable metric distance string.
 * Example: 350 -> "350 m", 1450 -> "1,5 km"
 */
export function formatDistance(meters: number): string {
  if (isNaN(meters) || meters < 0 || !isFinite(meters)) return '';
  if (meters < 1000) {
    return `${meters} m`;
  }
  const km = meters / 1000;
  return `${km.toFixed(1).replace('.', ',')} km`;
}

/**
 * Find the nearest station to the given coordinates.
 */
export function findNearestStation(
  coords: Coordinates,
  stations: StationDto[],
): NearestStationResult | null {
  if (!coords || !stations || stations.length === 0) return null;

  let nearestStation: StationDto | null = null;
  let minDistance = Infinity;

  for (const station of stations) {
    if (typeof station.latitude !== 'number' || typeof station.longitude !== 'number') {
      continue;
    }
    const dist = calculateDistanceMeters(
      coords.latitude,
      coords.longitude,
      station.latitude,
      station.longitude,
    );
    if (dist < minDistance) {
      minDistance = dist;
      nearestStation = station;
    }
  }

  if (!nearestStation || minDistance === Infinity) return null;

  return {
    station: nearestStation,
    distanceMeters: minDistance,
    formattedDistance: formatDistance(minDistance),
  };
}

/**
 * Sort stations by distance from the user's location.
 */
export function sortStationsByDistance(
  coords: Coordinates,
  stations: StationDto[],
): StationWithDistance[] {
  if (!coords || !stations) return [];

  const withDistances = stations
    .filter(
      (s) => typeof s.latitude === 'number' && typeof s.longitude === 'number' && !isNaN(s.latitude) && !isNaN(s.longitude),
    )
    .map((station) => {
      const distanceMeters = calculateDistanceMeters(
        coords.latitude,
        coords.longitude,
        station.latitude,
        station.longitude,
      );
      return {
        ...station,
        distanceMeters,
        formattedDistance: formatDistance(distanceMeters),
      };
    });

  return withDistances.sort((a, b) => a.distanceMeters - b.distanceMeters);
}

/**
 * Request foreground location permission.
 */
export async function requestLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch {
    // Fallback if expo-location permission check fails (e.g. running in browser)
    if (typeof navigator !== 'undefined' && 'permissions' in navigator) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        return result.state === 'granted';
      } catch {
        return true; // Let getCurrentPosition prompt
      }
    }
    return false;
  }
}

/**
 * Get current device location using expo-location with fallback.
 */
export async function getCurrentLocation(): Promise<LocationResult> {
  try {
    const granted = await requestLocationPermission();
    if (!granted) {
      return {
        coords: null,
        error: 'Permissão de localização não concedida.',
      };
    }

    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      coords: {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      },
      error: null,
    };
  } catch (err: any) {
    // Web fallback if expo-location native method is unavailable
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            resolve({
              coords: {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
              },
              error: null,
            });
          },
          (posErr) => {
            let msg = 'Não foi possível obter sua localização.';
            if (posErr.code === 1) {
              msg = 'Permissão de localização negada.';
            } else if (posErr.code === 2) {
              msg = 'Sinal de GPS indisponível.';
            } else if (posErr.code === 3) {
              msg = 'Tempo limite de localização esgotado.';
            }
            resolve({
              coords: null,
              error: msg,
            });
          },
          { enableHighAccuracy: true, timeout: 10000 },
        );
      });
    }

    return {
      coords: null,
      error: err?.message || 'Falha ao obter localização do dispositivo.',
    };
  }
}
