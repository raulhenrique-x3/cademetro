import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ShieldAlert,
  TrainFront,
  Monitor,
  Sun,
  Moon,
  Trash2,
  Shield,
} from 'lucide-react-native';
import { ScreenShell } from '@/components/layout/screen-shell';
import { useAuth } from '@/features/auth/auth-context';
import { useAppTheme, ThemeMode } from '@/context/theme-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AuthForm } from '@/features/auth/components/auth-form';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { AdBanner } from '@/features/ads';

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, isAuthenticated, logout, deleteAccount } = useAuth();
  const { themeMode, setThemeMode, colorScheme } = useAppTheme();
  const [isDeleting, setIsDeleting] = useState(false);

  const isModerator = user?.role === 'MODERATOR' || user?.role === 'ADMIN';

  const confirmDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      await deleteAccount();
      Alert.alert(
        'Conta excluída',
        'Sua conta e seus dados foram excluídos com sucesso.',
      );
    } catch (err: any) {
      Alert.alert(
        'Erro ao excluir conta',
        err?.message || 'Não foi possível excluir a conta. Tente novamente mais tarde.',
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Excluir Conta Permanentemente',
      'Tem certeza de que deseja excluir sua conta? Todos os seus dados, pontuação e histórico serão apagados permanentemente de acordo com as normas da LGPD. Esta ação não poderá ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir definitivamente',
          style: 'destructive',
          onPress: confirmDeleteAccount,
        },
      ],
    );
  };

  return (
    <ScreenShell>
      <Text style={[styles.title, { color: theme.text }]}>Meu Perfil</Text>

      {isAuthenticated && user ? (
        /* Authenticated profile card */
        <View
          style={[
            styles.card,
            { backgroundColor: theme.card, borderColor: theme.border },
            Shadows.card,
          ]}
        >
          <View style={styles.userHeader}>
            <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
              <Text style={styles.avatarText}>
                {user.name?.[0]?.toUpperCase() ||
                  user.username?.[0]?.toUpperCase() ||
                  'U'}
              </Text>
            </View>

            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: theme.text }]}>
                {user.name || user.username || 'Colaborador CadêMetrô'}
              </Text>
              <Text
                style={[styles.userEmail, { color: theme.mutedForeground }]}
              >
                {user.email}
              </Text>
              {user.username && user.name && (
                <Text
                  style={[styles.userHandle, { color: theme.textSecondary }]}
                >
                  @{user.username}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text
                style={[styles.metaLabel, { color: theme.mutedForeground }]}
              >
                Função
              </Text>
              <Badge
                variant={isModerator ? 'destructive' : 'default'}
                style={styles.roleBadge}
              >
                {user.role}
              </Badge>
            </View>

            <View style={styles.metaItem}>
              <Text
                style={[styles.metaLabel, { color: theme.mutedForeground }]}
              >
                Índice de Confiança
              </Text>
              <Text style={[styles.trustValue, { color: theme.primary }]}>
                {(user.trustScore * 100).toFixed(0)}%
              </Text>
            </View>
          </View>

          {isModerator && (
            <View style={styles.moderatorSection}>
              <Button
                variant="outline"
                size="md"
                icon={<ShieldAlert size={16} color={theme.text} />}
                onPress={() => router.push('/admin/reports')}
                style={styles.adminButton}
              >
                Painel de Moderação
              </Button>
              {user.role === 'ADMIN' && (
                <Button
                  variant="outline"
                  size="md"
                  icon={<TrainFront size={16} color={theme.text} />}
                  onPress={() => router.push('/admin/lines')}
                  style={styles.adminButton}
                >
                  Cadastrar Linhas
                </Button>
              )}
            </View>
          )}

          <Separator />

          <Button
            variant="outline"
            size="md"
            onPress={logout}
            style={styles.logoutBtn}
          >
            Sair da conta
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onPress={handleDeleteAccount}
            loading={isDeleting}
            icon={<Trash2 size={15} color={theme.destructive} />}
            style={styles.deleteBtn}
          >
            <Text style={[styles.deleteBtnText, { color: theme.destructive }]}>
              Excluir minha conta
            </Text>
          </Button>
        </View>
      ) : (
        /* Guest auth form */
        <AuthForm initialMode="login" />
      )}

      {/* Theme Settings Card */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
            marginTop: Spacing.three,
          },
          Shadows.card,
        ]}
      >
        <Text style={[styles.cardHeading, { color: theme.text }]}>
          Aparência
        </Text>
        <Text style={[styles.cardSubheading, { color: theme.mutedForeground }]}>
          Escolha o tema de exibição da interface. Tema ativo:{' '}
          {colorScheme === 'dark' ? 'Escuro' : 'Claro'}.
        </Text>

        <View style={styles.themeOptionsRow}>
          {(['system', 'light', 'dark'] as ThemeMode[]).map((mode) => {
            const isSelected = themeMode === mode;
            const label =
              mode === 'system'
                ? 'Sistema'
                : mode === 'light'
                  ? 'Claro'
                  : 'Escuro';
            const iconColor = isSelected ? theme.primaryForeground : theme.text;

            return (
              <Pressable
                key={mode}
                onPress={() => setThemeMode(mode)}
                style={({ pressed }) => [
                  styles.themeOptionBtn,
                  {
                    backgroundColor: isSelected
                      ? theme.primary
                      : theme.backgroundElement,
                    borderColor: isSelected ? theme.primary : theme.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                {mode === 'system' ? (
                  <Monitor size={15} color={iconColor} />
                ) : mode === 'light' ? (
                  <Sun size={15} color={iconColor} />
                ) : (
                  <Moon size={15} color={iconColor} />
                )}
                <Text
                  style={[
                    styles.themeOptionText,
                    {
                      color: isSelected ? theme.primaryForeground : theme.text,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* AdMob Banner Nativo */}
      <AdBanner placement="profile_bottom" style={styles.adBanner} />

      {/* App Info Card */}
      <View style={styles.appInfo}>
        <Pressable
          onPress={() => router.push('/privacy')}
          style={styles.privacyLink}
          accessibilityRole="link"
          accessibilityLabel="Política de Privacidade e Exclusão de Dados"
        >
          <Shield size={14} color={theme.primary} />
          <Text style={[styles.privacyLinkText, { color: theme.primary }]}>
            Política de Privacidade e Exclusão de Dados
          </Text>
        </Pressable>

        <Text style={[styles.appVersion, { color: theme.mutedForeground }]}>
          CadêMetrô • Versão 1.0.0 (MVP)
        </Text>
        <Text style={[styles.appDisclaimer, { color: theme.mutedForeground }]}>
          Projeto colaborativo da comunidade de transporte metropolitano de
          Recife.
        </Text>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: Typography.heading.fontSize,
    fontWeight: '800',
    marginBottom: Spacing.three,
  },
  card: {
    borderRadius: Radius.large,
    borderWidth: 1,
    padding: Spacing.four,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginBottom: Spacing.three,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: Typography.subheading.fontSize,
    fontWeight: '700',
  },
  userEmail: {
    fontSize: Typography.caption.fontSize,
    marginTop: 2,
  },
  userHandle: {
    fontSize: Typography.small.fontSize,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.two,
    marginBottom: Spacing.two,
  },
  metaItem: {
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: Typography.small.fontSize,
    marginBottom: Spacing.half,
  },
  roleBadge: {
    marginTop: 2,
  },
  trustValue: {
    fontSize: Typography.subheading.fontSize,
    fontWeight: '800',
  },
  moderatorSection: {
    marginVertical: Spacing.two,
    gap: Spacing.two,
  },
  adminButton: {
    width: '100%',
  },
  logoutBtn: {
    marginTop: Spacing.two,
  },
  guestTitle: {
    fontSize: Typography.subheading.fontSize,
    fontWeight: '700',
  },
  guestText: {
    fontSize: Typography.body.fontSize,
    marginTop: Spacing.one,
    marginBottom: Spacing.three,
  },
  guestButtons: {
    gap: Spacing.two,
  },
  cardHeading: {
    fontSize: Typography.subheading.fontSize,
    fontWeight: '700',
  },
  cardSubheading: {
    fontSize: Typography.caption.fontSize,
    marginTop: Spacing.half,
    marginBottom: Spacing.three,
  },
  themeOptionsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  themeOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.one,
    borderRadius: Radius.medium,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeOptionText: {
    fontSize: Typography.caption.fontSize,
  },
  appInfo: {
    alignItems: 'center',
    marginVertical: Spacing.five,
    gap: Spacing.half,
  },
  appVersion: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '600',
  },
  appDisclaimer: {
    fontSize: Typography.small.fontSize,
    textAlign: 'center',
  },
  deleteBtn: {
    marginTop: Spacing.two,
    alignSelf: 'center',
  },
  deleteBtnText: {
    fontSize: Typography.caption.fontSize,
  },
  privacyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    marginBottom: Spacing.one,
  },
  privacyLinkText: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  adBanner: {
    marginTop: Spacing.three,
  },
});
