import React, { forwardRef } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
}

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      containerStyle,
      inputStyle,
      style,
      placeholderTextColor,
      ...rest
    },
    ref,
  ) => {
    const theme = useTheme();

    return (
      <View style={[styles.container, containerStyle]}>
        {label && (
          <Text style={[styles.label, { color: theme.text }]}>
            {label}
          </Text>
        )}
        <View
          style={[
            styles.inputWrapper,
            {
              backgroundColor: theme.card,
              borderColor: error ? theme.destructive : theme.border,
            },
          ]}>
          {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
          <TextInput
            ref={ref}
            placeholderTextColor={placeholderTextColor || theme.mutedForeground}
            style={[
              styles.input,
              { color: theme.text },
              inputStyle,
              style,
            ]}
            {...rest}
          />
          {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
        </View>
        {error ? (
          <Text style={[styles.error, { color: theme.destructive }]}>{error}</Text>
        ) : helperText ? (
          <Text style={[styles.helper, { color: theme.mutedForeground }]}>{helperText}</Text>
        ) : null}
      </View>
    );
  },
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.three,
  },
  label: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '600',
    marginBottom: Spacing.one,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.three,
    minHeight: 46,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.two,
    fontSize: Typography.body.fontSize,
  },
  leftIcon: {
    marginRight: Spacing.two,
  },
  rightIcon: {
    marginLeft: Spacing.two,
  },
  error: {
    fontSize: Typography.small.fontSize,
    marginTop: Spacing.one,
    fontWeight: '500',
  },
  helper: {
    fontSize: Typography.small.fontSize,
    marginTop: Spacing.one,
  },
});
