import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, StyleProp, Pressable } from 'react-native';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  elevated?: boolean;
}

export function Card({ children, style, onPress, elevated = true }: CardProps) {
  const theme = useTheme();

  const containerStyle: ViewStyle = {
    backgroundColor: theme.card,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: Radius.medium,
    padding: Spacing.three,
    ...(elevated ? Shadows.card : {}),
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          containerStyle,
          pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
          style,
        ]}>
        {children}
      </Pressable>
    );
  }

  return <View style={[containerStyle, style]}>{children}</View>;
}

export function CardHeader({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.header, style]}>{children}</View>;
}

export function CardTitle({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  const theme = useTheme();
  return (
    <Text style={[styles.title, { color: theme.cardForeground }, style]}>
      {children}
    </Text>
  );
}

export function CardDescription({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  const theme = useTheme();
  return (
    <Text style={[styles.description, { color: theme.mutedForeground }, style]}>
      {children}
    </Text>
  );
}

export function CardContent({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.content, style]}>{children}</View>;
}

export function CardFooter({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.footer, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  header: {
    marginBottom: Spacing.two,
  },
  title: {
    fontSize: Typography.subheading.fontSize,
    fontWeight: Typography.subheading.fontWeight,
    lineHeight: Typography.subheading.lineHeight,
  },
  description: {
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.lineHeight,
    marginTop: Spacing.half,
  },
  content: {
    marginVertical: Spacing.one,
  },
  footer: {
    marginTop: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.two,
  },
});
