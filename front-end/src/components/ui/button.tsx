import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
  Platform,
} from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'destructive' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
}

export function Button({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  accessibilityLabel,
}: ButtonProps) {
  const theme = useTheme();

  const getContainerStyle = (pressed: boolean): ViewStyle => {
    let bg: string = theme.primary;
    let border: string = 'transparent';
    let borderWidth = 0;

    switch (variant) {
      case 'primary':
        bg = theme.primary;
        break;
      case 'secondary':
        bg = theme.backgroundSelected;
        break;
      case 'outline':
        bg = 'transparent';
        border = theme.border;
        borderWidth = 1;
        break;
      case 'destructive':
        bg = theme.destructive;
        break;
      case 'ghost':
        bg = 'transparent';
        break;
    }

    const paddingVertical =
      size === 'sm' ? Spacing.one + 2 : size === 'lg' ? Spacing.three : Spacing.two;
    const paddingHorizontal =
      size === 'sm' ? Spacing.two : size === 'lg' ? Spacing.four : Spacing.three;

    return {
      backgroundColor: bg,
      borderColor: border,
      borderWidth,
      paddingVertical,
      paddingHorizontal,
      borderRadius: Radius.medium,
      opacity: disabled || loading ? 0.5 : pressed ? 0.8 : 1,
    };
  };

  const getTextStyle = (): TextStyle => {
    let color: string = theme.primaryForeground;

    switch (variant) {
      case 'primary':
        color = theme.primaryForeground;
        break;
      case 'secondary':
        color = theme.text;
        break;
      case 'outline':
      case 'ghost':
        color = theme.text;
        break;
      case 'destructive':
        color = theme.destructiveForeground;
        break;
    }

    const font =
      size === 'sm' ? Typography.caption : size === 'lg' ? Typography.bodyBold : Typography.bodyBold;

    return {
      color,
      fontSize: font.fontSize,
      fontWeight: font.fontWeight,
      textAlign: 'center',
    };
  };

  return (
    <Pressable
      onPress={disabled || loading ? undefined : onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || (typeof children === 'string' ? children : undefined)}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        getContainerStyle(pressed),
        style,
      ]}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'destructive' ? '#FFFFFF' : theme.text}
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          {typeof children === 'string' ? (
            <Text style={[getTextStyle(), textStyle]}>{children}</Text>
          ) : (
            children
          )}
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    cursor: Platform.OS === 'web' ? ('pointer' as any) : undefined,
  },
});
