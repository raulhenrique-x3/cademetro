import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TrainFront, Map, Plus, User } from 'lucide-react-native';
import {
  MaxContentWidth,
  Radius,
  Spacing,
  Typography,
} from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/features/auth/auth-context';

export function BottomNavigation() {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const insets = useSafeAreaInsets();

  const isHome = pathname === '/' || pathname === '';
  const isExplore =
    pathname.startsWith('/explore') ||
    pathname.startsWith('/line') ||
    pathname.startsWith('/station');
  const isReport = pathname.startsWith('/report');
  const isProfile =
    pathname.startsWith('/profile') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register');

  // Lift the navbar above the device system navigation bar / gesture bar / home indicator
  const bottomPadding =
    insets.bottom > 0 ? insets.bottom + Spacing.two : Spacing.three;

  return (
    <View
      style={[
        styles.outerContainer,
        {
          paddingBottom: bottomPadding,
          paddingLeft: Math.max(insets.left, Spacing.two),
          paddingRight: Math.max(insets.right, Spacing.two),
        },
      ]}
      pointerEvents="box-none"
    >
      <View
        style={[
          styles.barContainer,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          } as any,
        ]}
      >
        {/* Tab 1: Início */}
        <Pressable
          onPress={() => router.push('/')}
          accessibilityRole="button"
          accessibilityLabel="Ir para Início"
          style={({ pressed }) => [
            styles.tabItem,
            isHome && { backgroundColor: theme.backgroundSelected },
            pressed && { opacity: 0.7 },
          ]}
        >
          <TrainFront
            size={18}
            color={isHome ? theme.primary : theme.textSecondary}
          />
        </Pressable>

        {/* Tab 2: Linhas */}
        <Pressable
          onPress={() => router.push('/explore')}
          accessibilityRole="button"
          accessibilityLabel="Ir para Linhas e Estações"
          style={({ pressed }) => [
            styles.tabItem,
            isExplore && { backgroundColor: theme.backgroundSelected },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Map
            size={18}
            color={isExplore ? theme.primary : theme.textSecondary}
          />
        </Pressable>

        {/* Tab 3: Reportar (Primary Prominent Button) */}
        <Pressable
          onPress={() => router.push('/report')}
          accessibilityRole="button"
          accessibilityLabel="Reportar situação do metrô"
          style={({ pressed }) => [
            styles.reportButton,
            {
              backgroundColor: theme.primary,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Plus size={16} color={theme.primaryForeground} strokeWidth={2.5} />
        </Pressable>

        {/* Tab 4: Perfil / Entrar */}
        <Pressable
          onPress={() => router.push('/profile')}
          accessibilityRole="button"
          accessibilityLabel={
            isAuthenticated ? 'Ir para Meu Perfil' : 'Entrar na sua conta'
          }
          style={({ pressed }) => [
            styles.tabItem,
            isProfile && { backgroundColor: theme.backgroundSelected },
            pressed && { opacity: 0.7 },
          ]}
        >
          <User
            size={18}
            color={isProfile ? theme.primary : theme.textSecondary}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingVertical: Spacing.one + 2,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.full,
    borderWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.one + 2,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.full,
  },
  tabIcon: {
    fontSize: 16,
  },
  tabLabel: {
    fontSize: Typography.caption.fontSize,
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.one + 4,
    paddingHorizontal: Spacing.three + 2,
    borderRadius: Radius.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  reportIcon: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  reportLabel: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '700',
  },
});
