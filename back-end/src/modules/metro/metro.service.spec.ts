import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MetroService } from './metro.service.js';
import { NotFoundException, ConflictException } from '@nestjs/common';

vi.mock('../../infra/database/prisma/db.js', () => {
  const store: Record<string, any[]> = {
    lines: [],
    directions: [],
    branches: [],
    branchStations: [],
    stations: [],
  };

  const match = (rows: any[], criteria: any) =>
    rows.find((r) =>
      Object.entries(criteria).every(([k, v]) => r[k] === v),
    );
  const matchAll = (rows: any[], criteria: any) =>
    rows.filter((r) =>
      Object.entries(criteria).every(([k, v]) => r[k] === v),
    );

  const Line = {
    where: (criteria: any) => ({
      first: async () => match(store.lines, criteria),
    }),
    create: async (data: any) => {
      const row = { id: store.lines.length + 1, ...data };
      store.lines.push(row);
      return row;
    },
    all: async () => [...store.lines],
  };

  const Direction = {
    where: (criteria: any) => ({
      first: async () => match(store.directions, criteria),
      all: async () => matchAll(store.directions, criteria),
    }),
    create: async (data: any) => {
      const row = { id: store.directions.length + 1, ...data };
      store.directions.push(row);
      return row;
    },
  };

  const Branch = {
    where: (criteria: any) => ({
      first: async () => match(store.branches, criteria),
      all: async () => matchAll(store.branches, criteria),
    }),
    create: async (data: any) => {
      const row = { id: store.branches.length + 1, ...data };
      store.branches.push(row);
      return row;
    },
  };

  const BranchStation = {
    where: (criteria: any) => ({
      all: async () => matchAll(store.branchStations, criteria),
    }),
    create: async (data: any) => {
      const row = { id: store.branchStations.length + 1, ...data };
      store.branchStations.push(row);
      return row;
    },
  };

  const Station = {
    where: (criteria: any) => ({
      first: async () => match(store.stations, criteria),
    }),
    create: async (data: any) => {
      const row = { id: store.stations.length + 1, ...data };
      store.stations.push(row);
      return row;
    },
    all: async () => [...store.stations],
  };

  const db = {
    orm: { public: { Line, Direction, Branch, BranchStation, Station } },
    transaction: async (fn: (tx: any) => Promise<any>) =>
      fn({ orm: { public: { Line, Direction, Branch, BranchStation, Station } } }),
  };

  return { db, __store: store };
});

const dbModule: any = await import('../../infra/database/prisma/db.js');
const { db } = dbModule;

async function seedLine(overrides: any = {}) {
  return db.orm.public.Line.create({
    name: 'Linha 1',
    code: 'L1',
    color: 'blue',
    ...overrides,
  });
}

async function seedBranch(lineId: number, overrides: any = {}) {
  return db.orm.public.Branch.create({
    lineId,
    name: 'Ramal A',
    code: 'A',
    order: 0,
    ...overrides,
  });
}

async function seedStation(name: string, overrides: any = {}) {
  return db.orm.public.Station.create({
    name,
    code: null,
    latitude: -8.05,
    longitude: -34.87,
    ...overrides,
  });
}

async function seedBranchStation(branchId: number, stationId: number, order: number) {
  return db.orm.public.BranchStation.create({ branchId, stationId, order });
}

async function seedDirection(lineId: number, name: string, code: string) {
  return db.orm.public.Direction.create({ lineId, name, code });
}

