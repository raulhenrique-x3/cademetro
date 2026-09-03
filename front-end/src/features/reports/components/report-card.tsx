import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import {
  TrainFront,
  TriangleAlert,
  CircleX,
  CircleCheck,
  Info,
  MapPin,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react-native';
import { ReportDto, ReportTypeString } from '@/api/types';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useToast } from '@/context/toast-context';
import { useAuth } from '@/features/auth/auth-context';
import { useConfirmReport, useDisputeReport, useHideReport } from '../queries';
import { ConfidenceBar } from './confidence-bar';
import { formatTimeAgo } from '@/lib/date';
import { Button } from '@/components/ui/button';

import { REPORT_TYPE_CONFIG } from '@/constants/metro';
export { REPORT_TYPE_CONFIG };

function renderReportTypeIcon(type: string, color: string) {
  switch (type) {
    case 'TRAIN_ARRIVING':
    case 'TRAIN_ARRIVED':
    case 'TRAIN_DEPARTED':
      return <TrainFront size={16} color={color} />;
    case 'TRAIN_STOPPED':
    case 'OPERATIONAL_RESTRICTION':
      return <TriangleAlert size={16} color={color} />;
    case 'SERVICE_INTERRUPTION':
      return <CircleX size={16} color={color} />;
    case 'NORMAL_OPERATION':
      return <CircleCheck size={16} color={color} />;
    default:
      return <Info size={16} color={color} />;
  }
}

export interface ReportCardProps {
  report: ReportDto;
}

export function ReportCard({ report }: ReportCardProps) {
  const theme = useTheme();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { showError, showSuccess } = useToast();

  const confirmMutation = useConfirmReport();
  const disputeMutation = useDisputeReport();
  const hideMutation = useHideReport();

  const [hideReason, setHideReason] = useState(false);

  const typeConfig = REPORT_TYPE_CONFIG[report.type] || {
    label: report.type,
    icon: '',
    badgeColor: 'default',
  };

  const isAuthor = user?.id === report.author.id;
  const isModerator = user?.role === 'MODERATOR' || user?.role === 'ADMIN';

  const handleConfirm = () => {
    if (!isAuthenticated) {
      showError('Faça login para confirmar a situação do trem.');
      router.push('/login');
      return;
    }
    if (isAuthor) {
      showError('Você não pode confirmar seu próprio relato.');
      return;
    }
    confirmMutation.mutate(report.id);
  };

  const handleDispute = () => {
    if (!isAuthenticated) {
      showError('Faça login para contestar a situação do trem.');
      router.push('/login');
      return;
    }
    if (isAuthor) {
      showError('Você não pode contestar seu próprio relato.');
      return;
    }
    disputeMutation.mutate(report.id);
  };

  const handleHide = () => {
    if (!isModerator) return;
    hideMutation.mutate(
      {
        id: report.id,
        reason: 'Relato marcado como incorreto pela moderação',
      },
      {
        onSuccess: () => {
          showSuccess('Relato ocultado pela moderação.');
        },
      },
    );
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
        },
        Shadows.card,
      ]}>
      {/* Header: Event Type & Time */}
      <View style={styles.header}>
        <View style={styles.typeRow}>
          {renderReportTypeIcon(report.type, theme.primary)}
          <Text style={[styles.typeLabel, { color: theme.text }]}>
            {typeConfig.label}
          </Text>
        </View>
        <Text style={[styles.timeAgo, { color: theme.mutedForeground }]}>
          {formatTimeAgo(report.createdAt)}
        </Text>
      </View>

      {/* Location / Direction details */}
      <View style={styles.locationContainer}>
        {report.stationName && (
          <View style={styles.badgePill}>
            <MapPin size={12} color={theme.text} />
            <Text style={[styles.locationText, { color: theme.text }]}>
              Estação <Text style={styles.boldText}>{report.stationName}</Text>
            </Text>
          </View>
        )}
        {report.directionName && (
          <View style={styles.badgePill}>
            <Text style={[styles.directionText, { color: theme.textSecondary }]}>
              Sentido <Text style={styles.boldText}>{report.directionName}</Text>
            </Text>
          </View>
        )}
        <View style={[styles.linePill, { backgroundColor: theme.backgroundSelected }]}>
          <Text style={[styles.lineCodeText, { color: theme.textSecondary }]}>
            {report.lineCode}
          </Text>
        </View>
      </View>

      {/* Description */}
      {report.description ? (
        <Text style={[styles.description, { color: theme.text }]}>
          "{report.description}"
        </Text>
      ) : null}

      {/* Confidence Bar */}
      <ConfidenceBar confidence={report.confidence} />

      {/* Author & Action buttons */}
      <View style={styles.footer}>
        <View style={styles.authorInfo}>
          <Text style={[styles.authorName, { color: theme.mutedForeground }]}>
            Por {report.author.username || 'Colaborador'}
          </Text>
          {isAuthor && (
            <Text style={[styles.authorBadge, { color: theme.primary }]}>
              (Você)
            </Text>
          )}
        </View>

        <View style={styles.actionButtons}>
          <Pressable
            onPress={handleConfirm}
            disabled={isAuthor || confirmMutation.isPending}
            style={({ pressed }) => [
              styles.actionButton,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
                opacity: isAuthor ? 0.5 : pressed ? 0.8 : 1,
              },
            ]}>
            <ThumbsUp size={14} color={theme.text} />
            <Text style={[styles.actionCount, { color: theme.text }]}>
              {report.confirmations?.confirm ?? 0}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleDispute}
            disabled={isAuthor || disputeMutation.isPending}
            style={({ pressed }) => [
              styles.actionButton,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
                opacity: isAuthor ? 0.5 : pressed ? 0.8 : 1,
              },
            ]}>
            <ThumbsDown size={14} color={theme.text} />
            <Text style={[styles.actionCount, { color: theme.text }]}>
              {report.confirmations?.dispute ?? 0}
            </Text>
          </Pressable>

          {isModerator && (
            <Button
              variant="destructive"
              size="sm"
              loading={hideMutation.isPending}
              onPress={handleHide}
              style={styles.hideButton}>
              Ocultar
            </Button>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radius.medium,
    padding: Spacing.three,
    marginBottom: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.one,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  typeIcon: {
    fontSize: 16,
  },
  typeLabel: {
    fontSize: Typography.bodyBold.fontSize,
    fontWeight: Typography.bodyBold.fontWeight,
  },
  timeAgo: {
    fontSize: Typography.small.fontSize,
  },
  locationContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.one,
    marginVertical: Spacing.one,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: Spacing.two,
  },
  linePill: {
    paddingVertical: 2,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.small,
  },
  locationText: {
    fontSize: Typography.caption.fontSize,
  },
  directionText: {
    fontSize: Typography.caption.fontSize,
  },
  boldText: {
    fontWeight: '700',
  },
  lineCodeText: {
    fontSize: Typography.small.fontSize,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  description: {
    fontSize: Typography.body.fontSize,
    marginVertical: Spacing.one,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.two,
    paddingTop: Spacing.one,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  authorName: {
    fontSize: Typography.small.fontSize,
  },
  authorBadge: {
    fontSize: Typography.small.fontSize,
    fontWeight: '700',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.full,
    gap: Spacing.one,
  },
  actionIcon: {
    fontSize: 14,
  },
  actionCount: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '600',
  },
  hideButton: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
});
