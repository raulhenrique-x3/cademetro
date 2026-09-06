#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/810d32aa0be1927d684cb62f2377243a88c9c39a51f0c97e7e7ef6f271c13692/contract';
import startContract from '../../snapshots/810d32aa0be1927d684cb62f2377243a88c9c39a51f0c97e7e7ef6f271c13692/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/cc3c2576c5591cd10ca0fcea222dfdee4bb060ed3c91e8158c191ed24392b8d0/contract';
import endContract from '../../snapshots/cc3c2576c5591cd10ca0fcea222dfdee4bb060ed3c91e8158c191ed24392b8d0/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'user',
        column: col('googleId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.dropNotNull({ schema: 'public', table: 'user', column: 'passwordHash' }),
      this.addUnique({
        schema: 'public',
        table: 'user',
        constraint: 'user_googleId_key',
        columns: ['googleId'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
