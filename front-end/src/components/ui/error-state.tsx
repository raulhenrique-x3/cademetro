import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { TriangleAlert } from 'lucide-react-native';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Button } from './button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function ErrorState({
  title = 'Ocorreu um erro',
  message = 'Não foi possível carregar as informações. Tente novamente.',
  onRetry,
  style,
}: ErrorStateProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
        },
        style,
      ]}>
      <View
        style={[
          styles.badge,
          {
            backgroundColor: theme.statusInterruptedBg,
            borderColor: theme.statusInterruptedBorder,
          },
        ]}>
        <TriangleAlert size={22} color={theme.statusInterrupted} />
      </View>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.message, { color: theme.mutedForeground }]}>{message}</Text>
      {onRetry && (
        <View style={styles.action}>
          <Button variant="outline" size="sm" onPress={onRetry}>
            Tentar novamente
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
    borderRadius: Radius.medium,
    borderWidth: 1,
    marginVertical: Spacing.two,
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  badgeText: {
    fontSize: 20,
  },
  title: {
    fontSize: Typography.bodyBold.fontSize,
    fontWeight: Typography.bodyBold.fontWeight,
    textAlign: 'center',
  },
  message: {
    fontSize: Typography.caption.fontSize,
    textAlign: 'center',
    marginTop: Spacing.one,
    maxWidth: 320,
  },
  action: {
    marginTop: Spacing.three,
  },
});