describe('MetroService', () => {
  let service: MetroService;

  beforeEach(() => {
    dbModule.__store.lines.length = 0;
    dbModule.__store.directions.length = 0;
    dbModule.__store.branches.length = 0;
    dbModule.__store.branchStations.length = 0;
    dbModule.__store.stations.length = 0;
    service = new MetroService();
  });

  describe('getLines', () => {
    it('returns lines with their directions', async () => {
      await seedLine();
      await seedDirection(1, 'Recife', 'REC');
      await seedDirection(1, 'Cajueiro Seco', 'CSE');

      const result = await service.getLines();

      expect(result).toEqual([
        {
          id: 1,
          name: 'Linha 1',
          code: 'L1',
          color: 'blue',
          directions: [
            { id: 1, name: 'Recife', code: 'REC' },
            { id: 2, name: 'Cajueiro Seco', code: 'CSE' },
          ],
        },
      ]);
    });

    it('returns empty array when there are no lines', async () => {
      const result = await service.getLines();
      expect(result).toEqual([]);
    });
  });

  describe('getLineById', () => {
    it('returns full detail with ordered branches and stations', async () => {
      await seedLine();
      const branch = await seedBranch(1);
      const s1 = await seedStation('Recife');
      const s2 = await seedStation('Cajueiro Seco');
      await seedBranchStation(branch.id, s1.id, 0);
      await seedBranchStation(branch.id, s2.id, 1);
      await seedDirection(1, 'Recife', 'REC');
      await seedDirection(1, 'Cajueiro Seco', 'CSE');

      const result = await service.getLineById(1);

      expect(result.id).toBe(1);
      expect(result.name).toBe('Linha 1');
      expect(result.directions).toEqual([
        { id: 1, name: 'Recife', code: 'REC' },
        { id: 2, name: 'Cajueiro Seco', code: 'CSE' },
      ]);
      expect(result.branches).toHaveLength(1);
      expect(result.branches[0].stations.map((s) => s.name)).toEqual([
        'Recife',
        'Cajueiro Seco',
      ]);
    });

    it('throws NotFoundException when line does not exist', async () => {
      await expect(service.getLineById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStations', () => {
    it('returns all stations with their line memberships', async () => {
      await seedLine();
      const branch = await seedBranch(1);
      const s1 = await seedStation('Recife');
      await seedBranchStation(branch.id, s1.id, 0);

      const result = await service.getStations();

      expect(result).toEqual([
        {
          id: s1.id,
          name: 'Recife',
          code: null,
          latitude: -8.05,
          longitude: -34.87,
          lines: [{ id: 1, name: 'Linha 1', code: 'L1', color: 'blue' }],
        },
      ]);
    });

    it('filters stations by lineId', async () => {
      await seedLine();
      await seedLine({ name: 'Linha 2', code: 'L2', color: 'green' });
      const branch1 = await seedBranch(1);
      const branch2 = await seedBranch(2, { name: 'Ramal B', code: 'B', order: 0 });
      const s1 = await seedStation('Recife');
      const s2 = await seedStation('Cajueiro Seco');
      await seedBranchStation(branch1.id, s1.id, 0);
      await seedBranchStation(branch2.id, s2.id, 0);

      const result = await service.getStations(1);

      expect(result.map((s) => s.name)).toEqual(['Recife']);
    });

    it('throws NotFoundException when filtering by unknown line', async () => {
      await expect(service.getStations(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStationById', () => {
    it('returns the station with its line memberships', async () => {
      await seedLine();
      const branch = await seedBranch(1);
      const s1 = await seedStation('Recife');
      await seedBranchStation(branch.id, s1.id, 0);

      const result = await service.getStationById(s1.id);

      expect(result.name).toBe('Recife');
      expect(result.lines).toEqual([
        { id: 1, name: 'Linha 1', code: 'L1', color: 'blue' },
      ]);
    });

    it('throws NotFoundException when station does not exist', async () => {
      await expect(service.getStationById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('createLine', () => {
    it('creates the line with branches, stations and synced directions', async () => {
      const dto: any = {
        name: 'Linha 1',
        code: 'L1',
        color: 'blue',
        branches: [
          {
            name: 'Ramal A',
            code: 'A',
            stations: [
              { name: 'Recife', code: 'REC', latitude: -8.05, longitude: -34.87 },
              { name: 'Cajueiro Seco', code: 'CSE', latitude: -8.11, longitude: -34.96 },
            ],
          },
        ],
      };

      const result = await service.createLine(dto);

      expect(result.id).toBe(1);
      expect(dbModule.__store.lines).toHaveLength(1);
      expect(dbModule.__store.branches).toHaveLength(1);
      expect(dbModule.__store.stations).toHaveLength(2);
      expect(dbModule.__store.branchStations).toHaveLength(2);
      expect(dbModule.__store.directions.map((d: any) => d.name).sort()).toEqual([
        'Cajueiro Seco',
        'Recife',
      ]);
    });

    it('deduplicates stations by name across branches', async () => {
      const dto: any = {
        name: 'Linha 1',
        code: 'L1',
        color: 'blue',
        branches: [
          {
            name: 'Ramal A',
            code: 'A',
            stations: [{ name: 'Recife', code: 'REC', latitude: -8.05, longitude: -34.87 }],
          },
          {
            name: 'Ramal B',
            code: 'B',
            stations: [{ name: 'Recife', code: 'REC', latitude: -8.05, longitude: -34.87 }],
          },
        ],
      };

      const result = await service.createLine(dto);

      expect(dbModule.__store.stations).toHaveLength(1);
      expect(dbModule.__store.branches).toHaveLength(2);
      expect(result.branches).toHaveLength(2);
    });

    it('throws ConflictException when line code already exists', async () => {
      await seedLine();
      const dto: any = {
        name: 'Linha 1 duplicada',
        code: 'L1',
        color: 'red',
        branches: [],
      };

      await expect(service.createLine(dto)).rejects.toThrow(ConflictException);
    });
  });
});