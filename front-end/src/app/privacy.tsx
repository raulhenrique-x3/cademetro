import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Shield, Trash2, MapPin, Lock, Mail } from 'lucide-react-native';
import { ScreenShell } from '@/components/layout/screen-shell';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function PrivacyPolicyScreen() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <ScreenShell>
      <Pressable
        onPress={() => router.back()}
        style={styles.backButton}
        accessibilityRole="button"
        accessibilityLabel="Voltar"
      >
        <ArrowLeft size={20} color={theme.text} />
        <Text style={[styles.backText, { color: theme.text }]}>Voltar</Text>
      </Pressable>

      <View style={styles.header}>
        <Shield size={28} color={theme.primary} />
        <Text style={[styles.title, { color: theme.text }]}>
          Política de Privacidade
        </Text>
      </View>

      <Text style={[styles.lastUpdated, { color: theme.mutedForeground }]}>
        Última atualização: Março de 2026 • Em conformidade com a LGPD e Google Play Store
      </Text>

      <View style={styles.sectionList}>
        {/* 1. Introdução */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }, Shadows.card]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>1. Visão Geral</Text>
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            O <Text style={{ fontWeight: '700' }}>Cadê Metrô</Text> é uma plataforma colaborativa que tem como objetivo informar aos passageiros o status em tempo real das linhas e estações do metrô. Valorizamos sua privacidade e tratamos seus dados pessoais com transparência e segurança.
          </Text>
        </View>

        {/* 2. Dados de Localização */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }, Shadows.card]}>
          <View style={styles.cardHeaderWithIcon}>
            <MapPin size={20} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>2. Uso de Localização</Text>
          </View>
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            O aplicativo solicita permissão de acesso à sua localização aproximada e precisa (<Text style={{ fontWeight: '600' }}>ACCESS_FINE_LOCATION</Text> e <Text style={{ fontWeight: '600' }}>ACCESS_COARSE_LOCATION</Text>) exclusivamente para:
          </Text>
          <Text style={[styles.bulletItem, { color: theme.textSecondary }]}>
            • Identificar a estação de metrô mais próxima de você;
          </Text>
          <Text style={[styles.bulletItem, { color: theme.textSecondary }]}>
            • Ordenar a lista de estações por distância física;
          </Text>
          <Text style={[styles.bulletItem, { color: theme.textSecondary }]}>
            • Validar a veracidade e proximidade de relatos de ocorrências nas estações.
          </Text>
          <Text style={[styles.paragraph, { color: theme.textSecondary, marginTop: Spacing.two }]}>
            <Text style={{ fontWeight: '700' }}>Importante:</Text> O Cadê Metrô <Text style={{ fontWeight: '700' }}>NÃO</Text> coleta nem rastreia sua localização em segundo plano (background). A localização só é lida quando você interage com funcionalidades que expressamente a solicitam em primeiro plano.
          </Text>
        </View>

        {/* 3. Dados Cadastrais */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }, Shadows.card]}>
          <View style={styles.cardHeaderWithIcon}>
            <Lock size={20} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>3. Dados Coletados na Conta</Text>
          </View>
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            Para usuários que optam por criar uma conta, coletamos:
          </Text>
          <Text style={[styles.bulletItem, { color: theme.textSecondary }]}>
            • E-mail e nome (para identificação e login);
          </Text>
          <Text style={[styles.bulletItem, { color: theme.textSecondary }]}>
            • Senha criptografada por algoritmo hash seguro (bcrypt);
          </Text>
          <Text style={[styles.bulletItem, { color: theme.textSecondary }]}>
            • Identificador do Google (caso utilize login via Google OAuth).
          </Text>
          <Text style={[styles.paragraph, { color: theme.textSecondary, marginTop: Spacing.two }]}>
            Esses dados nunca são comercializados com terceiros e são utilizados estritamente para o funcionamento e moderação do aplicativo.
          </Text>
        </View>

        {/* 4. Exclusão de Conta e Dados */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }, Shadows.card]}>
          <View style={styles.cardHeaderWithIcon}>
            <Trash2 size={20} color={theme.destructive} />
            <Text style={[styles.sectionTitle, { color: theme.destructive }]}>4. Exclusão de Conta e Dados</Text>
          </View>
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            Em conformidade com as diretrizes da Google Play Store e a LGPD (Lei Geral de Proteção de Dados), você tem total controle sobre seus dados:
          </Text>
          <Text style={[styles.bulletItem, { color: theme.textSecondary }]}>
            • <Text style={{ fontWeight: '700' }}>Pelo aplicativo:</Text> Acesse a aba <Text style={{ fontWeight: '600' }}>Perfil</Text> e toque no botão <Text style={{ fontWeight: '600' }}>Excluir minha conta</Text>.
          </Text>
          <Text style={[styles.bulletItem, { color: theme.textSecondary }]}>
            • <Text style={{ fontWeight: '700' }}>Por solicitação web:</Text> Caso não possua mais o aplicativo instalado, envie uma solicitação para <Text style={{ fontWeight: '600' }}>contato@cademetro.com.br</Text> com o assunto &quot;Exclusão de Conta&quot; indicando seu e-mail cadastrado.
          </Text>
          <Text style={[styles.paragraph, { color: theme.textSecondary, marginTop: Spacing.two }]}>
            Ao solicitar a exclusão, todos os seus dados cadastrais, tokens de sessão, pontuações e relatos vinculados serão excluídos permanentemente de nossos servidores.
          </Text>
        </View>

        {/* 5. Contato */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }, Shadows.card]}>
          <View style={styles.cardHeaderWithIcon}>
            <Mail size={20} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>5. Contato</Text>
          </View>
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            Para dúvidas ou sugestões sobre o tratamento de dados pessoais, entre em contato com a equipe responsável pelo e-mail: <Text style={{ fontWeight: '700', color: theme.primary }}>contato@cademetro.com.br</Text>.
          </Text>
        </View>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginBottom: Spacing.two,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: Typography.body.fontSize,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.one,
  },
  title: {
    fontSize: Typography.heading.fontSize,
    fontWeight: '800',
  },
  lastUpdated: {
    fontSize: Typography.small.fontSize,
    marginBottom: Spacing.three,
  },
  sectionList: {
    gap: Spacing.three,
    paddingBottom: Spacing.five,
  },
  card: {
    padding: Spacing.three,
    borderRadius: Radius.large,
    borderWidth: 1,
  },
  cardHeaderWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  sectionTitle: {
    fontSize: Typography.subheading.fontSize,
    fontWeight: '700',
    marginBottom: Spacing.one,
  },
  paragraph: {
    fontSize: Typography.body.fontSize,
    lineHeight: 22,
  },
  bulletItem: {
    fontSize: Typography.body.fontSize,
    lineHeight: 22,
    marginLeft: Spacing.two,
    marginTop: Spacing.half,
  },
});
