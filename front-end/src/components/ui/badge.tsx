import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'outline'
  | 'success'
  | 'warning'
  | 'destructive';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: React.ReactNode;
}

export function Badge({
  children,
  variant = 'default',
  style,
  textStyle,
  icon,
}: BadgeProps) {
  const theme = useTheme();

  const getStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case 'success':
        return {
          container: {
            backgroundColor: theme.statusNormalBg,
            borderColor: theme.statusNormalBorder,
            borderWidth: 1,
          },
          text: { color: theme.statusNormal },
        };
      case 'warning':
        return {
          container: {
            backgroundColor: theme.statusRestrictedBg,
            borderColor: theme.statusRestrictedBorder,
            borderWidth: 1,
          },
          text: { color: theme.statusRestricted },
        };
      case 'destructive':
        return {
          container: {
            backgroundColor: theme.statusInterruptedBg,
            borderColor: theme.statusInterruptedBorder,
            borderWidth: 1,
          },
          text: { color: theme.statusInterrupted },
        };
      case 'secondary':
        return {
          container: {
            backgroundColor: theme.backgroundSelected,
            borderWidth: 0,
          },
          text: { color: theme.textSecondary },
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderColor: theme.border,
            borderWidth: 1,
          },
          text: { color: theme.text },
        };
      case 'default':
      default:
        return {
          container: {
            backgroundColor: theme.primary,
            borderWidth: 0,
          },
          text: { color: theme.primaryForeground },
        };
    }
  };

  const { container: containerVariantStyle, text: textVariantStyle } = getStyles();

  return (
    <View style={[styles.base, containerVariantStyle, style]}>
      {icon && <View style={styles.iconWrapper}>{icon}</View>}
      {typeof children === 'string' ? (
        <Text style={[styles.text, textVariantStyle, textStyle]}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  iconWrapper: {
    marginRight: Spacing.one,
  },
  text: {
    fontSize: Typography.small.fontSize,
    fontWeight: '600',
    lineHeight: Typography.small.lineHeight,
  },
});
