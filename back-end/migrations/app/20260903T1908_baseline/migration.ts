#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/dbdc65cae36e1610fe01b1ec03932b128f58ba285c00a47e03a93e6243fc6da7/contract';
import endContract from '../../snapshots/dbdc65cae36e1610fe01b1ec03932b128f58ba285c00a47e03a93e6243fc6da7/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  lit,
  primaryKey,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createSchema({ schema: 'public' }),
      this.createTable({
        schema: 'public',
        table: 'direction',
        columns: [
          col('code', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('lineId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'line',
        columns: [
          col('code', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('color', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'refreshToken',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('expiresAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('revokedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('tokenHash', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('userId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'report',
        columns: [
          col('authorId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('directionId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('hiddenReason', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('isHidden', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('lineId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('locationLat', 'float8', { codecRef: { codecId: 'pg/float8@1' } }),
          col('locationLng', 'float8', { codecRef: { codecId: 'pg/float8@1' } }),
          col('stationId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('type', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'report_type_check_29511d4d',
            "\"type\" IN ('TRAIN_ARRIVING', 'TRAIN_ARRIVED', 'TRAIN_DEPARTED', 'TRAIN_STOPPED', 'OPERATIONAL_RESTRICTION', 'SERVICE_INTERRUPTION', 'NORMAL_OPERATION')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'reportConfirmation',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('reportId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('type', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('userId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'reportConfirmation_type_check_d38ad0a0',
            "\"type\" IN ('CONFIRM', 'DISPUTE')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'station',
        columns: [
          col('code', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('latitude', 'float8', { notNull: true, codecRef: { codecId: 'pg/float8@1' } }),
          col('longitude', 'float8', { notNull: true, codecRef: { codecId: 'pg/float8@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'stationLine',
        columns: [
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('lineId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('order', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('stationId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'user',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('email', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('name', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('passwordHash', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('role', 'text', {
            notNull: true,
            default: lit('USER'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('status', 'text', {
            notNull: true,
            default: lit('ACTIVE'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('username', 'text', { codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('user_role_check_5fbc0f9e', "\"role\" IN ('USER', 'MODERATOR', 'ADMIN')"),
          checkExpression('user_status_check_1527ac15', "\"status\" IN ('ACTIVE', 'SUSPENDED')"),
        ],
      }),
      this.addUnique({
        schema: 'public',
        table: 'direction',
        constraint: 'direction_lineId_name_key',
        columns: ['lineId', 'name'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'line',
        constraint: 'line_code_key',
        columns: ['code'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'refreshToken',
        constraint: 'refreshToken_tokenHash_key',
        columns: ['tokenHash'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'reportConfirmation',
        constraint: 'reportConfirmation_reportId_userId_key',
        columns: ['reportId', 'userId'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'station',
        constraint: 'station_name_key',
        columns: ['name'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'stationLine',
        constraint: 'stationLine_lineId_stationId_key',
        columns: ['lineId', 'stationId'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'stationLine',
        constraint: 'stationLine_lineId_order_key',
        columns: ['lineId', 'order'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'user',
        constraint: 'user_email_key',
        columns: ['email'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'direction',
        index: 'direction_lineId_idx_4b6c5a21',
        columns: ['lineId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'refreshToken',
        index: 'refreshToken_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'report',
        index: 'report_authorId_idx_e47547ed',
        columns: ['authorId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'report',
        index: 'report_createdAt_idx_9575dbd7',
        columns: ['createdAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'report',
        index: 'report_directionId_createdAt_idx_5d18901e',
        columns: ['directionId', 'createdAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'report',
        index: 'report_directionId_idx_ed5c7ee6',
        columns: ['directionId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'report',
        index: 'report_lineId_createdAt_idx_08d0d392',
        columns: ['lineId', 'createdAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'report',
        index: 'report_lineId_idx_4b6c5a21',
        columns: ['lineId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'report',
        index: 'report_stationId_createdAt_idx_9a45e994',
        columns: ['stationId', 'createdAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'report',
        index: 'report_stationId_idx_0626a60c',
        columns: ['stationId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'reportConfirmation',
        index: 'reportConfirmation_reportId_idx_d163019e',
        columns: ['reportId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'reportConfirmation',
        index: 'reportConfirmation_reportId_type_idx_d0ae3d50',
        columns: ['reportId', 'type'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'reportConfirmation',
        index: 'reportConfirmation_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'stationLine',
        index: 'stationLine_lineId_idx_4b6c5a21',
        columns: ['lineId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'stationLine',
        index: 'stationLine_stationId_idx_0626a60c',
        columns: ['stationId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'direction',
        foreignKey: {
          name: 'direction_lineId_fkey',
          columns: ['lineId'],
          references: { schema: 'public', table: 'line', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'refreshToken',
        foreignKey: {
          name: 'refreshToken_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'report',
        foreignKey: {
          name: 'report_lineId_fkey',
          columns: ['lineId'],
          references: { schema: 'public', table: 'line', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'report',
        foreignKey: {
          name: 'report_stationId_fkey',
          columns: ['stationId'],
          references: { schema: 'public', table: 'station', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'report',
        foreignKey: {
          name: 'report_directionId_fkey',
          columns: ['directionId'],
          references: { schema: 'public', table: 'direction', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'report',
        foreignKey: {
          name: 'report_authorId_fkey',
          columns: ['authorId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'reportConfirmation',
        foreignKey: {
          name: 'reportConfirmation_reportId_fkey',
          columns: ['reportId'],
          references: { schema: 'public', table: 'report', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'reportConfirmation',
        foreignKey: {
          name: 'reportConfirmation_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'stationLine',
        foreignKey: {
          name: 'stationLine_lineId_fkey',
          columns: ['lineId'],
          references: { schema: 'public', table: 'line', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'stationLine',
        foreignKey: {
          name: 'stationLine_stationId_fkey',
          columns: ['stationId'],
          references: { schema: 'public', table: 'station', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
