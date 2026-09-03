import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { Pressable, View, StyleSheet, Text } from 'react-native';
import { TrainFront, Map, Plus, User } from 'lucide-react-native';
import {
  Colors,
  MaxContentWidth,
  Radius,
  Spacing,
  Typography,
} from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function AppTabs() {
  const theme = useTheme();

  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/" asChild>
            <TabButton
              icon={<TrainFront size={18} color={theme.textSecondary} />}
            ></TabButton>
          </TabTrigger>

          <TabTrigger name="explore" href="/explore" asChild>
            <TabButton
              icon={<Map size={18} color={theme.textSecondary} />}
            ></TabButton>
          </TabTrigger>

          <TabTrigger name="report" href="/report" asChild>
            <TabButton
              icon={
                <Plus
                  size={16}
                  color={theme.primaryForeground}
                  strokeWidth={2.5}
                />
              }
              isPrimary
            ></TabButton>
          </TabTrigger>

          <TabTrigger name="profile" href="/profile" asChild>
            <TabButton
              icon={<User size={18} color={theme.textSecondary} />}
            ></TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({
  children,
  isFocused,
  icon,
  isPrimary,
  ...props
}: TabTriggerSlotProps & { icon?: React.ReactNode; isPrimary?: boolean }) {
  const theme = useTheme();

  if (isPrimary) {
    return (
      <Pressable
        {...props}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.primaryButton,
          {
            backgroundColor: theme.primary,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        {icon &&
          (typeof icon === 'string' ? (
            <Text style={styles.primaryIcon}>{icon}</Text>
          ) : (
            icon
          ))}
        <Text style={[styles.primaryText, { color: theme.primaryForeground }]}>
          {children}
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.tabButton,
        {
          backgroundColor: isFocused ? theme.backgroundSelected : 'transparent',
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      {icon &&
        (typeof icon === 'string' ? (
          <Text style={styles.tabIcon}>{icon}</Text>
        ) : (
          icon
        ))}
      <Text
        style={[
          styles.tabText,
          {
            color: isFocused ? theme.text : theme.textSecondary,
            fontWeight: isFocused ? '700' : '500',
          },
        ]}
      >
        {children}
      </Text>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  const theme = useTheme();

  return (
    <View {...props} style={styles.tabListContainer}>
      <View
        style={[
          styles.innerContainer,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
          },
        ]}
      >
        {props.children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    paddingHorizontal: Spacing.two,
    paddingBottom: Spacing.two,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerContainer: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.large,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: MaxContentWidth,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  } as any,
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.one + 2,
    paddingHorizontal: Spacing.two + 2,
    borderRadius: Radius.medium,
  },
  tabIcon: {
    fontSize: 16,
  },
  tabText: {
    fontSize: Typography.caption.fontSize,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.one + 2,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.full,
  },
  primaryIcon: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  primaryText: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '700',
  },
});
