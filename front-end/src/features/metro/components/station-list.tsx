import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { LineStationDto } from '@/api/types';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface StationListProps {
  stations: LineStationDto[];
  lineColor: string;
  title?: string;
}

export function StationList({ stations, lineColor, title = 'Estações da Linha' }: StationListProps) {
  const theme = useTheme();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>

      <View style={styles.list}>
        {stations.map((station, index) => {
          const isFirst = index === 0;
          const isLast = index === stations.length - 1;

          return (
            <Pressable
              key={station.id}
              onPress={() => router.push(`/station/${station.id}`)}
              style={({ pressed }) => [
                styles.item,
                { opacity: pressed ? 0.7 : 1 },
              ]}>
              {/* Vertical line and dot indicator */}
              <View style={styles.trackColumn}>
                {!isFirst && <View style={[styles.trackLine, { backgroundColor: lineColor }]} />}
                <View
                  style={[
                    styles.trackDot,
                    {
                      borderColor: lineColor,
                      backgroundColor: theme.card,
                    },
                  ]}
                />
                {!isLast && <View style={[styles.trackLine, { backgroundColor: lineColor }]} />}
              </View>

              <View style={styles.stationContent}>
                <Text style={[styles.stationName, { color: theme.text }]}>
                  {station.name}
                </Text>
                {station.code && (
                  <Text style={[styles.stationCode, { color: theme.mutedForeground }]}>
                    {station.code}
                  </Text>
                )}
              </View>

              <Text style={[styles.chevron, { color: theme.mutedForeground }]}>›</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: Radius.medium,
    padding: Spacing.three,
    marginVertical: Spacing.two,
  },
  title: {
    fontSize: Typography.subheading.fontSize,
    fontWeight: '700',
    marginBottom: Spacing.two,
  },
  list: {},
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.one + 2,
  },
  trackColumn: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    position: 'relative',
  },
  trackLine: {
    position: 'absolute',
    width: 3,
    height: '100%',
  },
  trackDot: {
    width: 12,
    height: 12,
    borderRadius: Radius.full,
    borderWidth: 3,
    zIndex: 1,
  },
  stationContent: {
    flex: 1,
    marginLeft: Spacing.two,
  },
  stationName: {
    fontSize: Typography.body.fontSize,
    fontWeight: '600',
  },
  stationCode: {
    fontSize: Typography.small.fontSize,
  },
  chevron: {
    fontSize: 20,
    fontWeight: '600',
    paddingRight: Spacing.one,
  },
});
