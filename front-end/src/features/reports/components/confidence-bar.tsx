import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface ConfidenceBarProps {
  confidence: number; // 0..1
  showLabel?: boolean;
}

export function ConfidenceBar({ confidence, showLabel = true }: ConfidenceBarProps) {
  const theme = useTheme();
  const percentage = Math.min(100, Math.max(0, Math.round(confidence * 100)));

  const getColor = () => {
    if (percentage >= 70) return theme.statusNormal;
    if (percentage >= 45) return theme.statusRestricted;
    return theme.mutedForeground;
  };

  const getLabel = () => {
    if (percentage >= 70) return 'Alta certeza';
    if (percentage >= 45) return 'Certeza moderada';
    return 'Poucos relatos';
  };

  const barColor = getColor();

  return (
    <View style={styles.container}>
      <View style={[styles.barBackground, { backgroundColor: theme.backgroundSelected }]}>
        <View
          style={[
            styles.barFill,
            {
              width: `${percentage}%`,
              backgroundColor: barColor,
            },
          ]}
        />
      </View>
      {showLabel && (
        <View style={styles.labelRow}>
          <Text style={[styles.labelText, { color: theme.mutedForeground }]}>
            {percentage}% confiabilidade • {getLabel()}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: Spacing.half,
  },
  barBackground: {
    height: 4,
    borderRadius: Radius.full,
    overflow: 'hidden',
    width: '100%',
  },
  barFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  labelText: {
    fontSize: Typography.small.fontSize,
  },
});
