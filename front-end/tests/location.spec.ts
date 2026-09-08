import { describe, it, expect, vi } from 'vitest';
import {
  calculateDistanceMeters,
  formatDistance,
  findNearestStation,
  sortStationsByDistance,
} from '../src/lib/location';
import { StationDto } from '../src/api/types';

describe('Location Utilities & Geolocation Calculations', () => {
  const mockStations: StationDto[] = [
    {
      id: 1,
      name: 'Recife',
      code: 'REC',
      latitude: -8.0632,
      longitude: -34.8712,
      lines: [],
    },
    {
      id: 2,
      name: 'Joana Bezerra',
      code: 'JBZ',
      latitude: -8.0597,
      longitude: -34.8877,
      lines: [],
    },
    {
      id: 3,
      name: 'Afogados',
      code: 'AFO',
      latitude: -8.0485,
      longitude: -34.9085,
      lines: [],
    },
    {
      id: 4,
      name: 'Aeroporto',
      code: 'AER',
      latitude: -8.1311,
      longitude: -34.9068,
      lines: [],
    },
  ];

  describe('calculateDistanceMeters', () => {
    it('calculates accurate distance between known points', () => {
      // Recife (-8.0632, -34.8712) to Joana Bezerra (-8.0597, -34.8877) is approx ~1.85 km
      const distance = calculateDistanceMeters(-8.0632, -34.8712, -8.0597, -34.8877);
      expect(distance).toBeGreaterThan(1700);
      expect(distance).toBeLessThan(2000);
    });

    it('returns 0 when coordinates are identical', () => {
      const distance = calculateDistanceMeters(-8.0632, -34.8712, -8.0632, -34.8712);
      expect(distance).toBe(0);
    });

    it('returns Infinity for invalid coordinates', () => {
      expect(calculateDistanceMeters(NaN, 0, 0, 0)).toBe(Infinity);
      expect(calculateDistanceMeters(0, 0, undefined as any, 0)).toBe(Infinity);
    });
  });

  describe('formatDistance', () => {
    it('formats distances under 1 km with "m"', () => {
      expect(formatDistance(50)).toBe('50 m');
      expect(formatDistance(350)).toBe('350 m');
      expect(formatDistance(999)).toBe('999 m');
    });

    it('formats distances 1 km and above with "km" and comma separator', () => {
      expect(formatDistance(1000)).toBe('1,0 km');
      expect(formatDistance(1850)).toBe('1,9 km');
      expect(formatDistance(12400)).toBe('12,4 km');
    });

    it('handles negative or invalid distance values safely', () => {
      expect(formatDistance(-10)).toBe('');
      expect(formatDistance(NaN)).toBe('');
    });
  });

  describe('findNearestStation', () => {
    it('finds the closest station based on user coordinates', () => {
      // Near Joana Bezerra
      const userCoords = { latitude: -8.0595, longitude: -34.8875 };
      const nearest = findNearestStation(userCoords, mockStations);

      expect(nearest).not.toBeNull();
      expect(nearest!.station.id).toBe(2);
      expect(nearest!.station.name).toBe('Joana Bezerra');
      expect(nearest!.distanceMeters).toBeLessThan(100);
    });

    it('finds Aeroporto when user is in the south zone', () => {
      const userCoords = { latitude: -8.1315, longitude: -34.9070 };
      const nearest = findNearestStation(userCoords, mockStations);

      expect(nearest).not.toBeNull();
      expect(nearest!.station.name).toBe('Aeroporto');
    });

    it('returns null if station list is empty or coordinates are missing', () => {
      expect(findNearestStation({ latitude: 0, longitude: 0 }, [])).toBeNull();
      expect(findNearestStation(null as any, mockStations)).toBeNull();
    });
  });

  describe('sortStationsByDistance', () => {
    it('sorts stations by ascending distance', () => {
      // Near Recife station
      const userCoords = { latitude: -8.0632, longitude: -34.8712 };
      const sorted = sortStationsByDistance(userCoords, mockStations);

      expect(sorted.length).toBe(4);
      expect(sorted[0].name).toBe('Recife');
      expect(sorted[0].distanceMeters).toBe(0);
      expect(sorted[1].name).toBe('Joana Bezerra');
      expect(sorted[sorted.length - 1].name).toBe('Aeroporto');
    });
  });
});
