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

export interface ReportTypeOptionData {
  type: ReportTypeString;
  label: string;
  subtitle: string;
  category: 'train' | 'status';
  color: string;
  darkColor: string;
}

export const REPORT_OPTIONS_DATA: ReportTypeOptionData[] = [
  {
    type: 'TRAIN_ARRIVING',
    label: 'Chegando',
    subtitle: 'Trem se aproximando da estação',
    category: 'train',
    color: '#0284C7',
    darkColor: '#38BDF8',
  },
  {
    type: 'TRAIN_ARRIVED',
    label: 'Chegou',
    subtitle: 'Na plataforma / Embarcando',
    category: 'train',
    color: '#10B981',
    darkColor: '#34D399',
  },
  {
    type: 'TRAIN_DEPARTED',
    label: 'Saiu',
    subtitle: 'Seguindo viagem',
    category: 'train',
    color: '#6366F1',
    darkColor: '#818CF8',
  },
  {
    type: 'TRAIN_STOPPED',
    label: 'Parado / Atrasado',
    subtitle: 'Parado na via ou plataforma',
    category: 'train',
    color: '#F59E0B',
    darkColor: '#FBBF24',
  },
  {
    type: 'NORMAL_OPERATION',
    label: 'Operação Normalizada',
    subtitle: 'Circulação e intervalos regulares',
    category: 'status',
    color: '#10B981',
    darkColor: '#34D399',
  },
  {
    type: 'OPERATIONAL_RESTRICTION',
    label: 'Operação com Restrições',
    subtitle: 'Lentidão ou velocidade reduzida',
    category: 'status',
    color: '#F59E0B',
    darkColor: '#FBBF24',
  },
  {
    type: 'SERVICE_INTERRUPTION',
    label: 'Operação Interrompida',
    subtitle: 'Sem circulação de trens no trecho',
    category: 'status',
    color: '#EF4444',
    darkColor: '#F87171',
  },
];
