import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { ArrowRight, Check, Compass } from 'lucide-react-native';
import { DirectionDto } from '@/api/types';
import { Radius, Spacing, Typography, isDarkColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface DirectionSelectorProps {
  directions: DirectionDto[];
  value?: number | null;
  onChange: (directionId: number) => void;
  error?: string;
  lineColor?: string;
}

export function DirectionSelector({
  directions,
  value,
  onChange,
  error,
  lineColor,
}: DirectionSelectorProps) {
  const theme = useTheme();
  const isDark = isDarkColors(theme);
  const activeColor = lineColor || theme.primary;

  if (!directions || directions.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>Sentido do Trem</Text>
          <Text style={[styles.subtitle, { color: theme.mutedForeground }]}>
            Para onde o trem está seguindo?
          </Text>
        </View>
      </View>

      <View style={styles.buttonsRow}>
        {directions.map((dir) => {
          const isSelected = value === dir.id;
          return (
            <Pressable
              key={dir.id}
              onPress={() => onChange(dir.id)}
              accessibilityRole="radio"
              accessibilityLabel={`Sentido ${dir.name}`}
              accessibilityState={{ selected: isSelected }}
              style={({ pressed }) => [
                styles.button,
                {
                  backgroundColor: isSelected
                    ? activeColor + (isDark ? '25' : '15')
                    : theme.card,
                  borderColor: error && !value
                    ? theme.destructive
                    : isSelected
                    ? activeColor
                    : theme.border,
                  borderWidth: isSelected ? 2 : 1,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}>
              <View style={styles.buttonTopRow}>
                <View
                  style={[
                    styles.directionIconBadge,
                    {
                      backgroundColor: isSelected
                        ? activeColor
                        : isDark
                        ? '#27272A'
                        : '#F1F5F9',
                    },
                  ]}>
                  {isSelected ? (
                    <Compass size={16} color="#FFFFFF" strokeWidth={2.2} />
                  ) : (
                    <ArrowRight size={16} color={activeColor} strokeWidth={2.2} />
                  )}
                </View>

                {isSelected ? (
                  <View style={[styles.checkBadge, { backgroundColor: activeColor }]}>
                    <Check size={11} color="#FFFFFF" strokeWidth={3} />
                  </View>
                ) : (
                  <View style={[styles.radioCircle, { borderColor: theme.border }]} />
                )}
              </View>

              <View style={styles.textContainer}>
                <Text style={[styles.prefixLabel, { color: theme.mutedForeground }]}>
                  Sentido
                </Text>
                <Text
                  style={[
                    styles.label,
                    {
                      color: isSelected ? (isDark ? '#FFFFFF' : activeColor) : theme.text,
                      fontWeight: isSelected ? '700' : '600',
                    },
                  ]}
                  numberOfLines={1}>
                  {dir.name}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      {error && <Text style={[styles.error, { color: theme.destructive }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.two,
  },
  headerRow: {
    marginBottom: Spacing.two,
  },
  title: {
    fontSize: Typography.bodyBold.fontSize,
    fontWeight: Typography.bodyBold.fontWeight,
  },
  subtitle: {
    fontSize: Typography.caption.fontSize,
    marginTop: 2,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  button: {
    flex: 1,
    borderRadius: Radius.medium,
    paddingVertical: Spacing.two + 2,
    paddingHorizontal: Spacing.three,
    justifyContent: 'space-between',
    minHeight: 84,
  },
  buttonTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.one,
  },
  directionIconBadge: {
    width: 28,
    height: 28,
    borderRadius: Radius.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBadge: {
    width: 18,
    height: 18,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircle: {
    width: 16,
    height: 16,
    borderRadius: Radius.full,
    borderWidth: 1.5,
  },
  textContainer: {
    marginTop: 2,
  },
  prefixLabel: {
    fontSize: Typography.small.fontSize,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  label: {
    fontSize: Typography.bodyBold.fontSize,
    lineHeight: 20,
  },
  error: {
    fontSize: Typography.small.fontSize,
    marginTop: Spacing.one,
    fontWeight: '500',
  },
});
