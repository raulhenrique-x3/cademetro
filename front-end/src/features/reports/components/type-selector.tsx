import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import {
  TrainFront,
  TriangleAlert,
  CircleX,
  CircleCheck,
  CheckCircle2,
  ArrowRight,
  Check,
  LucideIcon,
} from 'lucide-react-native';
import { ReportTypeString } from '@/api/types';
import { REPORT_OPTIONS_DATA, ReportTypeOptionData } from '@/constants/metro';
import { Radius, Spacing, Typography, isDarkColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface TypeOption extends ReportTypeOptionData {
  Icon: LucideIcon;
}

const ICONS_BY_TYPE: Record<ReportTypeString, LucideIcon> = {
  TRAIN_ARRIVING: TrainFront,
  TRAIN_ARRIVED: CheckCircle2,
  TRAIN_DEPARTED: ArrowRight,
  TRAIN_STOPPED: TriangleAlert,
  NORMAL_OPERATION: CircleCheck,
  OPERATIONAL_RESTRICTION: TriangleAlert,
  SERVICE_INTERRUPTION: CircleX,
};

export const REPORT_OPTIONS: TypeOption[] = REPORT_OPTIONS_DATA.map((data) => ({
  ...data,
  Icon: ICONS_BY_TYPE[data.type],
}));

export interface TypeSelectorProps {
  value: ReportTypeString;
  onChange: (type: ReportTypeString) => void;
}

export function TypeSelector({ value, onChange }: TypeSelectorProps) {
  const theme = useTheme();
  const isDark = isDarkColors(theme);

  const trainOptions = REPORT_OPTIONS.filter((o) => o.category === 'train');
  const statusOptions = REPORT_OPTIONS.filter((o) => o.category === 'status');

  return (
    <View style={styles.container}>
      {/* 1. Train Movement Section */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          O que você está vendo agora?
        </Text>
        <Text style={[styles.sectionSub, { color: theme.mutedForeground }]}>
          Selecione a situação atual do trem na estação
        </Text>
      </View>

      <View style={styles.group}>
        <View style={styles.groupHeader}>
          <Text style={[styles.groupLabel, { color: theme.mutedForeground }]}>
            Movimento do Trem
          </Text>
        </View>

        <View style={styles.grid}>
          {trainOptions.map((opt) => {
            const isSelected = value === opt.type;
            const Icon = opt.Icon;
            const optionColor = isDark ? opt.darkColor : opt.color;

            return (
              <Pressable
                key={opt.type}
                onPress={() => onChange(opt.type)}
                accessibilityRole="radio"
                accessibilityLabel={`${opt.label}: ${opt.subtitle}`}
                accessibilityState={{ selected: isSelected }}
                style={({ pressed }) => [
                  styles.trainCard,
                  {
                    backgroundColor: isSelected
                      ? optionColor + (isDark ? '25' : '15')
                      : theme.card,
                    borderColor: isSelected ? optionColor : theme.border,
                    borderWidth: isSelected ? 2 : 1,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}>
                <View style={styles.cardTopRow}>
                  <View
                    style={[
                      styles.iconBadge,
                      {
                        backgroundColor: isSelected
                          ? optionColor
                          : isDark
                          ? '#27272A'
                          : '#F1F5F9',
                      },
                    ]}>
                    <Icon
                      size={18}
                      color={isSelected ? '#FFFFFF' : optionColor}
                      strokeWidth={2.2}
                    />
                  </View>

                  {isSelected ? (
                    <View
                      style={[
                        styles.checkBadge,
                        { backgroundColor: optionColor },
                      ]}>
                      <Check size={11} color="#FFFFFF" strokeWidth={3} />
                    </View>
                  ) : null}
                </View>

                <Text
                  style={[
                    styles.cardTitle,
                    {
                      color: isSelected ? (isDark ? '#FFFFFF' : optionColor) : theme.text,
                      fontWeight: isSelected ? '700' : '600',
                    },
                  ]}>
                  {opt.label}
                </Text>

                <Text
                  style={[
                    styles.cardSubtitle,
                    { color: theme.mutedForeground },
                  ]}
                  numberOfLines={2}>
                  {opt.subtitle}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* 2. Line Operational Status Section */}
      <View style={styles.group}>
        <View style={styles.groupHeader}>
          <Text style={[styles.groupLabel, { color: theme.mutedForeground }]}>
            Ou relate uma condição geral da linha
          </Text>
        </View>

        <View style={styles.list}>
          {statusOptions.map((opt) => {
            const isSelected = value === opt.type;
            const Icon = opt.Icon;
            const optionColor = isDark ? opt.darkColor : opt.color;

            return (
              <Pressable
                key={opt.type}
                onPress={() => onChange(opt.type)}
                accessibilityRole="radio"
                accessibilityLabel={`${opt.label}: ${opt.subtitle}`}
                accessibilityState={{ selected: isSelected }}
                style={({ pressed }) => [
                  styles.statusRowCard,
                  {
                    backgroundColor: isSelected
                      ? optionColor + (isDark ? '25' : '15')
                      : theme.card,
                    borderColor: isSelected ? optionColor : theme.border,
                    borderWidth: isSelected ? 2 : 1,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}>
                <View
                  style={[
                    styles.iconBadge,
                    {
                      backgroundColor: isSelected
                        ? optionColor
                        : isDark
                        ? '#27272A'
                        : '#F1F5F9',
                    },
                  ]}>
                  <Icon
                    size={18}
                    color={isSelected ? '#FFFFFF' : optionColor}
                    strokeWidth={2.2}
                  />
                </View>

                <View style={styles.statusTextContainer}>
                  <Text
                    style={[
                      styles.statusTitle,
                      {
                        color: isSelected ? (isDark ? '#FFFFFF' : optionColor) : theme.text,
                        fontWeight: isSelected ? '700' : '600',
                      },
                    ]}>
                    {opt.label}
                  </Text>
                  <Text
                    style={[
                      styles.statusSubtitle,
                      { color: theme.mutedForeground },
                    ]}>
                    {opt.subtitle}
                  </Text>
                </View>

                {isSelected ? (
                  <View
                    style={[
                      styles.checkBadge,
                      { backgroundColor: optionColor },
                    ]}>
                    <Check size={12} color="#FFFFFF" strokeWidth={3} />
                  </View>
                ) : (
                  <View
                    style={[
                      styles.radioCircle,
                      { borderColor: theme.border },
                    ]}
                  />
                )}
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
  sectionHeader: {
    marginBottom: Spacing.two,
  },
  sectionTitle: {
    fontSize: Typography.bodyBold.fontSize,
    fontWeight: Typography.bodyBold.fontWeight,
  },
  sectionSub: {
    fontSize: Typography.caption.fontSize,
    marginTop: 2,
  },
  group: {
    marginBottom: Spacing.three,
  },
  groupHeader: {
    marginBottom: Spacing.two,
  },
  groupLabel: {
    fontSize: Typography.small.fontSize,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  trainCard: {
    flexBasis: '48%',
    flexGrow: 1,
    borderRadius: Radius.medium,
    padding: Spacing.three,
    justifyContent: 'space-between',
    minHeight: 112,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBadge: {
    width: 20,
    height: 20,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: Typography.bodyBold.fontSize,
    lineHeight: 20,
  },
  cardSubtitle: {
    fontSize: Typography.small.fontSize,
    lineHeight: 16,
    marginTop: 2,
  },
  list: {
    gap: Spacing.two,
  },
  statusRowCard: {
    borderRadius: Radius.medium,
    paddingVertical: Spacing.two + 2,
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: Typography.body.fontSize,
    lineHeight: 20,
  },
  statusSubtitle: {
    fontSize: Typography.caption.fontSize,
    marginTop: 1,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: Radius.full,
    borderWidth: 1.5,
  },
});
