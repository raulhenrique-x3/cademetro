import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { LineDto, LineStatusDto } from '@/api/types';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { StatusBadge } from './status-badge';
import { formatTimeAgo } from '@/lib/date';

export interface LineStatusCardProps {
  line: LineDto;
  statusDto?: LineStatusDto;
  onPress?: () => void;
}

export function LineStatusCard({ line, statusDto, onPress }: LineStatusCardProps) {
  const theme = useTheme();
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/line/${line.id}`);
    }
  };

  const status = statusDto?.status ?? 'UNKNOWN';
  const lastUpdate = statusDto?.lastUpdateTime;
  const reportCount = statusDto?.reports?.length ?? 0;

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`${line.name}, status ${status}`}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
          opacity: pressed ? 0.85 : 1,
        },
        Shadows.card,
      ]}>
      {/* Line Color Indicator Stripe */}
      <View style={[styles.colorStripe, { backgroundColor: line.color }]} />

      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.lineInfo}>
            <View style={[styles.lineBadge, { backgroundColor: line.color }]}>
              <Text style={styles.lineBadgeText}>{line.code.split('-')[0]}</Text>
            </View>
            <Text style={[styles.lineName, { color: theme.text }]} numberOfLines={1}>
              {line.name}
            </Text>
          </View>
          <StatusBadge status={status} size="sm" />
        </View>

        <View style={styles.bottomRow}>
          <Text style={[styles.metaText, { color: theme.mutedForeground }]}>
            {lastUpdate ? `Atualizado ${formatTimeAgo(lastUpdate)}` : 'Sem relatos na última meia hora'}
          </Text>
          {reportCount > 0 && (
            <Text style={[styles.reportsCount, { color: theme.textSecondary }]}>
              {reportCount} {reportCount === 1 ? 'relato' : 'relatos'}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: Radius.medium,
    overflow: 'hidden',
    marginBottom: Spacing.two,
  },
  colorStripe: {
    width: 6,
  },
  content: {
    flex: 1,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  lineInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flex: 1,
  },
  lineBadge: {
    width: 24,
    height: 24,
    borderRadius: Radius.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lineBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  lineName: {
    fontSize: Typography.bodyBold.fontSize,
    fontWeight: Typography.bodyBold.fontWeight,
    flex: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaText: {
    fontSize: Typography.caption.fontSize,
  },
  reportsCount: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '600',
  },
});
