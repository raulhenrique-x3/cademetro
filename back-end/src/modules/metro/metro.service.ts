import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { db } from '../../infra/database/prisma/db.js';
import { LineDto, LineDetailDto, BranchDetailDto } from './dto/line.dto.js';
import { StationDto } from './dto/station.dto.js';
import { CreateLineDto } from './dto/create-line.dto.js';

@Injectable()
export class MetroService {
  async createLine(dto: CreateLineDto): Promise<LineDetailDto> {
    const existing = await db.orm.public.Line.where({ code: dto.code }).first();
    if (existing) {
      throw new ConflictException(`Line with code "${dto.code}" already exists`);
    }

    const lineId = await db.transaction(async (tx) => {
      const line = await tx.orm.public.Line.create({
        name: dto.name,
        code: dto.code,
        color: dto.color,
      });

      for (let i = 0; i < dto.branches.length; i++) {
        const b = dto.branches[i];

        const branch = await tx.orm.public.Branch.create({
          lineId: line.id,
          name: b.name,
          code: b.code,
          order: i,
        });

        for (let j = 0; j < b.stations.length; j++) {
          const s = b.stations[j];

          let station = await tx.orm.public.Station.where({ name: s.name }).first();
          if (!station) {
            station = await tx.orm.public.Station.create({
              name: s.name,
              code: s.code?.trim() || null,
              latitude: s.latitude,
              longitude: s.longitude,
            });
          }

          await tx.orm.public.BranchStation.create({
            branchId: branch.id,
            stationId: station.id,
            order: j,
          });
        }
      }

      await this.syncDirections(tx, line.id);

      return line.id;
    });

    return this.getLineById(lineId);
  }

  /**
   * Directions are derived from branch terminals (first and last station of
   * each branch), deduplicated by name.
   */
  private async syncDirections(
    tx: { orm: { public: typeof db.orm.public } },
    lineId: number,
  ): Promise<void> {
    const branches = await tx.orm.public.Branch.where({ lineId }).all();
    const terminalNames = new Set<string>();

    for (const branch of branches) {
      const branchStations = await tx.orm.public.BranchStation
        .where({ branchId: branch.id })
        .all();
      branchStations.sort((a, b) => a.order - b.order);

      for (const bs of [branchStations[0], branchStations[branchStations.length - 1]]) {
        if (!bs) continue;
        const station = await tx.orm.public.Station.where({ id: bs.stationId }).first();
        if (station) terminalNames.add(station.name);
      }
    }

    for (const terminalName of terminalNames) {
      const station = await tx.orm.public.Station.where({ name: terminalName }).first();
      if (!station) continue;

      const existing = await tx.orm.public.Direction
        .where({ lineId, name: terminalName })
        .first();
      if (!existing) {
        await tx.orm.public.Direction.create({
          lineId,
          name: terminalName,
          code: station.code?.trim() || terminalName,
        });
      }
    }
  }

  async getLines(): Promise<LineDto[]> {
    const lines = await db.orm.public.Line.all();
    const result: LineDto[] = [];

    for (const line of lines) {
      const directions = await db.orm.public.Direction
        .where({ lineId: line.id })
        .all();

      result.push({
        id: line.id,
        name: line.name,
        code: line.code,
        color: line.color,
        directions: directions.map((d) => ({
          id: d.id,
          name: d.name,
          code: d.code,
        })),
      });
    }

    return result;
  }

  async getLineById(id: number): Promise<LineDetailDto> {
    const line = await db.orm.public.Line.where({ id }).first();
    if (!line) {
      throw new NotFoundException(`Line with ID ${id} not found`);
    }

    const directions = await db.orm.public.Direction
      .where({ lineId: line.id })
      .all();

    const branches = await db.orm.public.Branch.where({ lineId: line.id }).all();
    branches.sort((a, b) => a.order - b.order);

    const branchDetails: BranchDetailDto[] = [];
    for (const branch of branches) {
      const branchStations = await db.orm.public.BranchStation
        .where({ branchId: branch.id })
        .all();
      branchStations.sort((a, b) => a.order - b.order);

      const stations = [];
      for (const bs of branchStations) {
        const station = await db.orm.public.Station.where({ id: bs.stationId }).first();
        if (station) {
          stations.push({
            id: station.id,
            name: station.name,
            code: station.code,
            order: bs.order,
            latitude: station.latitude,
            longitude: station.longitude,
          });
        }
      }

      branchDetails.push({
        id: branch.id,
        name: branch.name,
        code: branch.code,
        order: branch.order,
        stations,
      });
    }

    return {
      id: line.id,
      name: line.name,
      code: line.code,
      color: line.color,
      directions: directions.map((d) => ({
        id: d.id,
        name: d.name,
        code: d.code,
      })),
      branches: branchDetails,
    };
  }

  async getStations(lineId?: number): Promise<StationDto[]> {
    const stations = lineId !== undefined
      ? await this.getStationsOfLine(lineId)
      : await db.orm.public.Station.all();

    const result: StationDto[] = [];
    for (const station of stations) {
      result.push(await this.buildStationDto(station.id));
    }

    return result;
  }

  private async getStationsOfLine(lineId: number) {
    const line = await db.orm.public.Line.where({ id: lineId }).first();
    if (!line) {
      throw new NotFoundException(`Line with ID ${lineId} not found`);
    }

    const branches = await db.orm.public.Branch.where({ lineId }).all();
    const stations = new Map<number, { order: number }>();

    for (const branch of branches) {
      const branchStations = await db.orm.public.BranchStation
        .where({ branchId: branch.id })
        .all();
      for (const bs of branchStations) {
        if (!stations.has(bs.stationId)) {
          stations.set(bs.stationId, { order: bs.order });
        }
      }
    }

    const result = [];
    for (const [stationId] of stations) {
      const station = await db.orm.public.Station.where({ id: stationId }).first();
      if (station) result.push(station);
    }
    return result;
  }

  async getStationById(id: number): Promise<StationDto> {
    const station = await db.orm.public.Station.where({ id }).first();
    if (!station) {
      throw new NotFoundException(`Station with ID ${id} not found`);
    }
    return this.buildStationDto(id);
  }

  private async buildStationDto(stationId: number): Promise<StationDto> {
    const station = await db.orm.public.Station.where({ id: stationId }).first();
    if (!station) {
      throw new NotFoundException(`Station with ID ${stationId} not found`);
    }

    const branchStations = await db.orm.public.BranchStation
      .where({ stationId })
      .all();

    const seenLineIds = new Set<number>();
    const linesInfo = [];
    for (const bs of branchStations) {
      const branch = await db.orm.public.Branch.where({ id: bs.branchId }).first();
      if (!branch) continue;
      const line = await db.orm.public.Line.where({ id: branch.lineId }).first();
      if (line && !seenLineIds.has(line.id)) {
        seenLineIds.add(line.id);
        linesInfo.push({
          id: line.id,
          name: line.name,
          code: line.code,
          color: line.color,
        });
      }
    }

    return {
      id: station.id,
      name: station.name,
      code: station.code,
      latitude: station.latitude,
      longitude: station.longitude,
      lines: linesInfo,
    };
  }
}