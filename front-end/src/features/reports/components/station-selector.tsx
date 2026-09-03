import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { MapPin, Check } from 'lucide-react-native';
import { StationDto } from '@/api/types';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Input } from '@/components/ui/input';

export interface StationSelectorProps {
  stations: StationDto[];
  value?: number | null;
  onChange: (stationId: number) => void;
  error?: string;
  onLocateNearest?: () => void;
  isLocating?: boolean;
}

export function StationSelector({
  stations,
  value,
  onChange,
  error,
  onLocateNearest,
  isLocating,
}: StationSelectorProps) {
  const theme = useTheme();
  const [search, setSearch] = useState('');

  // Find currently selected station
  const selectedStation = useMemo(() => {
    return stations.find((s) => s.id === value) || null;
  }, [stations, value]);

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

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.text }]}>Onde você está?</Text>
        {onLocateNearest && (
          <Pressable
            onPress={onLocateNearest}
            disabled={isLocating}
            style={({ pressed }) => [
              styles.locateButton,
              { opacity: pressed || isLocating ? 0.7 : 1 },
            ]}>
            <MapPin size={13} color={theme.primary} />
            <Text style={[styles.locateText, { color: theme.primary }]}>
              {isLocating ? 'Buscando...' : 'Estação mais próxima'}
            </Text>
          </Pressable>
        )}
      </View>

      {/* Selected station highlight chip */}
      {selectedStation && (
        <View
          style={[
            styles.selectedChip,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.primary,
            },
          ]}>
          <MapPin size={16} color={theme.primary} />
          <Text style={[styles.selectedStationName, { color: theme.text }]}>
            {selectedStation.name}
          </Text>
          <Check size={14} color={theme.primary} />
          <Text style={[styles.checkIcon, { color: theme.primary }]}>Selecionada</Text>
        </View>
      )}

      {/* Search Input */}
      <Input
        placeholder="Buscar estação..."
        value={search}
        onChangeText={setSearch}
        containerStyle={styles.searchInput}
      />

      {/* Station List */}
      <ScrollView
        style={[
          styles.scrollList,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
          },
        ]}
        nestedScrollEnabled>
        {filteredStations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.mutedForeground }]}>
              Nenhuma estação encontrada
            </Text>
          </View>
        ) : (
          filteredStations.map((station) => {
            const isSelected = station.id === value;
            return (
              <Pressable
                key={station.id}
                onPress={() => onChange(station.id)}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                style={({ pressed }) => [
                  styles.stationItem,
                  {
                    backgroundColor: isSelected
                      ? theme.backgroundSelected
                      : 'transparent',
                    borderBottomColor: theme.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}>
                <View style={styles.stationInfo}>
                  <Text
                    style={[
                      styles.stationName,
                      {
                        color: theme.text,
                        fontWeight: isSelected ? '700' : '500',
                      },
                    ]}>
                    {station.name}
                  </Text>
                  {station.lines && station.lines.length > 0 && (
                    <View style={styles.lineBadgesRow}>
                      {station.lines.map((l) => (
                        <View
                          key={l.id}
                          style={[styles.lineDot, { backgroundColor: l.color }]}>
                          <Text style={styles.lineDotText}>{l.code.split('-')[0]}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
                {isSelected && (
                  <Text style={[styles.selectedIndicator, { color: theme.primary }]}>
                    ●
                  </Text>
                )}
              </Pressable>
            );
          })
        )}
      </ScrollView>

      {error && <Text style={[styles.error, { color: theme.destructive }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.two,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.one,
  },
  title: {
    fontSize: Typography.bodyBold.fontSize,
    fontWeight: Typography.bodyBold.fontWeight,
  },
  locateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.half,
  },
  locateText: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '600',
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.medium,
    borderWidth: 1.5,
    marginBottom: Spacing.two,
    gap: Spacing.two,
  },
  pinIcon: {
    fontSize: 16,
  },
  selectedStationName: {
    fontSize: Typography.bodyBold.fontSize,
    fontWeight: Typography.bodyBold.fontWeight,
    flex: 1,
  },
  checkIcon: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '700',
  },
  searchInput: {
    marginBottom: Spacing.two,
  },
  scrollList: {
    maxHeight: 180,
    borderWidth: 1,
    borderRadius: Radius.medium,
  },
  emptyContainer: {
    padding: Spacing.three,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Typography.caption.fontSize,
  },
  stationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderBottomWidth: 1,
  },
  stationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  stationName: {
    fontSize: Typography.body.fontSize,
  },
  lineBadgesRow: {
    flexDirection: 'row',
    gap: 4,
  },
  lineDot: {
    width: 18,
    height: 18,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lineDotText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  selectedIndicator: {
    fontSize: 14,
    fontWeight: '700',
  },
  error: {
    fontSize: Typography.small.fontSize,
    marginTop: Spacing.one,
  },
});
