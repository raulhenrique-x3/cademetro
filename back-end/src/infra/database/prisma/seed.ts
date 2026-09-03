import { db } from './db.js';
import bcrypt from 'bcryptjs';

export async function seed() {
  console.log('Seeding CadêMetrô database...');

  // 1. Seed Users
  const adminPassword = await bcrypt.hash('admin12345', 10);
  const moderatorPassword = await bcrypt.hash('moderator123', 10);
  const userPassword = await bcrypt.hash('user12345', 10);

  const existingAdmin = await db.orm.public.User.where({ email: 'admin@cademetro.com' }).first();
  if (!existingAdmin) {
    await db.orm.public.User.create({
      email: 'admin@cademetro.com',
      passwordHash: adminPassword,
      username: 'admin',
      name: 'System Admin',
      role: 'ADMIN',
      status: 'ACTIVE',
    });
    console.log('Created admin user');
  }

  const existingModerator = await db.orm.public.User.where({ email: 'moderator@cademetro.com' }).first();
  if (!existingModerator) {
    await db.orm.public.User.create({
      email: 'moderator@cademetro.com',
      passwordHash: moderatorPassword,
      username: 'moderator',
      name: 'System Moderator',
      role: 'MODERATOR',
      status: 'ACTIVE',
    });
    console.log('Created moderator user');
  }

  const existingUser = await db.orm.public.User.where({ email: 'user@cademetro.com' }).first();
  if (!existingUser) {
    await db.orm.public.User.create({
      email: 'user@cademetro.com',
      passwordHash: userPassword,
      username: 'metro_user',
      name: 'Metro Passenger',
      role: 'USER',
      status: 'ACTIVE',
    });
    console.log('Created default passenger user');
  }

  // 2. Stations master list (Recife)
  const stationDefs = [
    // Trecho comum Centro/Sul
    { name: 'Recife', code: 'REC', latitude: -8.0632, longitude: -34.8712 },
    { name: 'Joana Bezerra', code: 'JBZ', latitude: -8.0597, longitude: -34.8877 },

    // Linha Centro – Ramal Jaboatão
    { name: 'Afogados', code: 'AFO', latitude: -8.0485, longitude: -34.9034 },
    { name: 'Werneck', code: 'WER', latitude: -8.0427, longitude: -34.9113 },
    { name: 'Santa Luzia', code: 'SLZ', latitude: -8.0365, longitude: -34.9211 },
    { name: 'Cavaleiro', code: 'CAV', latitude: -8.0310, longitude: -34.9330 },
    { name: 'Floriano', code: 'FLO', latitude: -8.0280, longitude: -34.9450 },
    { name: 'Engenho Velho', code: 'EVL', latitude: -8.0260, longitude: -34.9590 },
    { name: 'Jaboatão', code: 'JAB', latitude: -8.0245, longitude: -34.9710 },

    // Linha Centro – Ramal Camaragibe
    { name: 'Coqueiral', code: 'COQ', latitude: -8.0380, longitude: -34.9280 },
    { name: 'Curado', code: 'CUR', latitude: -8.0350, longitude: -34.9360 },
    { name: 'Rodoviária', code: 'ROD', latitude: -8.0340, longitude: -34.9440 },
    { name: 'Cosme e Damião', code: 'CMD', latitude: -8.0330, longitude: -34.9520 },
    { name: 'Camaragibe', code: 'CAM', latitude: -8.0225, longitude: -34.9640 },

    // Linha Sul
    { name: 'Largo da Paz', code: 'LDP', latitude: -8.0610, longitude: -34.8920 },
    { name: 'Imbiribeira', code: 'IMB', latitude: -8.0660, longitude: -34.9050 },
    { name: 'Antônio Falcão', code: 'AFA', latitude: -8.0720, longitude: -34.9140 },
    { name: 'Shopping', code: 'SHO', latitude: -8.0740, longitude: -34.9210 },
    { name: 'Tancredo Neves', code: 'TAN', latitude: -8.0790, longitude: -34.9280 },
    { name: 'Aeroporto', code: 'AER', latitude: -8.0820, longitude: -34.9350 },
    { name: 'Porta Larga', code: 'PLA', latitude: -8.0900, longitude: -34.9450 },
    { name: 'Monte dos Guararapes', code: 'MGG', latitude: -8.0980, longitude: -34.9560 },
    { name: 'Prazeres', code: 'PRA', latitude: -8.1090, longitude: -34.9670 },
    { name: 'Cajueiro Seco', code: 'CJS', latitude: -8.1200, longitude: -34.9770 },
  ];

  const stationMap = new Map<string, number>();

  for (const s of stationDefs) {
    let station = await db.orm.public.Station.where({ name: s.name }).first();
    if (!station) {
      station = await db.orm.public.Station.create({
        name: s.name,
        code: s.code,
        latitude: s.latitude,
        longitude: s.longitude,
      });
    }
    stationMap.set(s.name, station.id);
  }

  // 2.1 Clean up legacy lines (pre-branch model) that have no branches
  const allLines = await db.orm.public.Line.all();
  for (const line of allLines) {
    const legacyBranches = await db.orm.public.Branch.where({ lineId: line.id }).all();
    if (legacyBranches.length === 0) {
      try {
        await db.orm.public.Line.where({ id: line.id }).delete();
        console.log(`Removed legacy line ${line.name}`);
      } catch {
        console.log(`Kept line ${line.name} (has reports attached)`);
      }
    }
  }

  // 3. Lines, Branches & Directions (Recife)
  const lineConfigs = [
    {
      name: 'Linha Centro',
      code: 'centro',
      color: '#1D4ED8',
      branches: [
        {
          name: 'Ramal Jaboatão',
          code: 'jaboatao',
          stations: [
            'Recife', 'Joana Bezerra', 'Afogados', 'Werneck', 'Santa Luzia',
            'Cavaleiro', 'Floriano', 'Engenho Velho', 'Jaboatão',
          ],
        },
        {
          name: 'Ramal Camaragibe',
          code: 'camaragibe',
          stations: [
            'Recife', 'Joana Bezerra', 'Afogados', 'Werneck', 'Santa Luzia',
            'Coqueiral', 'Curado', 'Rodoviária', 'Cosme e Damião', 'Camaragibe',
          ],
        },
      ],
    },
    {
      name: 'Linha Sul',
      code: 'sul',
      color: '#DC2626',
      branches: [
        {
          name: 'Linha Sul',
          code: 'sul',
          stations: [
            'Recife', 'Joana Bezerra', 'Largo da Paz', 'Imbiribeira',
            'Antônio Falcão', 'Shopping', 'Tancredo Neves', 'Aeroporto',
            'Porta Larga', 'Monte dos Guararapes', 'Prazeres', 'Cajueiro Seco',
          ],
        },
      ],
    },
  ];

  for (const l of lineConfigs) {
    let line = await db.orm.public.Line.where({ code: l.code }).first();
    if (!line) {
      line = await db.orm.public.Line.create({
        name: l.name,
        code: l.code,
        color: l.color,
      });
      console.log(`Created line ${l.name}`);
    }

    for (let i = 0; i < l.branches.length; i++) {
      const b = l.branches[i];

      let branch = await db.orm.public.Branch
        .where({ lineId: line.id, code: b.code })
        .first();
      if (!branch) {
        branch = await db.orm.public.Branch.create({
          lineId: line.id,
          name: b.name,
          code: b.code,
          order: i,
        });
        console.log(`  Created branch ${b.name}`);
      }

      for (let j = 0; j < b.stations.length; j++) {
        const stationId = stationMap.get(b.stations[j]);
        if (!stationId) continue;

        const existing = await db.orm.public.BranchStation
          .where({ branchId: branch.id, stationId })
          .first();
        if (!existing) {
          await db.orm.public.BranchStation.create({
            branchId: branch.id,
            stationId,
            order: j,
          });
        }
      }
    }

    // Directions derived from branch terminals
    const branches = await db.orm.public.Branch.where({ lineId: line.id }).all();
    const terminalNames = new Set<string>();

    for (const branch of branches) {
      const branchStations = await db.orm.public.BranchStation
        .where({ branchId: branch.id })
        .all();
      branchStations.sort((a, b) => a.order - b.order);

      for (const bs of [branchStations[0], branchStations[branchStations.length - 1]]) {
        if (!bs) continue;
        const station = await db.orm.public.Station.where({ id: bs.stationId }).first();
        if (station) terminalNames.add(station.name);
      }
    }

    for (const terminalName of terminalNames) {
      const station = await db.orm.public.Station.where({ name: terminalName }).first();
      const existingDirection = await db.orm.public.Direction
        .where({ lineId: line.id, name: terminalName })
        .first();
      if (!existingDirection && station) {
        await db.orm.public.Direction.create({
          lineId: line.id,
          name: terminalName,
          code: station.code?.trim() || terminalName,
        });
      }
    }
  }

  console.log('Seeding completed successfully!');
}

if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes('seed')) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exit(1);
    });
}
