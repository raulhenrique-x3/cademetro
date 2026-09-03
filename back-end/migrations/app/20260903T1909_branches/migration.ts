#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/810d32aa0be1927d684cb62f2377243a88c9c39a51f0c97e7e7ef6f271c13692/contract';
import endContract from '../../snapshots/810d32aa0be1927d684cb62f2377243a88c9c39a51f0c97e7e7ef6f271c13692/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/dbdc65cae36e1610fe01b1ec03932b128f58ba285c00a47e03a93e6243fc6da7/contract';
import startContract from '../../snapshots/dbdc65cae36e1610fe01b1ec03932b128f58ba285c00a47e03a93e6243fc6da7/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropTable({ schema: 'public', table: 'stationLine' }),
      this.createTable({
        schema: 'public',
        table: 'branch',
        columns: [
          col('code', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('lineId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('order', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'branchStation',
        columns: [
          col('branchId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('order', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('stationId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'branch',
        constraint: 'branch_lineId_name_key',
        columns: ['lineId', 'name'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'branch',
        constraint: 'branch_lineId_code_key',
        columns: ['lineId', 'code'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'branch',
        constraint: 'branch_lineId_order_key',
        columns: ['lineId', 'order'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'branchStation',
        constraint: 'branchStation_branchId_stationId_key',
        columns: ['branchId', 'stationId'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'branchStation',
        constraint: 'branchStation_branchId_order_key',
        columns: ['branchId', 'order'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'branch',
        index: 'branch_lineId_idx_4b6c5a21',
        columns: ['lineId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'branchStation',
        index: 'branchStation_branchId_idx_d04da5bb',
        columns: ['branchId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'branchStation',
        index: 'branchStation_stationId_idx_0626a60c',
        columns: ['stationId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'branch',
        foreignKey: {
          name: 'branch_lineId_fkey',
          columns: ['lineId'],
          references: { schema: 'public', table: 'line', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'branchStation',
        foreignKey: {
          name: 'branchStation_branchId_fkey',
          columns: ['branchId'],
          references: { schema: 'public', table: 'branch', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'branchStation',
        foreignKey: {
          name: 'branchStation_stationId_fkey',
          columns: ['stationId'],
          references: { schema: 'public', table: 'station', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
