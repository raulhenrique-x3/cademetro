import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MapPin, Plus } from 'lucide-react-native';
import { ScreenShell } from '@/components/layout/screen-shell';
import { useStationDetail } from '@/features/metro/queries';
import { useStationStatus } from '@/features/status/queries';
import { useRecentReports } from '@/features/reports/queries';
import { StatusBadge } from '@/features/status/components/status-badge';
import { ReportCard } from '@/features/reports/components/report-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatTimeAgo } from '@/lib/date';

export default function StationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const stationId = id ? parseInt(id, 10) : 0;
  const router = useRouter();
  const theme = useTheme();

  const {
    data: station,
    isLoading: loadingStation,
    error: stationError,
    refetch: refetchStation,
  } = useStationDetail(stationId);

  const {
    data: statusDto,
    isLoading: loadingStatus,
    refetch: refetchStatus,
  } = useStationStatus(stationId);

  const {
    data: reportsData,
    isLoading: loadingReports,
    refetch: refetchReports,
  } = useRecentReports({ stationId, limit: 15 });

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchStation(), refetchStatus(), refetchReports()]);
    setRefreshing(false);
  };

  const reports = reportsData?.reports ?? [];
  const status = statusDto?.status ?? 'UNKNOWN';
  const primaryLineId = station?.lines?.[0]?.id;

  if (loadingStation) {
    return (
      <ScreenShell showBack>
        <Skeleton height={140} borderRadius={Radius.large} />
        <View style={{ height: Spacing.three }} />
        <Skeleton height={90} borderRadius={Radius.medium} />
      </ScreenShell>
    );
  }

  if (stationError || !station) {
    return (
      <ScreenShell showBack>
        <ErrorState
          title="Estação não encontrada"
          message="Não foi possível obter os dados da estação solicitada."
          onRetry={handleRefresh}
        />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell showBack refreshing={refreshing} onRefresh={handleRefresh}>
      {/* Station Header Card */}
      <View
        style={[
          styles.headerCard,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
          },
          Shadows.card,
        ]}>
        <View style={styles.headerContent}>
          <View style={styles.titleRow}>
            <View style={styles.titleLeft}>
              <MapPin size={22} color={theme.primary} />
              <View>
                <Text style={[styles.stationName, { color: theme.text }]}>
                  Estação {station.name}
                </Text>
                {station.code && (
                  <Text style={[styles.stationCode, { color: theme.mutedForeground }]}>
                    Código: {station.code}
                  </Text>
                )}
              </View>
            </View>
            <StatusBadge status={status} size="md" />
          </View>

          {/* Lines passing through station */}
          {station.lines && station.lines.length > 0 && (
            <View style={styles.linesRow}>
              <Text style={[styles.linesLabel, { color: theme.mutedForeground }]}>
                Linhas atendidas:
              </Text>
              {station.lines.map((l) => (
                <View
                  key={l.id}
                  style={[styles.lineBadge, { backgroundColor: l.color }]}>
                  <Text style={styles.lineBadgeText}>{l.name}</Text>
                </View>
              ))}
            </View>
          )}

          <Text style={[styles.metaText, { color: theme.mutedForeground }]}>
            {statusDto?.lastUpdateTime
              ? `Status atualizado ${formatTimeAgo(statusDto.lastUpdateTime)}`
              : 'Sem relatos específicos nesta estação'}
          </Text>

          <Button
            size="md"
            icon={<Plus size={16} color={theme.primaryForeground} strokeWidth={2.5} />}
            onPress={() =>
              router.push(
                `/report?stationId=${station.id}${primaryLineId ? `&lineId=${primaryLineId}` : ''}`,
              )
            }
            style={styles.reportButton}>
            Reportar nesta estação
          </Button>
        </View>
      </View>

      {/* Recent reports at this station */}
      <View style={styles.reportsSection}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Relatos Recentes nesta Estação
        </Text>

        {loadingReports ? (
          <View style={styles.loadingStack}>
            <Skeleton height={90} borderRadius={Radius.medium} />
            <Skeleton height={90} borderRadius={Radius.medium} />
          </View>
        ) : reports.length === 0 ? (
          <EmptyState
            title="Nenhum relato recente nesta estação"
            description="Nenhum passageiro relatou movimentações nesta estação recentemente. Seja o primeiro!"
            actionLabel="+ Reportar agora"
            onAction={() =>
              router.push(
                `/report?stationId=${station.id}${primaryLineId ? `&lineId=${primaryLineId}` : ''}`,
              )
            }
          />
        ) : (
          <View style={styles.reportsFeed}>
            {reports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </View>
        )}
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    borderRadius: Radius.large,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: Spacing.three,
  },
  headerContent: {
    padding: Spacing.four,
    gap: Spacing.two,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  titleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flex: 1,
  },
  pinIcon: {
    fontSize: 24,
  },
  stationName: {
    fontSize: Typography.heading.fontSize,
    fontWeight: '800',
  },
  stationCode: {
    fontSize: Typography.small.fontSize,
  },
  linesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.one,
    marginTop: Spacing.one,
  },
  linesLabel: {
    fontSize: Typography.caption.fontSize,
  },
  lineBadge: {
    paddingVertical: 2,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.small,
  },
  lineBadgeText: {
    color: '#FFFFFF',
    fontSize: Typography.small.fontSize,
    fontWeight: '700',
  },
  metaText: {
    fontSize: Typography.caption.fontSize,
  },
  reportButton: {
    marginTop: Spacing.two,
    width: '100%',
  },
  reportsSection: {
    marginTop: Spacing.two,
  },
  sectionTitle: {
    fontSize: Typography.subheading.fontSize,
    fontWeight: Typography.subheading.fontWeight,
    marginBottom: Spacing.two,
  },
  reportsFeed: {
    gap: Spacing.two,
  },
  loadingStack: {
    gap: Spacing.two,
  },
});
