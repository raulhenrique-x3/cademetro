import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '@/features/auth/auth-context';
import { parseGoogleOAuthError } from '@/api/auth';
import { useToast } from '@/context/toast-context';
import { useTheme } from '@/hooks/use-theme';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/error-state';

// Complete auth session if opened in a web popup / browser tab
WebBrowser.maybeCompleteAuthSession();

export default function AuthCallbackScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { loginWithTokens } = useAuth();
  const { showSuccess, showError } = useToast();
  const params = useLocalSearchParams<{
    accessToken?: string;
    refreshToken?: string;
    error?: string;
  }>();

  const { accessToken, refreshToken, error } = params;
  const isCancel = !!error && error.toLowerCase().includes('access_denied');
  const initialError = error && !isCancel ? parseGoogleOAuthError(error) : null;

  const [status, setStatus] = useState<'loading' | 'error' | 'success'>(
    initialError ? 'error' : 'loading',
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(initialError);
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    if (error) {
      if (isCancel) {
        router.replace('/login');
        return;
      }
      const friendlyError = parseGoogleOAuthError(error);
      showError(new Error(friendlyError));
      return;
    }

    if (accessToken && refreshToken) {
      loginWithTokens({ accessToken, refreshToken })
        .then(() => {
          setStatus('success');
          showSuccess('Login com Google realizado com sucesso!');
          router.replace('/');
        })
        .catch((err) => {
          const message = parseGoogleOAuthError(err?.message || 'Falha ao sincronizar conta.');
          setStatus('error');
          setErrorMessage(message);
          showError(err);
        });
      return;
    }

    // No tokens or error provided, redirect back to login
    router.replace('/login');
  }, [accessToken, refreshToken, error, loginWithTokens, router, showSuccess, showError]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {status === 'loading' && (
          <View style={styles.stateWrapper}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.title, { color: theme.text }]}>
              Conectando com o Google...
            </Text>
            <Text style={[styles.subtitle, { color: theme.mutedForeground }]}>
              Aguarde enquanto autenticamos sua conta no CadêMetrô.
            </Text>
          </View>
        )}

        {status === 'error' && (
          <View style={styles.stateWrapper}>
            <ErrorState
              title="Falha no login com Google"
              message={errorMessage || 'Não foi possível concluir o login.'}
            />
            <Button
              variant="primary"
              size="md"
              onPress={() => router.replace('/login')}
              style={styles.actionBtn}>
              Voltar para o Login
            </Button>
          </View>
        )}

        {status === 'success' && (
          <View style={styles.stateWrapper}>
            <ActivityIndicator size="small" color={theme.primary} />
            <Text style={[styles.title, { color: theme.text }]}>
              Autenticado com sucesso!
            </Text>
            <Text style={[styles.subtitle, { color: theme.mutedForeground }]}>
              Redirecionando...
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.four,
    alignItems: 'center',
  },
  stateWrapper: {
    width: '100%',
    alignItems: 'center',
    gap: Spacing.two,
  },
  title: {
    fontSize: Typography.heading.fontSize,
    fontWeight: '700',
    marginTop: Spacing.two,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.body.fontSize,
    textAlign: 'center',
    marginBottom: Spacing.two,
  },
  actionBtn: {
    marginTop: Spacing.two,
    width: '100%',
  },
});
