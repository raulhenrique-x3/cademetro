import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Header } from './header';
import { BottomNavigation } from './bottom-navigation';

export interface ScreenShellProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
  showHeader?: boolean;
  showBottomNav?: boolean;
  scrollable?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

export function ScreenShell({
  children,
  title,
  showBack = false,
  showHeader = true,
  showBottomNav = true,
  scrollable = true,
  refreshing = false,
  onRefresh,
  style,
  contentContainerStyle,
}: ScreenShellProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  // Floating navbar clearance accounts for the bar height, the safe area (phone navbar), and spacing
  const bottomNavClearance =
    56 + (insets.bottom > 0 ? insets.bottom + Spacing.two : Spacing.three) + Spacing.four;
  const staticBottomClearance =
    56 + (insets.bottom > 0 ? insets.bottom + Spacing.two : Spacing.three) + Spacing.two;

  return (
    <SafeAreaView
      edges={showBottomNav ? ['top', 'left', 'right'] : ['top', 'left', 'right', 'bottom']}
      style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {showHeader && <Header title={title} showBack={showBack} />}

      <View style={[styles.outerContainer, { backgroundColor: theme.background }]}>
        <View style={[styles.innerContainer, style]}>
          {scrollable ? (
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={[
                styles.scrollContent,
                { paddingBottom: showBottomNav ? bottomNavClearance : Spacing.four },
                contentContainerStyle,
              ]}
              refreshControl={
                onRefresh ? (
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor={theme.primary}
                    colors={[theme.primary]}
                  />
                ) : undefined
              }
              showsVerticalScrollIndicator={false}>
              {children}
            </ScrollView>
          ) : (
            <View
              style={[
                styles.staticContent,
                { paddingBottom: showBottomNav ? staticBottomClearance : Spacing.two },
                contentContainerStyle,
              ]}>
              {children}
            </View>
          )}
        </View>
      </View>

      {showBottomNav && <BottomNavigation />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  outerContainer: {
    flex: 1,
    alignItems: 'center',
    width: '100%',
  },
  innerContainer: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  scroll: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    padding: Spacing.three,
  },
  staticContent: {
    flex: 1,
    padding: Spacing.three,
  },
});
