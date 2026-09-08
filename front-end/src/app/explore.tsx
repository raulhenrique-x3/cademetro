import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, Navigation } from 'lucide-react-native';
import { ScreenShell } from '@/components/layout/screen-shell';
import { useLines, useStations } from '@/features/metro/queries';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useLocation } from '@/hooks/use-location';
import { calculateDistanceMeters, formatDistance, sortStationsByDistance } from '@/lib/location';
import { AdBanner } from '@/features/ads';

export default function ExploreScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [selectedLineId, setSelectedLineId] = useState<number | undefined>(undefined);
  const [sortByDistance, setSortByDistance] = useState(false);

  const { coords, isLocating, requestLocation } = useLocation({ showToastOnError: true });

  const { data: lines = [], isLoading: loadingLines, error: linesError, refetch: refetchLines } =
    useLines();
  const {
    data: stations = [],
    isLoading: loadingStations,
    error: stationsError,
    refetch: refetchStations,
  } = useStations(selectedLineId);

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchLines(), refetchStations()]);
    setRefreshing(false);
  };

  const filteredStations = useMemo(() => {
    if (!search.trim()) return stations;
    const term = search.toLowerCase().trim();
    return stations.filter((s) => s.name.toLowerCase().includes(term));
  }, [stations, search]);

  const displayedStations = useMemo(() => {
    if (sortByDistance && coords) {
      return sortStationsByDistance(coords, filteredStations);
    }
    return filteredStations;
  }, [filteredStations, sortByDistance, coords]);

  const handleToggleSortDistance = async () => {
    if (!sortByDistance) {
      if (!coords) {
        const loc = await requestLocation();
        if (loc) {
          setSortByDistance(true);
        }
      } else {
        setSortByDistance(true);
      }
    } else {
      setSortByDistance(false);
    }
  };

  return (
    <ScreenShell refreshing={refreshing} onRefresh={handleRefresh}>
      <Text style={[styles.heading, { color: theme.text }]}>Linhas e Estações</Text>
      <Text style={[styles.subheading, { color: theme.mutedForeground }]}>
        Consulte estações, integrações e relatos específicos de cada ponto da rede.
      </Text>

      {/* Lines Horizontal Filter Chips */}
      <View style={styles.filterSection}>
        <Pressable
          onPress={() => setSelectedLineId(undefined)}
          style={[
            styles.filterChip,
            {
              backgroundColor:
                selectedLineId === undefined ? theme.primary : theme.card,
              borderColor:
                selectedLineId === undefined ? theme.primary : theme.border,
            },
          ]}>
          <Text
            style={[
              styles.filterChipText,
              {
                color: selectedLineId === undefined ? theme.primaryForeground : theme.text,
                fontWeight: selectedLineId === undefined ? '700' : '500',
              },
            ]}>
            Todas as Linhas
          </Text>
        </Pressable>

        {lines.map((l) => {
          const isSelected = selectedLineId === l.id;
          return (
            <Pressable
              key={l.id}
              onPress={() => setSelectedLineId(l.id)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: isSelected ? l.color : theme.card,
                  borderColor: l.color,
                },
              ]}>
              <Text
                style={[
                  styles.filterChipText,
                  {
                    color: isSelected ? '#FFFFFF' : theme.text,
                    fontWeight: isSelected ? '700' : '500',
                  },
                ]}>
                {l.name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Station Search & Proximity Sort */}
      <View style={styles.searchAndSortRow}>
        <Input
          placeholder="Buscar estação (ex: Recife, Joana Bezerra)..."
          value={search}
          onChangeText={setSearch}
          containerStyle={styles.searchContainer}
        />
        <Pressable
          onPress={handleToggleSortDistance}
          disabled={isLocating}
          style={({ pressed }) => [
            styles.sortDistanceBtn,
            {
              backgroundColor:
                sortByDistance && coords ? theme.primary : theme.card,
              borderColor:
                sortByDistance && coords ? theme.primary : theme.border,
              opacity: pressed || isLocating ? 0.7 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Ordenar estações por distância"
        >
          <Navigation
            size={14}
            color={
              sortByDistance && coords
                ? theme.primaryForeground
                : theme.primary
            }
          />
          <Text
            style={[
              styles.sortDistanceText,
              {
                color:
                  sortByDistance && coords
                    ? theme.primaryForeground
                    : theme.text,
                fontWeight: sortByDistance && coords ? '700' : '500',
              },
            ]}
          >
            {isLocating
              ? 'GPS...'
              : sortByDistance && coords
                ? 'Mais próximas'
                : 'Perto de mim'}
          </Text>
        </Pressable>
      </View>

      {/* Stations List */}
      {loadingStations || loadingLines ? (
        <View style={styles.loadingStack}>
          <Skeleton height={56} borderRadius={Radius.medium} />
          <Skeleton height={56} borderRadius={Radius.medium} />
          <Skeleton height={56} borderRadius={Radius.medium} />
        </View>
      ) : linesError || stationsError ? (
        <ErrorState onRetry={handleRefresh} />
      ) : displayedStations.length === 0 ? (
        <EmptyState
          title="Nenhuma estação encontrada"
          description="Tente outro termo de busca ou selecione outra linha."
        />
      ) : (
        <View style={styles.stationsList}>
          {displayedStations.map((station, index) => {
            const dist = coords
              ? calculateDistanceMeters(
                  coords.latitude,
                  coords.longitude,
                  station.latitude,
                  station.longitude,
                )
              : null;
            const formattedDist =
              dist !== null && isFinite(dist) ? formatDistance(dist) : null;

            return (
              <React.Fragment key={station.id}>
                <Pressable
                  onPress={() => router.push(`/station/${station.id}`)}
                  style={({ pressed }) => [
                    styles.stationCard,
                    {
                      backgroundColor: theme.card,
                      borderColor: theme.border,
                      opacity: pressed ? 0.8 : 1,
                    },
                    Shadows.card,
                  ]}
                >
                  <View style={styles.stationMain}>
                    <MapPin size={18} color={theme.primary} />
                    <View>
                      <View style={styles.stationNameRow}>
                        <Text style={[styles.stationName, { color: theme.text }]}>
                          {station.name}
                        </Text>
                        {formattedDist && (
                          <Text
                            style={[
                              styles.stationDistanceBadge,
                              { color: theme.primary },
                            ]}
                          >
                            {`• ${formattedDist}`}
                          </Text>
                        )}
                      </View>
                      {station.code && (
                        <Text
                          style={[
                            styles.stationCode,
                            { color: theme.mutedForeground },
                          ]}
                        >
                          {station.code}
                        </Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.linesBadges}>
                    {station.lines?.map((l, lIdx) => (
                      <View
                        key={`${station.id}-${l.id}-${lIdx}`}
                        style={[styles.linePill, { backgroundColor: l.color }]}
                      >
                        <Text style={styles.linePillText}>
                          {l.code.split('-')[0]}
                        </Text>
                      </View>
                    ))}
                    <Text style={[styles.arrow, { color: theme.mutedForeground }]}>
                      ›
                    </Text>
                  </View>
                </Pressable>

                {index === 3 && (
                  <AdBanner
                    placement="explore_list"
                    style={styles.inlineAdBanner}
                  />
                )}
              </React.Fragment>
            );
          })}
          {displayedStations.length > 0 && displayedStations.length < 4 && (
            <AdBanner
              placement="explore_list"
              style={styles.inlineAdBanner}
            />
          )}
        </View>
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontSize: Typography.heading.fontSize,
    fontWeight: Typography.heading.fontWeight,
  },
  subheading: {
    fontSize: Typography.body.fontSize,
    marginTop: Spacing.half,
    marginBottom: Spacing.three,
  },
  filterSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  filterChip: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two + 2,
  },
  filterChipText: {
    fontSize: Typography.caption.fontSize,
  },
  searchAndSortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  searchContainer: {
    flex: 1,
    marginBottom: 0,
  },
  sortDistanceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: Spacing.two + 2,
    borderRadius: Radius.medium,
    borderWidth: 1,
  },
  sortDistanceText: {
    fontSize: Typography.caption.fontSize,
  },
  stationsList: {
    gap: Spacing.two,
  },
  stationCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Radius.medium,
    borderWidth: 1,
  },
  stationMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  stationNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  stationDistanceBadge: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '600',
  },
  pinIcon: {
    fontSize: 18,
  },
  stationName: {
    fontSize: Typography.bodyBold.fontSize,
    fontWeight: Typography.bodyBold.fontWeight,
  },
  stationCode: {
    fontSize: Typography.small.fontSize,
  },
  linesBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  linePill: {
    paddingVertical: 2,
    paddingHorizontal: Spacing.one + 2,
    borderRadius: Radius.small,
  },
  linePillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  arrow: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: Spacing.one,
  },
  loadingStack: {
    gap: Spacing.two,
  },
  inlineAdBanner: {
    marginVertical: Spacing.two,
  },
});
