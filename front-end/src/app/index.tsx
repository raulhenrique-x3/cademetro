import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, TrainFront, MapPin } from 'lucide-react-native';
import { ScreenShell } from '@/components/layout/screen-shell';
import { useLines, useStations } from '@/features/metro/queries';
import { useAllLinesStatus } from '@/features/status/queries';
import { useRecentReports } from '@/features/reports/queries';
import { LineStatusCard } from '@/features/status/components/line-status-card';
import { ReportCard } from '@/features/reports/components/report-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useRealtime } from '@/hooks/use-realtime';
import { useLocation } from '@/hooks/use-location';
import { AdBanner } from '@/features/ads';

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();

  // Realtime SSE updates for the query cache
  const { isConnected } = useRealtime();

  // Queries
  const {
    data: lines = [],
    isLoading: loadingLines,
    error: linesError,
    refetch: refetchLines,
  } = useLines();

  const {
    data: statusList = [],
    isLoading: loadingStatus,
    error: statusError,
    refetch: refetchStatus,
  } = useAllLinesStatus();

  const {
    data: recentReportsData,
    isLoading: loadingReports,
    error: reportsError,
    refetch: refetchReports,
  } = useRecentReports({ limit: 10 });

  const { data: stations = [] } = useStations();
  const {
    coords,
    isLocating,
    requestLocation,
    nearestStation,
  } = useLocation({ stations, showToastOnError: false });

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetchLines(),
      refetchStatus(),
      refetchReports(),
      coords ? requestLocation() : Promise.resolve(null),
    ]);
    setRefreshing(false);
  };

  const reports = recentReportsData?.reports ?? [];
  const statusMap = new Map(statusList.map((s) => [s.lineId, s]));

  return (
    <ScreenShell refreshing={refreshing} onRefresh={handleRefresh}>
      {/* 1. Quick Location / Station banner & Primary Report Action */}
      <View
        style={[
          styles.heroCard,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}
      >
        <View style={styles.heroTextContainer}>
          <Text style={[styles.heroGreeting, { color: theme.mutedForeground }]}>
            Metrô de Recife
          </Text>
          <Text style={[styles.heroTitle, { color: theme.text }]}>
            Como está o metrô agora?
          </Text>
        </View>

        {/* Nearest station banner / Geolocation widget */}
        {nearestStation ? (
          <View
            style={[
              styles.nearestStationCard,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.nearestStationHeader}>
              <View
                style={[
                  styles.nearestPinBadge,
                  { backgroundColor: theme.primary + '18' },
                ]}
              >
                <MapPin size={16} color={theme.primary} />
              </View>
              <View style={styles.nearestStationInfo}>
                <Text
                  style={[
                    styles.nearestStationLabel,
                    { color: theme.mutedForeground },
                  ]}
                >
                  Estação mais próxima de você
                </Text>
                <Text style={[styles.nearestStationName, { color: theme.text }]}>
                  {nearestStation.station.name}
                  <Text
                    style={[
                      styles.nearestStationDistance,
                      { color: theme.primary },
                    ]}
                  >
                    {` • a ${nearestStation.formattedDistance}`}
                  </Text>
                </Text>
              </View>
            </View>

            <View style={styles.nearestStationActions}>
              <Pressable
                onPress={() =>
                  router.push(`/station/${nearestStation.station.id}`)
                }
                style={({ pressed }) => [
                  styles.nearestActionBtn,
                  {
                    borderColor: theme.border,
                    backgroundColor: theme.card,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text style={[styles.nearestActionText, { color: theme.text }]}>
                  Ver estação
                </Text>
              </Pressable>

              <Pressable
                onPress={() =>
                  router.push(
                    `/report?stationId=${nearestStation.station.id}${
                      nearestStation.station.lines?.[0]?.id
                        ? `&lineId=${nearestStation.station.lines[0].id}`
                        : ''
                    }`,
                  )
                }
                style={({ pressed }) => [
                  styles.nearestActionBtn,
                  {
                    borderColor: theme.primary,
                    backgroundColor: theme.primary,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.nearestActionText,
                    { color: theme.primaryForeground, fontWeight: '700' },
                  ]}
                >
                  Reportar aqui
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable
            onPress={() => requestLocation()}
            disabled={isLocating}
            style={({ pressed }) => [
              styles.locateMeButton,
              {
                borderColor: theme.border,
                backgroundColor: theme.backgroundElement,
                opacity: pressed || isLocating ? 0.7 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Detectar estação mais próxima"
          >
            <MapPin size={15} color={theme.primary} />
            <Text style={[styles.locateMeText, { color: theme.text }]}>
              {isLocating
                ? 'Detectando estação próxima...'
                : 'Detectar estação mais próxima'}
            </Text>
          </Pressable>
        )}

        <Button
          size="lg"
          icon={
            <Plus size={18} color={theme.primaryForeground} strokeWidth={2.5} />
          }
          onPress={() => router.push('/report')}
          style={styles.heroReportBtn}
          accessibilityLabel="Criar novo relato sobre o metrô"
        >
          Reportar metrô
        </Button>
      </View>

      {/* 2. Current Operational Status */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Situação das Linhas
        </Text>
        <Pressable onPress={() => router.push('/explore')}>
          <Text style={[styles.seeAllText, { color: theme.primary }]}>
            Ver estações →
          </Text>
        </Pressable>
      </View>

      {loadingLines || loadingStatus ? (
        <View style={styles.loadingStack}>
          <Skeleton height={68} borderRadius={Radius.medium} />
          <Skeleton height={68} borderRadius={Radius.medium} />
          <Skeleton height={68} borderRadius={Radius.medium} />
        </View>
      ) : linesError || statusError ? (
        <ErrorState
          title="Não foi possível carregar o status"
          message="Houve uma falha ao conectar ao serviço de status."
          onRetry={handleRefresh}
        />
      ) : lines.length === 0 ? (
        <EmptyState
          title="Nenhuma linha cadastrada"
          description="O sistema ainda não possui linhas configuradas."
        />
      ) : (
        <View style={styles.linesList}>
          {lines.map((line) => (
            <LineStatusCard
              key={line.id}
              line={line}
              statusDto={statusMap.get(line.id)}
            />
          ))}
        </View>
      )}

      {/* Publicidade AdMob Nativa Inline */}
      <AdBanner placement="home_feed" style={styles.adBanner} />

      {/* 3. Recent Train Activity Feed */}
      <View style={[styles.sectionHeader, { marginTop: Spacing.four }]}>
        <View style={styles.recentReportsHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Atividade Recente
          </Text>
          {isConnected && (
            <View
              style={[
                styles.liveBadge,
                { backgroundColor: theme.statusNormalBg },
              ]}
            >
              <Text
                style={[styles.liveBadgeText, { color: theme.statusNormal }]}
              >
                Tempo real
              </Text>
            </View>
          )}
        </View>
      </View>

      {loadingReports ? (
        <View style={styles.loadingStack}>
          <Skeleton height={110} borderRadius={Radius.medium} />
          <Skeleton height={110} borderRadius={Radius.medium} />
        </View>
      ) : reportsError ? (
        <ErrorState
          title="Não foi possível carregar os relatos recentes"
          onRetry={refetchReports}
        />
      ) : reports.length === 0 ? (
        <EmptyState
          icon={<TrainFront size={36} color={theme.textSecondary} />}
          title="Nenhum relato recente"
          description="Nenhum passageiro relatou movimentações na última meia hora. Seja o primeiro a colaborar!"
          actionLabel="Reportar agora"
          onAction={() => router.push('/report')}
        />
      ) : (
        <View style={styles.reportsFeed}>
          {reports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </View>
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    padding: Spacing.four,
    borderRadius: Radius.large,
    borderWidth: 1,
    marginBottom: Spacing.three,
    gap: Spacing.three,
  },
  heroTextContainer: {
    gap: Spacing.half,
  },
  heroGreeting: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: Typography.heading.fontSize,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  heroReportBtn: {
    width: '100%',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
    paddingHorizontal: Spacing.one,
  },
  recentReportsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  sectionTitle: {
    fontSize: Typography.subheading.fontSize,
    fontWeight: Typography.subheading.fontWeight,
  },
  seeAllText: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '600',
  },
  liveBadge: {
    paddingVertical: 2,
    paddingHorizontal: Spacing.one + 2,
    borderRadius: Radius.full,
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  linesList: {
    gap: Spacing.one,
  },
  loadingStack: {
    gap: Spacing.two,
    marginVertical: Spacing.two,
  },
  reportsFeed: {
    gap: Spacing.two,
  },
  locateMeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.medium,
    borderWidth: 1,
  },
  locateMeText: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '600',
  },
  nearestStationCard: {
    padding: Spacing.three,
    borderRadius: Radius.medium,
    borderWidth: 1,
    gap: Spacing.two,
  },
  nearestStationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  nearestPinBadge: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nearestStationInfo: {
    flex: 1,
  },
  nearestStationLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  nearestStationName: {
    fontSize: Typography.bodyBold.fontSize,
    fontWeight: '700',
  },
  nearestStationDistance: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '600',
  },
  nearestStationActions: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.half,
  },
  nearestActionBtn: {
    flex: 1,
    paddingVertical: Spacing.one + 2,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.small,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nearestActionText: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '600',
  },
  adBanner: {
    marginTop: Spacing.three,
    marginBottom: Spacing.one,
  },
});
