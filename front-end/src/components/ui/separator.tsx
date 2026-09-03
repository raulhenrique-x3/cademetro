import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical';
  style?: StyleProp<ViewStyle>;
  spacing?: keyof typeof Spacing;
}

export function Separator({
  orientation = 'horizontal',
  style,
  spacing = 'two',
}: SeparatorProps) {
  const theme = useTheme();
  const margin = Spacing[spacing];

  if (orientation === 'vertical') {
    return (
      <View
        style={[
          styles.vertical,
          {
            backgroundColor: theme.border,
            marginHorizontal: margin,
          },
          style,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.horizontal,
        {
          backgroundColor: theme.border,
          marginVertical: margin,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  horizontal: {
    height: 1,
    width: '100%',
  },
  vertical: {
    width: 1,
    height: '100%',
  },
});
