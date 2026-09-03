import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronUp, ChevronDown, Trash2, Plus, GitBranch } from 'lucide-react-native';
import { ScreenShell } from '@/components/layout/screen-shell';
import { useAuth } from '@/features/auth/auth-context';
import { useCreateLine, useLines } from '@/features/metro/queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useToast } from '@/context/toast-context';
import { createLineSchema } from '@/api/schemas';

const LINE_COLORS = [
  '#005FA8',
  '#008061',
  '#EE3124',
  '#FFD100',
  '#F97316',
  '#EC4899',
  '#8B5CF6',
  '#14B8A6',
  '#64748B',
  '#0F172A',
];

interface StationRow {
  name: string;
  code: string;
  latitude: string;
  longitude: string;
}

interface BranchRow {
  name: string;
  code: string;
  stations: StationRow[];
}

const emptyStation = (): StationRow => ({ name: '', code: '', latitude: '', longitude: '' });
const emptyBranch = (): BranchRow => ({
  name: '',
  code: '',
  stations: [emptyStation(), emptyStation()],
});

export default function AdminLinesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { showError, showSuccess } = useToast();

  const isAdmin = user?.role === 'ADMIN';
  const { data: lines, isLoading, error, refetch } = useLines();
  const createLineMutation = useCreateLine();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [color, setColor] = useState(LINE_COLORS[0]);
  const [branches, setBranches] = useState<BranchRow[]>([emptyBranch()]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isAuthenticated || !isAdmin) {
    return (
      <ScreenShell showBack>
        <ErrorState
          title="Acesso Restrito"
          message="Esta página é exclusiva para administradores."
          onRetry={() => router.push('/')}
        />
      </ScreenShell>
    );
  }

  const updateBranch = (branchIndex: number, field: 'name' | 'code', value: string) => {
    setBranches((prev) =>
      prev.map((b, i) => (i === branchIndex ? { ...b, [field]: value } : b)),
    );
  };

  const updateStation = (
    branchIndex: number,
    stationIndex: number,
    field: keyof StationRow,
    value: string,
  ) => {
    setBranches((prev) =>
      prev.map((b, bi) =>
        bi === branchIndex
          ? {
              ...b,
              stations: b.stations.map((s, si) =>
                si === stationIndex ? { ...s, [field]: value } : s,
              ),
            }
          : b,
      ),
    );
  };

  const moveStation = (branchIndex: number, stationIndex: number, delta: -1 | 1) => {
    setBranches((prev) =>
      prev.map((b, bi) => {
        if (bi !== branchIndex) return b;
        const target = stationIndex + delta;
        if (target < 0 || target >= b.stations.length) return b;
        const stations = [...b.stations];
        [stations[stationIndex], stations[target]] = [stations[target], stations[stationIndex]];
        return { ...b, stations };
      }),
    );
  };

  const resetForm = () => {
    setName('');
    setCode('');
    setColor(LINE_COLORS[0]);
    setBranches([emptyBranch()]);
    setFormErrors({});
    setServerError(null);
  };

  const handleSubmit = () => {
    setServerError(null);
    setSuccessMessage(null);

    const validation = createLineSchema.safeParse({ name, code, color, branches });

    if (!validation.success) {
      const errors: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        const path = issue.path.join('.');
        errors[path] = issue.message;
      }
      setFormErrors(errors);
      showError('Verifique os campos obrigatórios da linha antes de cadastrar.');
      return;
    }

    createLineMutation.mutate(
      {
        name: validation.data.name,
        code: validation.data.code,
        color: validation.data.color,
        branches: validation.data.branches.map((b) => ({
          name: b.name,
          code: b.code,
          stations: b.stations.map((s) => ({
            name: s.name,
            code: s.code?.trim() || null,
            latitude: s.latitude,
            longitude: s.longitude,
          })),
        })),
      },
      {
        onSuccess: (line) => {
          const successMsg = `Linha "${line.name}" cadastrada com sucesso!`;
          setSuccessMessage(successMsg);
          showSuccess(successMsg);
          resetForm();
        },
        onError: (err: any) => {
          const errorMsg = err?.message || 'Falha ao cadastrar a linha. Tente novamente.';
          setServerError(errorMsg);
          showError(err);
        },
      },
    );
  };

  const removeBranch = (branchIndex: number) => {
    setBranches((prev) => prev.filter((_, i) => i !== branchIndex));
    setFormErrors({});
  };

  return (
    <ScreenShell showBack refreshing={isLoading} onRefresh={refetch}>
      <Text style={[styles.title, { color: theme.text }]}>Cadastro de Linhas</Text>
      <Text style={[styles.subtitle, { color: theme.mutedForeground }]}>
        Cadastre linhas com ramais e estações em ordem. O trecho comum entre ramais é
        repetido em cada ramal; estações existentes são reutilizadas automaticamente.
      </Text>

      {successMessage && (
        <View
          style={[
            styles.successBanner,
            { backgroundColor: theme.statusNormalBg, borderColor: theme.statusNormalBorder },
          ]}>
          <Text style={{ color: theme.statusNormal }}>{successMessage}</Text>
        </View>
      )}

      {serverError && <ErrorState message={serverError} />}

      {/* Linhas cadastradas */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Linhas cadastradas</Text>
      {isLoading ? (
        <View style={styles.loadingStack}>
          <Skeleton height={64} borderRadius={Radius.medium} />
          <Skeleton height={64} borderRadius={Radius.medium} />
        </View>
      ) : error ? (
        <ErrorState onRetry={refetch} />
      ) : !lines || lines.length === 0 ? (
        <EmptyState
          title="Nenhuma linha cadastrada"
          description="Cadastre a primeira linha da rede abaixo."
        />
      ) : (
        <View style={styles.lineList}>
          {lines.map((line) => (
            <View
              key={line.id}
              style={[
                styles.lineRow,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}>
              <View style={[styles.lineDot, { backgroundColor: line.color }]} />
              <View style={styles.lineInfo}>
                <Text style={[styles.lineName, { color: theme.text }]}>{line.name}</Text>
                <Text style={[styles.lineMeta, { color: theme.mutedForeground }]}>
                  {line.code} • {line.directions.map((d) => d.name).join(' ↔ ')}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Formulário */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Nova linha</Text>
      <View
        style={[
          styles.formCard,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}>
        <Input
          label="Nome da linha"
          placeholder="Ex: Linha Centro"
          value={name}
          onChangeText={setName}
          error={formErrors.name}
        />
        <Input
          label="Código (identificador único)"
          placeholder="Ex: centro"
          value={code}
          onChangeText={setCode}
          error={formErrors.code}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={[styles.fieldLabel, { color: theme.text }]}>Cor da linha</Text>
        <View style={styles.colorRow}>
          {LINE_COLORS.map((c) => {
            const selected = color.toLowerCase() === c.toLowerCase();
            return (
              <Pressable
                key={c}
                onPress={() => setColor(c)}
                accessibilityLabel={`Cor ${c}`}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: c },
                  selected && { borderColor: theme.text, borderWidth: 2 },
                ]}
              />
            );
          })}
        </View>
        {formErrors.color && (
          <Text style={[styles.errorText, { color: theme.destructive }]}>
            {formErrors.color}
          </Text>
        )}

        {/* Ramais */}
        <Text style={[styles.fieldLabel, { color: theme.text }]}>Ramais</Text>
        <Text style={[styles.hint, { color: theme.mutedForeground }]}>
          Uma linha simples (sem bifurcação) tem 1 ramal. Linhas com bifurcação, como a
          Linha Centro, têm 1 ramal por destino.
        </Text>
        <View style={styles.rowGroup}>
          {branches.map((branch, branchIndex) => (
            <View
              key={branchIndex}
              style={[
                styles.branchCard,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
              ]}>
              <View style={styles.branchHeader}>
                <View style={styles.branchTitleRow}>
                  <GitBranch size={16} color={theme.primary} />
                  <Text style={[styles.branchTitle, { color: theme.text }]}>
                    Ramal {branchIndex + 1}
                  </Text>
                </View>
                {branches.length > 1 && (
                  <Pressable
                    onPress={() => removeBranch(branchIndex)}
                    hitSlop={8}
                    accessibilityLabel="Remover ramal">
                    <Trash2 size={16} color={theme.destructive} />
                  </Pressable>
                )}
              </View>

              <View style={styles.branchInputs}>
                <Input
                  label="Nome do ramal"
                  placeholder="Ex: Ramal Jaboatão"
                  value={branch.name}
                  onChangeText={(v) => updateBranch(branchIndex, 'name', v)}
                  error={formErrors[`branches.${branchIndex}.name`]}
                  containerStyle={styles.flex3}
                />
                <Input
                  label="Código"
                  placeholder="Ex: jaboatao"
                  value={branch.code}
                  onChangeText={(v) => updateBranch(branchIndex, 'code', v)}
                  error={formErrors[`branches.${branchIndex}.code`]}
                  autoCapitalize="none"
                  autoCorrect={false}
                  containerStyle={styles.flex2}
                />
              </View>

              <Text style={[styles.stationSubLabel, { color: theme.mutedForeground }]}>
                Estações (na ordem do percurso)
              </Text>

              {branch.stations.map((s, stationIndex) => (
                <View key={stationIndex} style={styles.stationCard}>
                  <View style={styles.stationHeader}>
                    <Text style={[styles.stationOrder, { color: theme.mutedForeground }]}>
                      #{stationIndex + 1}
                    </Text>
                    <View style={styles.stationActions}>
                      <Pressable
                        onPress={() => moveStation(branchIndex, stationIndex, -1)}
                        disabled={stationIndex === 0}
                        hitSlop={8}
                        accessibilityLabel="Mover estação para cima">
                        <ChevronUp
                          size={18}
                          color={stationIndex === 0 ? theme.border : theme.text}
                        />
                      </Pressable>
                      <Pressable
                        onPress={() => moveStation(branchIndex, stationIndex, 1)}
                        disabled={stationIndex === branch.stations.length - 1}
                        hitSlop={8}
                        accessibilityLabel="Mover estação para baixo">
                        <ChevronDown
                          size={18}
                          color={
                            stationIndex === branch.stations.length - 1
                              ? theme.border
                              : theme.text
                          }
                        />
                      </Pressable>
                      {branch.stations.length > 2 && (
                        <Pressable
                          onPress={() =>
                            setBranches((prev) =>
                              prev.map((b, bi) =>
                                bi === branchIndex
                                  ? {
                                      ...b,
                                      stations: b.stations.filter(
                                        (_, si) => si !== stationIndex,
                                      ),
                                    }
                                  : b,
                              ),
                            )
                          }
                          hitSlop={8}
                          accessibilityLabel="Remover estação">
                          <Trash2 size={16} color={theme.destructive} />
                        </Pressable>
                      )}
                    </View>
                  </View>

                  <View style={styles.stationInputs}>
                    <Input
                      label="Nome"
                      placeholder="Ex: Joana Bezerra"
                      value={s.name}
                      onChangeText={(v) => updateStation(branchIndex, stationIndex, 'name', v)}
                      error={formErrors[`branches.${branchIndex}.stations.${stationIndex}.name`]}
                      containerStyle={styles.flex3}
                    />
                    <Input
                      label="Código"
                      placeholder="Ex: JBZ"
                      value={s.code}
                      onChangeText={(v) => updateStation(branchIndex, stationIndex, 'code', v)}
                      error={formErrors[`branches.${branchIndex}.stations.${stationIndex}.code`]}
                      autoCapitalize="characters"
                      containerStyle={styles.flex1}
                    />
                  </View>
                  <View style={styles.stationInputs}>
                    <Input
                      label="Latitude"
                      placeholder="Ex: -8.0632"
                      value={s.latitude}
                      onChangeText={(v) =>
                        updateStation(branchIndex, stationIndex, 'latitude', v)
                      }
                      error={formErrors[`branches.${branchIndex}.stations.${stationIndex}.latitude`]}
                      keyboardType="decimal-pad"
                      containerStyle={styles.flex1}
                    />
                    <Input
                      label="Longitude"
                      placeholder="Ex: -34.8712"
                      value={s.longitude}
                      onChangeText={(v) =>
                        updateStation(branchIndex, stationIndex, 'longitude', v)
                      }
                      error={formErrors[`branches.${branchIndex}.stations.${stationIndex}.longitude`]}
                      keyboardType="decimal-pad"
                      containerStyle={styles.flex1}
                    />
                  </View>
                  <Text style={[styles.coordHint, { color: theme.mutedForeground }]}>
                    Dica: copie as coordenadas do marcador no Google Maps.
                  </Text>
                </View>
              ))}

              {branch.stations.length < 200 && (
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Plus size={14} color={theme.text} />}
                  onPress={() =>
                    setBranches((prev) =>
                      prev.map((b, bi) =>
                        bi === branchIndex
                          ? { ...b, stations: [...b.stations, emptyStation()] }
                          : b,
                      ),
                    )
                  }>
                  Adicionar estação
                </Button>
              )}
            </View>
          ))}

          {branches.length < 8 && (
            <Button
              variant="outline"
              size="sm"
              icon={<GitBranch size={14} color={theme.text} />}
              onPress={() => setBranches((prev) => [...prev, emptyBranch()])}>
              Adicionar ramal
            </Button>
          )}
        </View>
        {formErrors.branches && (
          <Text style={[styles.errorText, { color: theme.destructive }]}>
            {formErrors.branches}
          </Text>
        )}

        <Button
          size="lg"
          loading={createLineMutation.isPending}
          onPress={handleSubmit}
          style={styles.submitBtn}>
          Cadastrar linha
        </Button>
      </View>
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
  sectionTitle: {
    fontSize: Typography.subheading.fontSize,
    fontWeight: '700',
    marginTop: Spacing.three,
    marginBottom: Spacing.two,
  },
  successBanner: {
    borderWidth: 1,
    borderRadius: Radius.medium,
    padding: Spacing.three,
    marginBottom: Spacing.three,
  },
  loadingStack: {
    gap: Spacing.two,
  },
  lineList: {
    gap: Spacing.two,
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.medium,
    padding: Spacing.three,
  },
  lineDot: {
    width: 14,
    height: 14,
    borderRadius: Radius.full,
  },
  lineInfo: {
    flex: 1,
  },
  lineName: {
    fontSize: Typography.bodyBold.fontSize,
    fontWeight: '600',
  },
  lineMeta: {
    fontSize: Typography.small.fontSize,
    marginTop: 2,
  },
  formCard: {
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.four,
  },
  fieldLabel: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '600',
    marginBottom: Spacing.one,
    marginTop: Spacing.one,
  },
  hint: {
    fontSize: Typography.small.fontSize,
    marginBottom: Spacing.two,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  colorSwatch: {
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  errorText: {
    fontSize: Typography.small.fontSize,
    marginTop: Spacing.one,
    fontWeight: '500',
  },
  rowGroup: {
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  branchCard: {
    borderWidth: 1,
    borderRadius: Radius.medium,
    padding: Spacing.three,
  },
  branchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  branchTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  branchTitle: {
    fontSize: Typography.bodyBold.fontSize,
    fontWeight: '700',
  },
  branchInputs: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  stationSubLabel: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '600',
    marginTop: Spacing.three,
    marginBottom: Spacing.two,
  },
  stationCard: {
    marginBottom: Spacing.two,
  },
  stationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.one,
  },
  stationOrder: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '700',
  },
  stationActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  stationInputs: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  coordHint: {
    fontSize: Typography.small.fontSize,
    marginTop: -Spacing.two,
    marginBottom: Spacing.two,
  },
  flex1: {
    flex: 1,
  },
  flex2: {
    flex: 2,
  },
  flex3: {
    flex: 3,
  },
  submitBtn: {
    marginTop: Spacing.two,
    width: '100%',
  },
});