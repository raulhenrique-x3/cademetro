import { describe, it, expect } from 'vitest';
import { STATUS_CONFIG, REPORT_TYPE_CONFIG } from '../src/constants/metro';
import { formatTimeAgo } from '../src/lib/date';

describe('Metro Status and Reports Formatting', () => {
  describe('STATUS_CONFIG', () => {
    it('maps all 4 operational states to human-friendly text and visual icons', () => {
      expect(STATUS_CONFIG.NORMAL.label).toBe('Operação Normal');
      expect(STATUS_CONFIG.NORMAL.icon).toBe('🟢');

      expect(STATUS_CONFIG.RESTRICTED.label).toBe('Operação com Restrições');
      expect(STATUS_CONFIG.RESTRICTED.icon).toBe('🟡');

      expect(STATUS_CONFIG.INTERRUPTED.label).toBe('Operação Interrompida');
      expect(STATUS_CONFIG.INTERRUPTED.icon).toBe('🔴');

      expect(STATUS_CONFIG.UNKNOWN.label).toBe('Sem Informações');
      expect(STATUS_CONFIG.UNKNOWN.icon).toBe('⚪');
    });
  });

  describe('REPORT_TYPE_CONFIG', () => {
    it('provides clear labels and icons for all report types', () => {
      expect(REPORT_TYPE_CONFIG.TRAIN_ARRIVING.label).toBe('Trem chegando');
      expect(REPORT_TYPE_CONFIG.TRAIN_ARRIVED.label).toBe('Trem chegou');
      expect(REPORT_TYPE_CONFIG.TRAIN_DEPARTED.label).toBe('Trem saiu');
      expect(REPORT_TYPE_CONFIG.TRAIN_STOPPED.label).toBe('Trem parado');
      expect(REPORT_TYPE_CONFIG.OPERATIONAL_RESTRICTION.label).toBe('Operação com restrições');
      expect(REPORT_TYPE_CONFIG.SERVICE_INTERRUPTION.label).toBe('Operação interrompida');
      expect(REPORT_TYPE_CONFIG.NORMAL_OPERATION.label).toBe('Operação normalizada');
    });
  });

  describe('formatTimeAgo', () => {
    it('formats recent events as "agora mesmo"', () => {
      const now = new Date().toISOString();
      expect(formatTimeAgo(now)).toBe('agora mesmo');
    });

    it('formats minutes ago correctly', () => {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      expect(formatTimeAgo(fiveMinAgo)).toBe('há 5 min');
    });

    it('formats hours ago correctly', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 3600 * 1000).toISOString();
      expect(formatTimeAgo(twoHoursAgo)).toBe('há 2 h');
    });

    it('handles null/undefined gracefully', () => {
      expect(formatTimeAgo(null)).toBe('Sem registros recentes');
      expect(formatTimeAgo(undefined)).toBe('Sem registros recentes');
    });
  });
  describe('REPORT_OPTIONS_DATA (UI Config)', () => {
    it('defines rich UI metadata with subtitles and distinct colors for all report options', async () => {
      const { REPORT_OPTIONS_DATA } = await import('../src/constants/metro');
      expect(REPORT_OPTIONS_DATA).toHaveLength(7);

      const trainEvents = REPORT_OPTIONS_DATA.filter((o) => o.category === 'train');
      expect(trainEvents).toHaveLength(4);
      expect(trainEvents.map((t) => t.type)).toEqual([
        'TRAIN_ARRIVING',
        'TRAIN_ARRIVED',
        'TRAIN_DEPARTED',
        'TRAIN_STOPPED',
      ]);

      const statusEvents = REPORT_OPTIONS_DATA.filter((o) => o.category === 'status');
      expect(statusEvents).toHaveLength(3);
      expect(statusEvents.map((s) => s.type)).toEqual([
        'NORMAL_OPERATION',
        'OPERATIONAL_RESTRICTION',
        'SERVICE_INTERRUPTION',
      ]);

      // Verify each option has subtitles and distinct semantic colors
      for (const opt of REPORT_OPTIONS_DATA) {
        expect(opt.label).toBeTruthy();
        expect(opt.subtitle).toBeTruthy();
        expect(opt.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(opt.darkColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }

      // Semantic check: SERVICE_INTERRUPTION should be red
      const interrupted = REPORT_OPTIONS_DATA.find((o) => o.type === 'SERVICE_INTERRUPTION');
      expect(interrupted?.color).toBe('#EF4444');

      // Semantic check: NORMAL_OPERATION should be green
      const normal = REPORT_OPTIONS_DATA.find((o) => o.type === 'NORMAL_OPERATION');
      expect(normal?.color).toBe('#10B981');
    });
  });
});
