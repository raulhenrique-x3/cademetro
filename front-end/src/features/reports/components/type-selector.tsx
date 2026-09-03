import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import {
  TrainFront,
  TriangleAlert,
  CircleX,
  CircleCheck,
  LucideIcon,
} from 'lucide-react-native';
import { ReportTypeString } from '@/api/types';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface TypeOption {
  type: ReportTypeString;
  label: string;
  Icon: LucideIcon;
  category: 'train' | 'status';
}

export const REPORT_OPTIONS: TypeOption[] = [
  { type: 'TRAIN_ARRIVING', label: 'Chegando', Icon: TrainFront, category: 'train' },
  { type: 'TRAIN_ARRIVED', label: 'Chegou', Icon: TrainFront, category: 'train' },
  { type: 'TRAIN_DEPARTED', label: 'Saiu', Icon: TrainFront, category: 'train' },
  { type: 'TRAIN_STOPPED', label: 'Parado', Icon: TriangleAlert, category: 'train' },
  {
    type: 'OPERATIONAL_RESTRICTION',
    label: 'Operação com restrições',
    Icon: TriangleAlert,
    category: 'status',
  },
  {
    type: 'SERVICE_INTERRUPTION',
    label: 'Operação interrompida',
    Icon: CircleX,
    category: 'status',
  },
  {
    type: 'NORMAL_OPERATION',
    label: 'Operação normalizada',
    Icon: CircleCheck,
    category: 'status',
  },
];

export interface TypeSelectorProps {
  value: ReportTypeString;
  onChange: (type: ReportTypeString) => void;
}

export function TypeSelector({ value, onChange }: TypeSelectorProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>
        O que aconteceu?
      </Text>

      {/* Train Events */}
      <View style={styles.group}>
        <Text style={[styles.groupLabel, { color: theme.mutedForeground }]}>
          Movimento do Trem
        </Text>
        <View style={styles.grid}>
          {REPORT_OPTIONS.filter((o) => o.category === 'train').map((opt) => {
            const isSelected = value === opt.type;
            const Icon = opt.Icon;
            return (
              <Pressable
                key={opt.type}
                onPress={() => onChange(opt.type)}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                style={({ pressed }) => [
                  styles.optionButton,
                  {
                    backgroundColor: isSelected
                      ? theme.primary
                      : theme.card,
                    borderColor: isSelected ? theme.primary : theme.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}>
                <Icon
                  size={18}
                  color={isSelected ? theme.primaryForeground : theme.primary}
                />
                <Text
                  style={[
                    styles.label,
                    {
                      color: isSelected ? theme.primaryForeground : theme.text,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Operational Status */}
      <View style={styles.group}>
        <Text style={[styles.groupLabel, { color: theme.mutedForeground }]}>
          Situação da Linha
        </Text>
        <View style={styles.list}>
          {REPORT_OPTIONS.filter((o) => o.category === 'status').map((opt) => {
            const isSelected = value === opt.type;
            const Icon = opt.Icon;
            return (
              <Pressable
                key={opt.type}
                onPress={() => onChange(opt.type)}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                style={({ pressed }) => [
                  styles.rowButton,
                  {
                    backgroundColor: isSelected
                      ? theme.primary
                      : theme.card,
                    borderColor: isSelected ? theme.primary : theme.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}>
                <Icon
                  size={18}
                  color={isSelected ? theme.primaryForeground : theme.primary}
                />
                <Text
                  style={[
                    styles.label,
                    {
                      color: isSelected ? theme.primaryForeground : theme.text,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.two,
  },
  sectionTitle: {
    fontSize: Typography.bodyBold.fontSize,
    fontWeight: Typography.bodyBold.fontWeight,
    marginBottom: Spacing.two,
  },
  group: {
    marginBottom: Spacing.three,
  },
  groupLabel: {
    fontSize: Typography.small.fontSize,
    fontWeight: '600',
    marginBottom: Spacing.one,
    textTransform: 'uppercase',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  optionButton: {
    flexBasis: '48%',
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: Radius.medium,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  list: {
    gap: Spacing.two,
  },
  rowButton: {
    borderWidth: 1,
    borderRadius: Radius.medium,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  icon: {
    fontSize: 18,
  },
  label: {
    fontSize: Typography.body.fontSize,
  },
});
