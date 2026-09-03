import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { CircleCheck, TriangleAlert, CircleX, CircleAlert } from 'lucide-react-native';
import { LineStatus } from '@/api/types';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface StatusBadgeProps {
  status: LineStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

import { STATUS_CONFIG } from '@/constants/metro';
export { STATUS_CONFIG };

function StatusIcon({ status, size, color }: { status: LineStatus; size: number; color: string }) {
  switch (status) {
    case 'NORMAL':
      return <CircleCheck size={size} color={color} />;
    case 'RESTRICTED':
      return <TriangleAlert size={size} color={color} />;
    case 'INTERRUPTED':
      return <CircleX size={size} color={color} />;
    case 'UNKNOWN':
    default:
      return <CircleAlert size={size} color={color} />;
  }
}

export function StatusBadge({ status, size = 'md', showIcon = true }: StatusBadgeProps) {
  const theme = useTheme();
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.UNKNOWN;

  const getColors = (): { bg: string; border: string; text: string } => {
    switch (status) {
      case 'NORMAL':
        return {
          bg: theme.statusNormalBg,
          border: theme.statusNormalBorder,
          text: theme.statusNormal,
        };
      case 'RESTRICTED':
        return {
          bg: theme.statusRestrictedBg,
          border: theme.statusRestrictedBorder,
          text: theme.statusRestricted,
        };
      case 'INTERRUPTED':
        return {
          bg: theme.statusInterruptedBg,
          border: theme.statusInterruptedBorder,
          text: theme.statusInterrupted,
        };
      case 'UNKNOWN':
      default:
        return {
          bg: theme.statusUnknownBg,
          border: theme.statusUnknownBorder,
          text: theme.statusUnknown,
        };
    }
  };

  const colors = getColors();

  const containerStyle: ViewStyle = {
    backgroundColor: colors.bg,
    borderColor: colors.border,
    borderWidth: 1,
    paddingVertical: size === 'sm' ? Spacing.half : size === 'lg' ? Spacing.two : Spacing.one,
    paddingHorizontal: size === 'sm' ? Spacing.one + 2 : size === 'lg' ? Spacing.three : Spacing.two,
    borderRadius: Radius.full,
  };

  const textStyle: TextStyle = {
    color: colors.text,
    fontSize:
      size === 'sm'
        ? Typography.small.fontSize
        : size === 'lg'
          ? Typography.bodyBold.fontSize
          : Typography.caption.fontSize,
    fontWeight: '700',
  };

  const iconSize = size === 'sm' ? 12 : size === 'lg' ? 18 : 14;

  return (
    <View style={[styles.badge, containerStyle]}>
      {showIcon && <StatusIcon status={status} size={iconSize} color={colors.text} />}
      <Text style={textStyle}>
        {size === 'sm' ? config.shortLabel : config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.one,
  },
  icon: {
    fontSize: 12,
  },
});
