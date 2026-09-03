import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { DirectionDto } from '@/api/types';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface DirectionSelectorProps {
  directions: DirectionDto[];
  value?: number | null;
  onChange: (directionId: number) => void;
  error?: string;
}

export function DirectionSelector({
  directions,
  value,
  onChange,
  error,
}: DirectionSelectorProps) {
  const theme = useTheme();

  if (!directions || directions.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.text }]}>Sentido do trem:</Text>

      <View style={styles.buttonsRow}>
        {directions.map((dir) => {
          const isSelected = value === dir.id;
          return (
            <Pressable
              key={dir.id}
              onPress={() => onChange(dir.id)}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              style={({ pressed }) => [
                styles.button,
                {
                  backgroundColor: isSelected
                    ? theme.primary
                    : theme.card,
                  borderColor: isSelected ? theme.primary : theme.border,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}>
              <Text
                style={[
                  styles.label,
                  {
                    color: isSelected ? theme.primaryForeground : theme.text,
                    fontWeight: isSelected ? '700' : '500',
                  },
                ]}>
                {dir.name}
              </Text>
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
  title: {
    fontSize: Typography.bodyBold.fontSize,
    fontWeight: Typography.bodyBold.fontWeight,
    marginBottom: Spacing.two,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  button: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.medium,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: Typography.body.fontSize,
    textAlign: 'center',
  },
  error: {
    fontSize: Typography.small.fontSize,
    marginTop: Spacing.one,
  },
});
