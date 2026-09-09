import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import {
  MapPin,
  Check,
  Search,
  X,
  ArrowLeftRight,
  Sparkles,
} from 'lucide-react-native';
import { StationDto } from '@/api/types';
import {
  Coordinates,
  calculateDistanceMeters,
  formatDistance,
  findNearestStation,
} from '@/lib/location';
import { Radius, Spacing, Typography, isDarkColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Input } from '@/components/ui/input';

export interface StationSelectorProps {
  stations: StationDto[];
  value?: number | null;
  onChange: (stationId: number) => void;
  error?: string;
  onLocateNearest?: () => void;
  isLocating?: boolean;
  userLocation?: Coordinates | null;
  lineColor?: string;
}

export function StationSelector({
  stations,
  value,
  onChange,
  error,
  onLocateNearest,
  isLocating,
  userLocation,
  lineColor,
}: StationSelectorProps) {
  const theme = useTheme();
  const isDark = isDarkColors(theme);
  const activeColor = lineColor || theme.primary;

  const [search, setSearch] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Find currently selected station
  const selectedStation = useMemo(() => {
    return stations.find((s) => s.id === value) || null;
  }, [stations, value]);

  // Find nearest station from user's location
  const nearestStation = useMemo(() => {
    if (!userLocation || stations.length === 0) return null;
    return findNearestStation(userLocation, stations);
  }, [userLocation, stations]);

  // Filter stations by search term
  const filteredStations = useMemo(() => {
    if (!search.trim()) return stations;
    const q = search.toLowerCase().trim();
    return stations.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.code && s.code.toLowerCase().includes(q)),
    );
  }, [stations, search]);

  const handleSelectStation = (stationId: number) => {
    onChange(stationId);
    setIsEditing(false);
    setSearch('');
  };

  // 1. If a station is selected and user is NOT searching/editing
  if (selectedStation && !isEditing) {
    const selectedDistance = userLocation
      ? calculateDistanceMeters(
          userLocation.latitude,
          userLocation.longitude,
          selectedStation.latitude,
          selectedStation.longitude,
        )
      : null;
    const formatted =
      selectedDistance !== null && isFinite(selectedDistance)
        ? formatDistance(selectedDistance)
        : null;

    return (
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => setIsEditing(true)}
            accessibilityRole="button"
            accessibilityLabel="Trocar estação"
            style={({ pressed }) => [
              styles.changeButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <ArrowLeftRight size={13} color={activeColor} />
            <Text style={[styles.changeText, { color: activeColor }]}>
              Trocar estação
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => setIsEditing(true)}
          accessibilityRole="button"
          accessibilityLabel={`Estação selecionada: ${selectedStation.name}. Toque para alterar.`}
          style={({ pressed }) => [
            styles.selectedStationCard,
            {
              backgroundColor: theme.card,
              borderColor: error ? theme.destructive : activeColor,
              borderWidth: 1.5,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <View
            style={[
              styles.stationIconContainer,
              { backgroundColor: activeColor + (isDark ? '25' : '15') },
            ]}
          >
            <MapPin size={20} color={activeColor} strokeWidth={2.5} />
          </View>

          <View style={styles.selectedStationInfo}>
            <Text style={[styles.selectedStationName, { color: theme.text }]}>
              {selectedStation.name}
            </Text>

            <View style={styles.metaRow}>
              {formatted && (
                <View
                  style={[
                    styles.distanceChip,
                    { backgroundColor: theme.backgroundElement },
                  ]}
                >
                  <Text
                    style={[
                      styles.distanceChipText,
                      { color: theme.mutedForeground },
                    ]}
                  >
                    📍 a {formatted}
                  </Text>
                </View>
              )}

              {selectedStation.lines && selectedStation.lines.length > 0 && (
                <View style={styles.lineBadgesRow}>
                  {selectedStation.lines.map((l, index) => (
                    <View
                      key={`${selectedStation.id}-${l.id}-${index}`}
                      style={[styles.lineBadge, { backgroundColor: l.color }]}
                    >
                      <Text style={styles.lineBadgeText}>
                        {l.code.split('-')[0]}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>

          <View
            style={[
              styles.selectedCheckBadge,
              { backgroundColor: activeColor },
            ]}
          >
            <Check size={14} color="#FFFFFF" strokeWidth={3} />
          </View>
        </Pressable>

        {error && (
          <Text style={[styles.error, { color: theme.destructive }]}>
            {error}
          </Text>
        )}
      </View>
    );
  }

  // 2. Station Search / Picker State
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        {onLocateNearest && (
          <Pressable
            onPress={onLocateNearest}
            disabled={isLocating}
            accessibilityRole="button"
            accessibilityLabel="Detectar estação mais próxima por GPS"
            style={({ pressed }) => [
              styles.locateButton,
              {
                backgroundColor: activeColor + (isDark ? '25' : '15'),
                borderColor: activeColor,
                opacity: pressed || isLocating ? 0.7 : 1,
              },
            ]}
          >
            {isLocating ? (
              <ActivityIndicator size="small" color={activeColor} />
            ) : (
              <MapPin size={13} color={activeColor} />
            )}
            <Text style={[styles.locateText, { color: activeColor }]}>
              {isLocating ? 'Buscando...' : 'Mais próxima'}
            </Text>
          </Pressable>
        )}
      </View>

      {/* Suggested Station Pill if available and not selected */}
      {nearestStation && nearestStation.station.id !== value && (
        <Pressable
          onPress={() => handleSelectStation(nearestStation.station.id)}
          accessibilityRole="button"
          accessibilityLabel={`Estação sugerida: ${nearestStation.station.name}`}
          style={({ pressed }) => [
            styles.suggestionCard,
            {
              backgroundColor: activeColor + (isDark ? '20' : '10'),
              borderColor: activeColor,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <View style={styles.suggestionLeft}>
            <Sparkles size={16} color={activeColor} />
            <View>
              <Text style={[styles.suggestionTitle, { color: activeColor }]}>
                Sugerida para você
              </Text>
              <Text
                style={[styles.suggestionStationName, { color: theme.text }]}
              >
                {nearestStation.station.name} •{' '}
                {nearestStation.formattedDistance}
              </Text>
            </View>
          </View>
          <View style={[styles.selectPill, { backgroundColor: activeColor }]}>
            <Text style={styles.selectPillText}>Selecionar</Text>
          </View>
        </Pressable>
      )}

      {/* Search Bar */}
      <View style={styles.searchWrapper}>
        <Input
          placeholder="Buscar por nome da estação..."
          value={search}
          onChangeText={setSearch}
          leftIcon={<Search size={16} color={theme.mutedForeground} />}
          rightIcon={
            search.length > 0 ? (
              <Pressable onPress={() => setSearch('')}>
                <X size={16} color={theme.mutedForeground} />
              </Pressable>
            ) : undefined
          }
          containerStyle={styles.searchInput}
        />
      </View>

      {/* Station List */}
      <ScrollView
        style={[
          styles.scrollList,
          {
            backgroundColor: theme.card,
            borderColor: error ? theme.destructive : theme.border,
          },
        ]}
        nestedScrollEnabled
        showsVerticalScrollIndicator
      >
        {filteredStations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.mutedForeground }]}>
              Nenhuma estação encontrada para &quot;{search}&quot;
            </Text>
          </View>
        ) : (
          filteredStations.map((station, index) => {
            const isSelected = station.id === value;
            const dist = userLocation
              ? calculateDistanceMeters(
                  userLocation.latitude,
                  userLocation.longitude,
                  station.latitude,
                  station.longitude,
                )
              : null;
            const formattedDist =
              dist !== null && isFinite(dist) ? formatDistance(dist) : null;
            const isLast = index === filteredStations.length - 1;

            return (
              <Pressable
                key={station.id}
                onPress={() => handleSelectStation(station.id)}
                accessibilityRole="radio"
                accessibilityLabel={`${station.name}${formattedDist ? `, a ${formattedDist}` : ''}`}
                accessibilityState={{ selected: isSelected }}
                style={({ pressed }) => [
                  styles.stationItem,
                  {
                    backgroundColor: isSelected
                      ? activeColor + (isDark ? '25' : '15')
                      : 'transparent',
                    borderBottomColor: theme.border,
                    borderBottomWidth: isLast ? 0 : 1,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <View style={styles.stationItemLeft}>
                  <View
                    style={[
                      styles.stationPinIcon,
                      {
                        backgroundColor: isSelected
                          ? activeColor
                          : isDark
                            ? '#27272A'
                            : '#F1F5F9',
                      },
                    ]}
                  >
                    <MapPin
                      size={14}
                      color={isSelected ? '#FFFFFF' : theme.mutedForeground}
                    />
                  </View>

                  <View style={styles.stationNameCol}>
                    <Text
                      style={[
                        styles.stationName,
                        {
                          color: isSelected
                            ? isDark
                              ? '#FFFFFF'
                              : activeColor
                            : theme.text,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {station.name}
                    </Text>

                    <View style={styles.metaRow}>
                      {formattedDist && (
                        <Text
                          style={[
                            styles.distanceText,
                            { color: theme.mutedForeground },
                          ]}
                        >
                          a {formattedDist}
                        </Text>
                      )}

                      {station.lines && station.lines.length > 0 && (
                        <View style={styles.lineBadgesRow}>
                          {station.lines.map((l, lIdx) => (
                            <View
                              key={`${station.id}-${l.id}-${lIdx}`}
                              style={[
                                styles.lineBadge,
                                { backgroundColor: l.color },
                              ]}
                            >
                              <Text style={styles.lineBadgeText}>
                                {l.code.split('-')[0]}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                {isSelected ? (
                  <View
                    style={[
                      styles.checkBadge,
                      { backgroundColor: activeColor },
                    ]}
                  >
                    <Check size={11} color="#FFFFFF" strokeWidth={3} />
                  </View>
                ) : (
                  <View
                    style={[styles.radioCircle, { borderColor: theme.border }]}
                  />
                )}
              </Pressable>
            );
          })
        )}
      </ScrollView>

      {/* Cancel search if previously had station selected */}
      {selectedStation && isEditing && (
        <Pressable
          onPress={() => {
            setIsEditing(false);
            setSearch('');
          }}
          style={({ pressed }) => [
            styles.cancelEditBtn,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Text
            style={[styles.cancelEditText, { color: theme.mutedForeground }]}
          >
            Manter estação selecionada ({selectedStation.name})
          </Text>
        </Pressable>
      )}

      {error && (
        <Text style={[styles.error, { color: theme.destructive }]}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.two,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.one,
  },
  changeText: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '700',
  },
  selectedStationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Radius.medium,
    gap: Spacing.two + 2,
  },
  stationIconContainer: {
    width: 42,
    height: 42,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedStationInfo: {
    flex: 1,
  },
  selectedStationName: {
    fontSize: Typography.bodyBold.fontSize + 1,
    fontWeight: '700',
    lineHeight: 22,
    marginTop: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
    marginTop: 4,
  },
  distanceChip: {
    paddingVertical: 2,
    paddingHorizontal: Spacing.one,
    borderRadius: Radius.small,
  },
  distanceChipText: {
    fontSize: Typography.small.fontSize,
    fontWeight: '500',
  },
  selectedCheckBadge: {
    width: 24,
    height: 24,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  locateText: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '700',
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.two + 2,
    borderRadius: Radius.medium,
    borderWidth: 1,
    marginBottom: Spacing.two,
  },
  suggestionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flex: 1,
  },
  suggestionTitle: {
    fontSize: Typography.small.fontSize,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  suggestionStationName: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '600',
    marginTop: 1,
  },
  selectPill: {
    paddingVertical: Spacing.half + 2,
    paddingHorizontal: Spacing.two + 2,
    borderRadius: Radius.full,
  },
  selectPillText: {
    color: '#FFFFFF',
    fontSize: Typography.small.fontSize,
    fontWeight: '700',
  },
  searchWrapper: {
    marginBottom: Spacing.one,
  },
  searchInput: {
    marginBottom: 0,
  },
  scrollList: {
    maxHeight: 200,
    borderWidth: 1,
    borderRadius: Radius.medium,
  },
  emptyContainer: {
    padding: Spacing.four,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Typography.caption.fontSize,
    textAlign: 'center',
  },
  stationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.two + 2,
    paddingHorizontal: Spacing.three,
  },
  stationItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flex: 1,
  },
  stationPinIcon: {
    width: 28,
    height: 28,
    borderRadius: Radius.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stationNameCol: {
    flex: 1,
  },
  stationName: {
    fontSize: Typography.body.fontSize,
  },
  distanceText: {
    fontSize: Typography.small.fontSize,
  },
  lineBadgesRow: {
    flexDirection: 'row',
    gap: 4,
  },
  lineBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lineBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  checkBadge: {
    width: 20,
    height: 20,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: Radius.full,
    borderWidth: 1.5,
  },
  cancelEditBtn: {
    paddingVertical: Spacing.one,
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  cancelEditText: {
    fontSize: Typography.caption.fontSize,
    textDecorationLine: 'underline',
  },
  error: {
    fontSize: Typography.small.fontSize,
    marginTop: Spacing.one,
    fontWeight: '500',
  },
});
