import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Button } from './button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, style]}>
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      {description && (
        <Text style={[styles.description, { color: theme.mutedForeground }]}>
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <View style={styles.action}>
          <Button variant="secondary" size="sm" onPress={onAction}>
            {actionLabel}
          </Button>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginBottom: Spacing.two,
    opacity: 0.7,
  },
  title: {
    fontSize: Typography.bodyBold.fontSize,
    fontWeight: Typography.bodyBold.fontWeight,
    textAlign: 'center',
  },
  description: {
    fontSize: Typography.caption.fontSize,
    textAlign: 'center',
    marginTop: Spacing.one,
    maxWidth: 320,
  },
  action: {
    marginTop: Spacing.three,
  },
});
