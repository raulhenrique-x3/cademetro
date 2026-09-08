import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Keyboard } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useToast } from '@/context/toast-context';
import { useAuth } from '../auth-context';
import { loginSchema, registerSchema } from '@/api/schemas';
import { extractErrorMessage } from '@/lib/error-parser';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/error-state';
import { GoogleIcon } from '@/components/ui/google-icon';

export interface AuthFormProps {
  initialMode?: 'login' | 'register';
  onSuccess?: () => void;
}

export function AuthForm({ initialMode = 'login', onSuccess }: AuthFormProps) {
  const theme = useTheme();
  const router = useRouter();
  const { login, register, loginWithGoogle } = useAuth();
  const { showError, showSuccess } = useToast();

  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  const handleGoogleLogin = async () => {
    Keyboard.dismiss();
    setServerError(null);
    setFormErrors({});
    setIsGoogleSubmitting(true);

    try {
      const loggedUser = await loginWithGoogle();
      if (loggedUser) {
        showSuccess('Login com Google realizado com sucesso!');
        if (onSuccess) {
          onSuccess();
        } else {
          router.replace('/');
        }
      }
    } catch (err: any) {
      showError(err);
      const friendlyMessage = extractErrorMessage(err);
      setServerError(friendlyMessage || 'Falha ao autenticar com o Google. Tente novamente.');
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    setServerError(null);
    setFormErrors({});

    if (mode === 'login') {
      const validation = loginSchema.safeParse({ email, password });
      if (!validation.success) {
        const errors: Record<string, string> = {};
        for (const issue of validation.error.issues) {
          const field = issue.path[0];
          if (field) errors[String(field)] = issue.message;
        }
        setFormErrors(errors);
        return;
      }

      setIsSubmitting(true);
      try {
        await login({ email, password });
        if (onSuccess) {
          onSuccess();
        } else {
          router.replace('/');
        }
      } catch (err: any) {
        showError(err);
        const friendlyMessage = extractErrorMessage(err);
        setServerError(friendlyMessage || 'Falha ao entrar. Verifique seus dados.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      const validation = registerSchema.safeParse({ email, password, name, username });
      if (!validation.success) {
        const errors: Record<string, string> = {};
        for (const issue of validation.error.issues) {
          const field = issue.path[0];
          if (field) errors[String(field)] = issue.message;
        }
        setFormErrors(errors);
        return;
      }

      setIsSubmitting(true);
      try {
        await register({ email, password, name: name.trim() || undefined, username: username.trim() || undefined });
        if (onSuccess) {
          onSuccess();
        } else {
          router.replace('/');
        }
      } catch (err: any) {
        showError(err);
        const friendlyMessage = extractErrorMessage(err);
        setServerError(friendlyMessage || 'Falha ao criar conta. Tente outro e-mail.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.card, borderColor: theme.border }]}>
      {/* Mode Switch Tabs */}
      <View style={[styles.tabsRow, { backgroundColor: theme.backgroundElement }]}>
        <Pressable
          onPress={() => {
            setMode('login');
            setServerError(null);
            setFormErrors({});
          }}
          style={[
            styles.tab,
            mode === 'login' && {
              backgroundColor: theme.card,
              borderRadius: Radius.medium,
            },
          ]}>
          <Text
            style={[
              styles.tabText,
              {
                color: mode === 'login' ? theme.text : theme.mutedForeground,
                fontWeight: mode === 'login' ? '700' : '500',
              },
            ]}>
            Entrar
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            setMode('register');
            setServerError(null);
            setFormErrors({});
          }}
          style={[
            styles.tab,
            mode === 'register' && {
              backgroundColor: theme.card,
              borderRadius: Radius.medium,
            },
          ]}>
          <Text
            style={[
              styles.tabText,
              {
                color: mode === 'register' ? theme.text : theme.mutedForeground,
                fontWeight: mode === 'register' ? '700' : '500',
              },
            ]}>
            Criar conta
          </Text>
        </Pressable>
      </View>

      <Text style={[styles.title, { color: theme.text }]}>
        {mode === 'login' ? 'Acessar o CadêMetrô' : 'Junte-se à comunidade'}
      </Text>
      <Text style={[styles.subtitle, { color: theme.mutedForeground }]}>
        {mode === 'login'
          ? 'Informe suas credenciais para reportar e confirmar trens.'
          : 'Crie seu cadastro gratuito em poucos segundos.'}
      </Text>

      {/* Google Sign-In */}
      <Button
        variant="outline"
        size="lg"
        loading={isGoogleSubmitting}
        disabled={isSubmitting || isGoogleSubmitting}
        icon={<GoogleIcon size={18} />}
        onPress={handleGoogleLogin}
        style={styles.googleBtn}>
        {mode === 'login' ? 'Continuar com o Google' : 'Cadastrar com o Google'}
      </Button>

      {/* Divider */}
      <View style={styles.dividerRow}>
        <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
        <Text style={[styles.dividerText, { color: theme.mutedForeground }]}>
          ou continue com email
        </Text>
        <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
      </View>

      {mode === 'register' && (
        <>
          <Input
            label="Seu nome (opcional)"
            placeholder="Ex: Maria da Silva"
            value={name}
            onChangeText={setName}
            error={formErrors.name}
            autoCapitalize="words"
          />

          <Input
            label="Nome de usuário (opcional)"
            placeholder="Ex: mariasilva"
            value={username}
            onChangeText={setUsername}
            error={formErrors.username}
            autoCapitalize="none"
          />
        </>
      )}

      <Input
        label="E-mail"
        placeholder="seu.email@exemplo.com"
        value={email}
        onChangeText={setEmail}
        error={formErrors.email}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Input
        label="Senha"
        placeholder="Mínimo de 8 caracteres"
        value={password}
        onChangeText={setPassword}
        error={formErrors.password}
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        rightIcon={
          <Pressable
            onPress={() => setShowPassword((prev) => !prev)}
            hitSlop={8}
            accessibilityLabel={showPassword ? 'Ocultar senha' : 'Exibir senha'}
            role="button">
            {showPassword ? (
              <EyeOff size={20} color={theme.mutedForeground} />
            ) : (
              <Eye size={20} color={theme.mutedForeground} />
            )}
          </Pressable>
        }
      />

      {serverError && (
        <View style={styles.errorWrapper}>
          <ErrorState message={serverError} />
        </View>
      )}

      <Button
        size="lg"
        loading={isSubmitting}
        disabled={isSubmitting || isGoogleSubmitting}
        onPress={handleSubmit}
        style={styles.submitBtn}>
        {mode === 'login' ? 'Entrar' : 'Concluir cadastro'}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.four,
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  tabsRow: {
    flexDirection: 'row',
    padding: Spacing.one,
    borderRadius: Radius.medium,
    marginBottom: Spacing.three,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: Typography.caption.fontSize,
  },
  title: {
    fontSize: Typography.heading.fontSize,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: Typography.body.fontSize,
    marginTop: Spacing.half,
    marginBottom: Spacing.three,
  },
  googleBtn: {
    width: '100%',
    marginBottom: Spacing.three,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: Spacing.two,
    fontSize: Typography.caption.fontSize,
  },
  errorWrapper: {
    marginTop: Spacing.two,
    marginBottom: Spacing.one,
  },
  submitBtn: {
    marginTop: Spacing.two,
    width: '100%',
  },
});
