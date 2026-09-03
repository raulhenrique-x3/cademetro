import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CircleAlert,
  CheckCircle2,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useToast, ToastItem } from '@/context/toast-context';

function ToastSingleItem({
  item,
  onDismiss,
  fromBottom = false,
}: {
  item: ToastItem;
  onDismiss: (id: string) => void;
  fromBottom?: boolean;
}) {
  const theme = useTheme();
  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [slideAnim] = useState(() => new Animated.Value(fromBottom ? 16 : -16));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(slideAnim, {
        toValue: fromBottom ? 12 : -12,
        duration: 180,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start(() => {
      onDismiss(item.id);
    });
  };

  const getStyleProps = () => {
    switch (item.type) {
      case 'error':
        return {
          icon: <CircleAlert size={20} color={theme.destructive} />,
          borderColor: theme.destructive,
          accentColor: theme.destructive,
          bgColor: theme.statusInterruptedBg || theme.card,
        };
      case 'success':
        return {
          icon: <CheckCircle2 size={20} color={theme.statusNormal} />,
          borderColor: theme.statusNormal,
          accentColor: theme.statusNormal,
          bgColor: theme.statusNormalBg || theme.card,
        };
      case 'warning':
        return {
          icon: <AlertTriangle size={20} color={theme.statusRestricted} />,
          borderColor: theme.statusRestricted,
          accentColor: theme.statusRestricted,
          bgColor: theme.statusRestrictedBg || theme.card,
        };
      case 'info':
      default:
        return {
          icon: <Info size={20} color={theme.primary} />,
          borderColor: theme.primary,
          accentColor: theme.primary,
          bgColor: theme.card,
        };
    }
  };

  const { icon, borderColor, accentColor, bgColor } = getStyleProps();

  return (
    <Animated.View
      style={[
        styles.toastWrapper,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}>
      <View
        accessibilityRole="alert"
        accessibilityLiveRegion="assertive"
        style={[
          styles.toastCard,
          {
            backgroundColor: bgColor,
            borderColor,
          },
          Shadows.card,
        ]}>
        {/* Semantic accent strip on the left border */}
        <View style={[styles.accentStrip, { backgroundColor: accentColor }]} />

        {/* Icon */}
        <View style={styles.iconContainer}>{icon}</View>

        {/* Content */}
        <View style={styles.textContainer}>
          {item.title ? (
            <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
              {item.title}
            </Text>
          ) : null}
          <Text style={[styles.message, { color: theme.textSecondary }]}>
            {item.message}
          </Text>
        </View>

        {/* Dismiss Button */}
        <Pressable
          onPress={handleClose}
          hitSlop={8}
          accessibilityLabel="Fechar aviso"
          accessibilityRole="button"
          style={styles.closeBtn}>
          <X size={16} color={theme.mutedForeground} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

export function ToastContainer() {
  const { toasts, hideToast } = useToast();
  const insets = useSafeAreaInsets();

  if (toasts.length === 0) {
    return null;
  }

  const topOffset = Math.max(insets.top, 12) + Spacing.two;
  const bottomOffset = Math.max(insets.bottom, 12) + Spacing.two;

  // Errors dock at the bottom of the screen; other types stay at the top.
  const errorToasts = toasts.filter((toastItem) => toastItem.type === 'error');
  const otherToasts = toasts.filter((toastItem) => toastItem.type !== 'error');

  const renderToasts = (items: ToastItem[], fromBottom: boolean) => (
    <View
      pointerEvents="box-none"
      style={[
        styles.container,
        fromBottom ? { bottom: bottomOffset } : { top: topOffset },
      ]}>
      {items.map((toastItem) => (
        <ToastSingleItem
          key={toastItem.id}
          item={toastItem}
          onDismiss={hideToast}
          fromBottom={fromBottom}
        />
      ))}
    </View>
  );

  return (
    <>
      {otherToasts.length > 0 ? renderToasts(otherToasts, false) : null}
      {errorToasts.length > 0 ? renderToasts(errorToasts, true) : null}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 99999,
    elevation: 99999,
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  toastWrapper: {
    width: '100%',
    maxWidth: 460,
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.medium,
    paddingVertical: Spacing.two + 2,
    paddingHorizontal: Spacing.three,
    overflow: 'hidden',
    position: 'relative',
  },
  accentStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  iconContainer: {
    marginRight: Spacing.two,
    marginLeft: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    paddingRight: Spacing.two,
  },
  title: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '700',
    marginBottom: 2,
  },
  message: {
    fontSize: Typography.caption.fontSize,
    lineHeight: 18,
    fontWeight: '500',
  },
  closeBtn: {
    padding: Spacing.one,
    marginLeft: Spacing.one,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
