import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Trash2 } from 'lucide-react-native';
import { ScreenShell } from '@/components/layout/screen-shell';
import { useAuth } from '@/features/auth/auth-context';
import { useRecentReports, useHideReport } from '@/features/reports/queries';
import { ReportCard } from '@/features/reports/components/report-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useToast } from '@/context/toast-context';

export default function ModerationScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { showError, showSuccess } = useToast();

  const isModerator = user?.role === 'MODERATOR' || user?.role === 'ADMIN';

  const { data: reportsData, isLoading, error, refetch } = useRecentReports({ limit: 30 });
  const hideReportMutation = useHideReport();

  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [reason, setReason] = useState('Informação incorreta ou spam');
  const [modalVisible, setModalVisible] = useState(false);

  const reports = reportsData?.reports ?? [];

  if (!isAuthenticated || !isModerator) {
    return (
      <ScreenShell showBack>
        <ErrorState
          title="Acesso Restrito"
          message="Esta página é exclusiva para moderadores e administradores da comunidade."
          onRetry={() => router.push('/')}
        />
      </ScreenShell>
    );
  }

  const handleOpenHideModal = (reportId: number) => {
    setSelectedReportId(reportId);
    setReason('Informação incorreta ou spam');
    setModalVisible(true);
  };

  const handleConfirmHide = () => {
    if (!selectedReportId) return;

    hideReportMutation.mutate(
      { id: selectedReportId, reason },
      {
        onSuccess: () => {
          showSuccess(`Relato #${selectedReportId} ocultado com sucesso.`);
          setModalVisible(false);
          setSelectedReportId(null);
        },
        onError: (err: any) => {
          showError(err);
        },
      },
    );
  };

  return (
    <ScreenShell showBack refreshing={isLoading} onRefresh={refetch}>
      <Text style={[styles.title, { color: theme.text }]}>Painel de Moderação</Text>
      <Text style={[styles.subtitle, { color: theme.mutedForeground }]}>
        Oculte relatos incorretos, duplicados ou de spam para manter a qualidade da rede.
      </Text>

      {isLoading ? (
        <View style={styles.loadingStack}>
          <Skeleton height={100} borderRadius={Radius.medium} />
          <Skeleton height={100} borderRadius={Radius.medium} />
        </View>
      ) : error ? (
        <ErrorState onRetry={refetch} />
      ) : reports.length === 0 ? (
        <EmptyState
          title="Nenhum relato recente para moderação"
          description="A fila de relatos está limpa."
        />
      ) : (
        <View style={styles.list}>
          {reports.map((report) => (
            <View key={report.id} style={styles.reportRow}>
              <ReportCard report={report} />
              <Button
                variant="destructive"
                size="sm"
                icon={<Trash2 size={14} color="#FFFFFF" />}
                onPress={() => handleOpenHideModal(report.id)}
                style={styles.hideActionBtn}>
                Ocultar Relato #{report.id}
              </Button>
            </View>
          ))}
        </View>
      )}

      {/* Modal for entering hide reason */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Ocultar relato #{selectedReportId}
            </Text>
            <Text style={[styles.modalDesc, { color: theme.mutedForeground }]}>
              Informe o motivo da ocultação. O relato será removido da agregação de status
              e dos feeds de usuários.
            </Text>

            <Input
              label="Motivo da ocultação"
              value={reason}
              onChangeText={setReason}
              placeholder="Ex: Informação falsa, spam, linguagem imprópria"
            />

            <View style={styles.modalActions}>
              <Button
                variant="outline"
                onPress={() => setModalVisible(false)}
                disabled={hideReportMutation.isPending}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                loading={hideReportMutation.isPending}
                onPress={handleConfirmHide}>
                Confirmar Ocultação
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: Typography.heading.fontSize,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: Typography.body.fontSize,
    marginTop: Spacing.half,
    marginBottom: Spacing.three,
  },
  list: {
    gap: Spacing.three,
  },
  reportRow: {
    marginBottom: Spacing.two,
  },
  hideActionBtn: {
    alignSelf: 'flex-end',
    marginTop: -Spacing.one,
    marginBottom: Spacing.two,
  },
  loadingStack: {
    gap: Spacing.two,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.three,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    borderRadius: Radius.large,
    borderWidth: 1,
    padding: Spacing.four,
  },
  modalTitle: {
    fontSize: Typography.subheading.fontSize,
    fontWeight: '700',
  },
  modalDesc: {
    fontSize: Typography.caption.fontSize,
    marginTop: Spacing.half,
    marginBottom: Spacing.three,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
});
