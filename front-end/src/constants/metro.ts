import { LineStatus, ReportTypeString } from '@/api/types';

export const STATUS_CONFIG: Record<
  LineStatus,
  { label: string; icon: string; shortLabel: string }
> = {
  NORMAL: {
    label: 'Operação Normal',
    shortLabel: 'Normal',
    icon: '🟢',
  },
  RESTRICTED: {
    label: 'Operação com Restrições',
    shortLabel: 'Restrito',
    icon: '🟡',
  },
  INTERRUPTED: {
    label: 'Operação Interrompida',
    shortLabel: 'Interrompido',
    icon: '🔴',
  },
  UNKNOWN: {
    label: 'Sem Informações',
    shortLabel: 'Sem dados',
    icon: '⚪',
  },
};

export const REPORT_TYPE_CONFIG: Record<
  ReportTypeString,
  { label: string; icon: string; badgeColor: 'success' | 'warning' | 'destructive' | 'default' }
> = {
  TRAIN_ARRIVING: { label: 'Trem chegando', icon: '🚇', badgeColor: 'default' },
  TRAIN_ARRIVED: { label: 'Trem chegou', icon: '🚇', badgeColor: 'default' },
  TRAIN_DEPARTED: { label: 'Trem saiu', icon: '🚇', badgeColor: 'default' },
  TRAIN_STOPPED: { label: 'Trem parado', icon: '⚠️', badgeColor: 'warning' },
  OPERATIONAL_RESTRICTION: {
    label: 'Operação com restrições',
    icon: '⚠️',
    badgeColor: 'warning',
  },
  SERVICE_INTERRUPTION: {
    label: 'Operação interrompida',
    icon: '❌',
    badgeColor: 'destructive',
  },
  NORMAL_OPERATION: {
    label: 'Operação normalizada',
    icon: '✅',
    badgeColor: 'success',
  },
};
