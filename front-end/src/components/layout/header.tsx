import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { TrainFront, ArrowLeft } from 'lucide-react-native';
import { Spacing, Typography, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/features/auth/auth-context';
import { useRealtime } from '@/hooks/use-realtime';

export interface HeaderProps {
  title?: string;
  showBack?: boolean;
}

export function Header({ title, showBack = false }: HeaderProps) {
  const theme = useTheme();
  const { user, isAuthenticated } = useAuth();
  const { isConnected } = useRealtime();
  const router = useRouter();
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isConnected) {
      pulse.setValue(1);
      return;
    }
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.25,
          duration: 600,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 600,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]),
    );
    animation.start();
    return () => {
      animation.stop();
      pulse.setValue(1);
    };
  }, [isConnected, pulse]);

  return (
    <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
      <View style={styles.left}>
        {showBack ? (
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.7 : 1 }]}>
            <ArrowLeft size={16} color={theme.text} />
            <Text style={[styles.backText, { color: theme.text }]}>Voltar</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => router.push('/')}
            style={({ pressed }) => [styles.brand, { opacity: pressed ? 0.8 : 1 }]}>
            <TrainFront size={22} color={theme.primary} />
            <Text style={[styles.brandTitle, { color: theme.text }]}>
              Cadê<Text style={{ color: theme.primary }}>Metrô</Text>
            </Text>
            <Animated.View
              accessibilityLabel={isConnected ? 'Conexão ao vivo' : 'Conexão offline'}
              style={[
                styles.liveDot,
                {
                  backgroundColor: isConnected ? theme.statusNormal : theme.statusInterrupted,
                  opacity: pulse,
                },
              ]}
            />
          </Pressable>
        )}
      </View>

      {/* Right: User Avatar */}
      <View style={styles.right}>
        {isAuthenticated ? (
          <Pressable
            onPress={() => router.push('/profile')}
            style={({ pressed }) => [
              styles.userButton,
              {
                backgroundColor: theme.primary,
                opacity: pressed ? 0.8 : 1,
              },
            ]}>
            <Text style={styles.userInitial}>
              {user?.name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    minHeight: 56,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  brandIcon: {
    fontSize: 22,
  },
  brandTitle: {
    fontSize: Typography.subheading.fontSize,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.one,
    paddingRight: Spacing.two,
  },
  backText: {
    fontSize: Typography.bodyBold.fontSize,
    fontWeight: '600',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  userButton: {
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInitial: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
