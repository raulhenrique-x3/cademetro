import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenShell } from '@/components/layout/screen-shell';
import { AuthForm } from '@/features/auth/components/auth-form';
import { Spacing } from '@/constants/theme';

export default function LoginScreen() {
  const router = useRouter();

  return (
    <ScreenShell showBack showBottomNav={false}>
      <View style={styles.centerContainer}>
        <AuthForm initialMode="login" onSuccess={() => router.replace('/')} />
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    paddingVertical: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
