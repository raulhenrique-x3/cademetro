import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { ScreenShell } from '@/components/layout/screen-shell';
import { useLineDetail } from '@/features/metro/queries';
import { useLineStatus } from '@/features/status/queries';
import { useRecentReports } from '@/features/reports/queries';
import { StatusBadge } from '@/features/status/components/status-badge';
import { StationList } from '@/features/metro/components/station-list';
import { ReportCard } from '@/features/reports/components/report-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatTimeAgo } from '@/lib/date';

export default function LineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const lineId = id ? parseInt(id, 10) : 0;
  const router = useRouter();
  const theme = useTheme();

  const {
    data: line,
    isLoading: loadingLine,
    error: lineError,
    refetch: refetchLine,
  } = useLineDetail(lineId);

  const {
    data: statusDto,
    refetch: refetchStatus,
  } = useLineStatus(lineId);

  const {
    data: reportsData,
    isLoading: loadingReports,
    refetch: refetchReports,
  } = useRecentReports({ lineId, limit: 15 });

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchLine(), refetchStatus(), refetchReports()]);
    setRefreshing(false);
  };

  const reports = reportsData?.reports ?? [];
  const status = statusDto?.status ?? 'UNKNOWN';

  if (loadingLine) {
    return (
      <ScreenShell showBack>
        <Skeleton height={140} borderRadius={Radius.large} />
        <View style={{ height: Spacing.three }} />
        <Skeleton height={200} borderRadius={Radius.medium} />
      </ScreenShell>
    );
  }

  if (lineError || !line) {
    return (
      <ScreenShell showBack>
        <ErrorState
          title="Linha não encontrada"
          message="Não foi possível obter os dados da linha solicitada."
          onRetry={handleRefresh}
        />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell showBack refreshing={refreshing} onRefresh={handleRefresh}>
      {/* Line Header Card */}
      <View
        style={[
          styles.headerCard,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
          },
          Shadows.card,
        ]}>
        <View style={[styles.colorBanner, { backgroundColor: line.color }]} />

        <View style={styles.headerContent}>
          <View style={styles.titleRow}>
            <View>
              <Text style={[styles.lineName, { color: theme.text }]}>
                {line.name}
              </Text>
              <Text style={[styles.metaText, { color: theme.mutedForeground }]}>
                {statusDto?.lastUpdateTime
                  ? `Atualizado ${formatTimeAgo(statusDto.lastUpdateTime)}`
                  : 'Sem relatos recentes'}
              </Text>
            </View>
            <StatusBadge status={status} size="md" />
          </View>

          {/* Endpoints / Directions */}
          {line.directions && line.directions.length > 0 && (
            <View style={styles.directionsRow}>
              <Text style={[styles.directionsLabel, { color: theme.mutedForeground }]}>
                Terminais:
              </Text>
              {line.directions.map((d) => (
                <View
                  key={d.id}
                  style={[
                    styles.directionBadge,
                    { backgroundColor: theme.backgroundElement },
                  ]}>
                  <Text style={[styles.directionName, { color: theme.text }]}>
                    {d.name}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <Button
            size="md"
            icon={<Plus size={16} color={theme.primaryForeground} strokeWidth={2.5} />}
            onPress={() => router.push(`/report?lineId=${line.id}`)}
            style={styles.reportButton}>
            Reportar nesta linha
          </Button>
        </View>
      </View>

      {/* Stations grouped by branch */}
      {line.branches && line.branches.length > 0 && (
        <View style={styles.branchesSection}>
          {line.branches.map((branch) => (
            <StationList
              key={branch.id}
              title={branch.name}
              stations={branch.stations}
              lineColor={line.color}
            />
          ))}
        </View>
      )}

      {/* Reports on this line */}
      <View style={styles.reportsSection}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Relatos Recentes nesta Linha
        </Text>

        {loadingReports ? (
          <View style={styles.loadingStack}>
            <Skeleton height={90} borderRadius={Radius.medium} />
            <Skeleton height={90} borderRadius={Radius.medium} />
          </View>
        ) : reports.length === 0 ? (
          <EmptyState
            title="Nenhum relato recente nesta linha"
            description="Tudo parece tranquilo ou ninguém relatou incidentes recentes."
            actionLabel="+ Reportar agora"
            onAction={() => router.push(`/report?lineId=${line.id}`)}
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
  colorBanner: {
    height: 8,
    width: '100%',
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
  lineName: {
    fontSize: Typography.heading.fontSize,
    fontWeight: '800',
  },
  metaText: {
    fontSize: Typography.caption.fontSize,
    marginTop: Spacing.half,
  },
  directionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.one,
    marginTop: Spacing.one,
  },
  directionsLabel: {
    fontSize: Typography.small.fontSize,
  },
  directionBadge: {
    paddingVertical: 2,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.small,
  },
  directionName: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '600',
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
  branchesSection: {
    gap: 0,
  },
  loadingStack: {
    gap: Spacing.two,
  },
});
