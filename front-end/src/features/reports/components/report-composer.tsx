import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  PartyPopper,
  ShieldCheck,
  Send,
  Sparkles,
  MapPin,
  RefreshCw,
  Check,
  AlertCircle,
  ArrowRight,
} from 'lucide-react-native';
import { ReportTypeString } from '@/api/types';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useToast } from '@/context/toast-context';
import { useAuth } from '@/features/auth/auth-context';
import { useLines, useStations } from '@/features/metro/queries';
import { useCreateReport } from '../queries';
import { TypeSelector } from './type-selector';
import { DirectionSelector } from './direction-selector';
import { StationSelector } from './station-selector';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/error-state';
import { createReportSchema } from '@/api/schemas';
import { getCurrentLocation, findNearestStation } from '@/lib/location';
import { REPORT_TYPE_CONFIG } from '@/constants/metro';

export interface ReportComposerProps {
  initialLineId?: number;
  initialStationId?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const QUICK_OBSERVATION_TAGS = [
  'Trem lotado',
  'Ar-condicionado desligado',
  'Plataforma cheia',
  'Lentidão na via',
  'Aguardando sinal',
  'Viagem tranquila',
];

export function ReportComposer({
  initialLineId,
  initialStationId,
  onSuccess,
  onCancel,
}: ReportComposerProps) {
  const theme = useTheme();
  const isDark = theme.background === '#090D16';
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { showError, showInfo, showSuccess } = useToast();

  const { data: lines = [] } = useLines();

  // Selected line id
  const [selectedLineId, setSelectedLineId] = useState<number>(initialLineId ?? 1);

  // Derive active line safely without cascading useEffect setState
  const currentLine =
    lines.find((l) => l.id === selectedLineId) ||
    lines[0] || {
      id: 1,
      name: 'Linha Centro',
      code: '1-centro',
      color: '#EA580C',
      directions: [],
    };

  const activeLineId = currentLine.id;

  const { data: stations = [] } = useStations(activeLineId);
  const [selectedStationId, setSelectedStationId] = useState<number | null>(
    initialStationId ?? null,
  );

  const [selectedDirectionId, setSelectedDirectionId] = useState<number | null>(null);
  const [reportType, setReportType] = useState<ReportTypeString>('TRAIN_ARRIVING');
  const [description, setDescription] = useState('');
  const [includeLocation, setIncludeLocation] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const createReportMutation = useCreateReport();

  const isTrainEvent = [
    'TRAIN_ARRIVING',
    'TRAIN_ARRIVED',
    'TRAIN_DEPARTED',
    'TRAIN_STOPPED',
  ].includes(reportType);

  const selectedStation = stations.find((s) => s.id === selectedStationId);
  const selectedDirection = currentLine.directions?.find((d) => d.id === selectedDirectionId);

  const handleLineChange = (lineId: number) => {
    setSelectedLineId(lineId);
    setSelectedStationId(null);
    setSelectedDirectionId(null);
    setFormErrors({});
  };

  const handleStationChange = (stationId: number) => {
    setSelectedStationId(stationId);
    setFormErrors((prev) => ({ ...prev, stationId: '' }));
  };

  const handleDirectionChange = (directionId: number) => {
    setSelectedDirectionId(directionId);
    setFormErrors((prev) => ({ ...prev, directionId: '' }));
  };

  const handleLocateNearest = async () => {
    setIsLocating(true);
    const result = await getCurrentLocation();
    setIsLocating(false);

    if (result.error) {
      showError(result.error);
      return;
    }

    if (result.coords) {
      const { latitude, longitude } = result.coords;
      setLocation({ lat: latitude, lng: longitude });
      setIncludeLocation(true);

      if (stations.length > 0) {
        const nearestResult = findNearestStation(result.coords, stations);
        if (nearestResult) {
          setSelectedStationId(nearestResult.station.id);
          setFormErrors((prev) => ({ ...prev, stationId: '' }));
          showInfo(
            `Estação mais próxima: ${nearestResult.station.name} (${nearestResult.formattedDistance})`,
          );
        }
      }
    }
  };

  const handleToggleQuickTag = (tag: string) => {
    if (description.includes(tag)) {
      // Remove tag
      const updated = description
        .replace(new RegExp(`\\b${tag}\\b,?\\s*`, 'g'), '')
        .trim()
        .replace(/,\s*$/, '');
      setDescription(updated);
    } else {
      // Add tag
      const updated = description.trim() ? `${description.trim()}, ${tag}` : tag;
      if (updated.length <= 500) {
        setDescription(updated);
      }
    }
  };

  const handleSubmit = async () => {
    setServerError(null);

    const payload = {
      type: reportType,
      lineId: activeLineId,
      stationId: selectedStationId,
      directionId: selectedDirectionId,
      description: description.trim() || null,
      locationLat: includeLocation && location ? location.lat : null,
      locationLng: includeLocation && location ? location.lng : null,
    };

    const validation = createReportSchema.safeParse(payload);
    if (!validation.success) {
      const errMap: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        const field = issue.path[0];
        if (field) errMap[String(field)] = issue.message;
      }
      setFormErrors(errMap);
      showError('Por favor, selecione a estação e o sentido do trem para publicar o relato.');
      return;
    }

    setFormErrors({});

    createReportMutation.mutate(payload, {
      onSuccess: () => {
        setIsSuccess(true);
        showSuccess('Relato publicado com sucesso!');
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          } else {
            router.push('/');
          }
        }, 1500);
      },
      onError: (err: any) => {
        setServerError(
          err.message || 'Erro ao enviar relato. Tente novamente em alguns segundos.',
        );
      },
    });
  };

  // 1. Unauthenticated view
  if (!isAuthenticated) {
    return (
      <View style={styles.authContainer}>
        <View style={[styles.authCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.authIconBadge, { backgroundColor: theme.primary + (isDark ? '25' : '15') }]}>
            <ShieldCheck size={36} color={theme.primary} strokeWidth={2.2} />
          </View>

          <Text style={[styles.authTitle, { color: theme.text }]}>
            Participe da Comunidade
          </Text>

          <Text style={[styles.authDesc, { color: theme.mutedForeground }]}>
            Para garantir que todos os passageiros recebam informações reais e seguras sobre o metrô,
            é necessário estar conectado para relatar a situação do trem.
          </Text>

          <View style={styles.benefitList}>
            <View style={styles.benefitItem}>
              <View style={[styles.benefitDot, { backgroundColor: theme.statusNormal }]} />
              <Text style={[styles.benefitText, { color: theme.text }]}>
                Acumule pontos de confiabilidade com cada relato validado
              </Text>
            </View>

            <View style={styles.benefitItem}>
              <View style={[styles.benefitDot, { backgroundColor: theme.primary }]} />
              <Text style={[styles.benefitText, { color: theme.text }]}>
                Ajude passageiros em tempo real com horários atualizados
              </Text>
            </View>

            <View style={styles.benefitItem}>
              <View style={[styles.benefitDot, { backgroundColor: theme.statusRestricted }]} />
              <Text style={[styles.benefitText, { color: theme.text }]}>
                Proteja a rede contra notícias falsas ou trotes
              </Text>
            </View>
          </View>

          <View style={styles.authButtons}>
            <Button
              size="lg"
              onPress={() => router.push('/login')}
              style={styles.fullWidthBtn}>
              Entrar com minha conta
            </Button>

            <Button
              variant="outline"
              size="lg"
              onPress={() => router.push('/register')}
              style={styles.fullWidthBtn}>
              Criar conta gratuita
            </Button>

            {onCancel && (
              <Button variant="ghost" onPress={onCancel}>
                Voltar
              </Button>
            )}
          </View>
        </View>
      </View>
    );
  }

  // 2. Success view
  if (isSuccess) {
    const typeInfo = REPORT_TYPE_CONFIG[reportType];
    return (
      <View style={styles.authContainer}>
        <View
          style={[
            styles.authCard,
            styles.successCard,
            { backgroundColor: theme.card, borderColor: theme.statusNormal },
          ]}>
          <View style={[styles.successIconBadge, { backgroundColor: theme.statusNormal + '20' }]}>
            <PartyPopper size={44} color={theme.statusNormal} />
          </View>

          <Text style={[styles.successTitle, { color: theme.text }]}>
            Relato Publicado!
          </Text>

          <Text style={[styles.successSubtitle, { color: theme.mutedForeground }]}>
            Obrigado! Seu relato foi registrado e já está ajudando passageiros no mapa em tempo real.
          </Text>

          {/* Published Report Summary */}
          <View
            style={[
              styles.publishedSummaryCard,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}>
            <View style={styles.publishedSummaryRow}>
              <View style={[styles.lineBadgeDot, { backgroundColor: currentLine.color }]} />
              <Text style={[styles.publishedLineName, { color: theme.text }]}>
                {currentLine.name}
              </Text>
            </View>

            {selectedStation && (
              <View style={styles.publishedSummaryRow}>
                <MapPin size={14} color={theme.primary} />
                <Text style={[styles.publishedDetailText, { color: theme.text }]}>
                  {selectedStation.name}
                </Text>
              </View>
            )}

            <View style={styles.publishedSummaryRow}>
              <Text style={styles.publishedTypeIcon}>{typeInfo?.icon || '🚇'}</Text>
              <Text style={[styles.publishedDetailText, { color: theme.text, fontWeight: '700' }]}>
                {typeInfo?.label || reportType}
              </Text>
            </View>
          </View>

          <View style={styles.authButtons}>
            <Button
              size="lg"
              onPress={() => {
                if (onSuccess) onSuccess();
                else router.push('/');
              }}
              style={styles.fullWidthBtn}>
              Ver no Início
            </Button>

            <Button
              variant="outline"
              onPress={() => {
                setIsSuccess(false);
                setDescription('');
                setSelectedStationId(null);
                setSelectedDirectionId(null);
              }}>
              Fazer outro relato
            </Button>
          </View>
        </View>
      </View>
    );
  }

  const isFormIncomplete = isTrainEvent && (!selectedStationId || !selectedDirectionId);

  return (
    <View style={styles.wrapper}>
      <ScrollView
        style={[styles.container, { backgroundColor: theme.background }]}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        {/* Hero Header */}
        <View style={styles.headerBox}>
          <Text style={[styles.mainHeading, { color: theme.text }]}>
            Como está o trem agora?
          </Text>
          <Text style={[styles.subHeading, { color: theme.mutedForeground }]}>
            Ajude a comunidade compartilhando o status em tempo real.
          </Text>
        </View>

        {serverError && <ErrorState message={serverError} />}

        {/* STEP 1: Select Line */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.stepNumberBadge, { backgroundColor: currentLine.color }]}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Linha do Metrô</Text>
              <Text style={[styles.sectionSubtitle, { color: theme.mutedForeground }]}>
                Em qual linha você está viajando?
              </Text>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.linesRow}>
            {lines.map((l) => {
              const isSelected = l.id === activeLineId;
              return (
                <Pressable
                  key={l.id}
                  onPress={() => handleLineChange(l.id)}
                  accessibilityRole="radio"
                  accessibilityLabel={l.name}
                  accessibilityState={{ selected: isSelected }}
                  style={({ pressed }) => [
                    styles.lineChip,
                    {
                      backgroundColor: isSelected
                        ? l.color
                        : isDark
                        ? '#131B2E'
                        : '#FFFFFF',
                      borderColor: l.color,
                      borderWidth: isSelected ? 2 : 1,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}>
                  <View
                    style={[
                      styles.lineColorDot,
                      { backgroundColor: isSelected ? '#FFFFFF' : l.color },
                    ]}
                  />
                  <Text
                    style={[
                      styles.lineChipText,
                      { color: isSelected ? '#FFFFFF' : theme.text },
                    ]}>
                    {l.name}
                  </Text>
                  {isSelected && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* STEP 2: Select Station */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.stepNumberBadge, { backgroundColor: currentLine.color }]}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Estação</Text>
              <Text style={[styles.sectionSubtitle, { color: theme.mutedForeground }]}>
                Onde o trem se encontra neste momento?
              </Text>
            </View>
          </View>

          <StationSelector
            stations={stations}
            value={selectedStationId}
            onChange={handleStationChange}
            error={formErrors.stationId}
            onLocateNearest={handleLocateNearest}
            isLocating={isLocating}
            userLocation={location ? { latitude: location.lat, longitude: location.lng } : null}
            lineColor={currentLine.color}
          />
        </View>

        {/* STEP 3: Select Direction (terminal) */}
        {currentLine && currentLine.directions && currentLine.directions.length > 0 && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.stepNumberBadge, { backgroundColor: currentLine.color }]}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Sentido do Trem</Text>
                <Text style={[styles.sectionSubtitle, { color: theme.mutedForeground }]}>
                  Para qual terminal a composição está seguindo?
                </Text>
              </View>
            </View>

            <DirectionSelector
              directions={currentLine.directions}
              value={selectedDirectionId}
              onChange={handleDirectionChange}
              error={formErrors.directionId}
              lineColor={currentLine.color}
            />
          </View>
        )}

        {/* STEP 4: Select Event Type */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.stepNumberBadge, { backgroundColor: currentLine.color }]}>
              <Text style={styles.stepNumberText}>{currentLine.directions?.length ? '4' : '3'}</Text>
            </View>
            <View>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Situação do Trem</Text>
              <Text style={[styles.sectionSubtitle, { color: theme.mutedForeground }]}>
                Informe o estado atual do trem ou da linha
              </Text>
            </View>
          </View>

          <TypeSelector value={reportType} onChange={setReportType} />
        </View>

        {/* STEP 5: Quick Tags & Description */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.stepNumberBadge, { backgroundColor: theme.mutedForeground }]}>
              <Sparkles size={12} color="#FFFFFF" />
            </View>
            <View>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Observações Adicionais (opcional)
              </Text>
              <Text style={[styles.sectionSubtitle, { color: theme.mutedForeground }]}>
                Toque nas tags rápidas ou digite detalhes úteis
              </Text>
            </View>
          </View>

          {/* Quick Tags */}
          <View style={styles.quickTagsContainer}>
            {QUICK_OBSERVATION_TAGS.map((tag) => {
              const isTagActive = description.includes(tag);
              return (
                <Pressable
                  key={tag}
                  onPress={() => handleToggleQuickTag(tag)}
                  style={({ pressed }) => [
                    styles.quickTagPill,
                    {
                      backgroundColor: isTagActive
                        ? theme.primary + (isDark ? '30' : '18')
                        : theme.card,
                      borderColor: isTagActive ? theme.primary : theme.border,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.quickTagText,
                      {
                        color: isTagActive ? theme.primary : theme.text,
                        fontWeight: isTagActive ? '700' : '500',
                      },
                    ]}>
                    {isTagActive ? `✓ ${tag}` : `+ ${tag}`}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Input
            placeholder="Ex: Ar-condicionado não funciona, intervalo demorado..."
            value={description}
            onChangeText={setDescription}
            maxLength={500}
            multiline
            numberOfLines={3}
            containerStyle={styles.notesInputContainer}
          />

          <Text style={[styles.charCount, { color: theme.mutedForeground }]}>
            {description.length} / 500 caracteres
          </Text>
        </View>

        {/* STEP 6: Geolocation & Trust Badge */}
        <View
          style={[
            styles.locationCard,
            {
              backgroundColor: theme.card,
              borderColor: includeLocation && location ? theme.statusNormal : theme.border,
            },
          ]}>
          <View style={styles.locationHeaderRow}>
            <View style={styles.locationTitleRow}>
              <View
                style={[
                  styles.locationIconBadge,
                  {
                    backgroundColor:
                      includeLocation && location
                        ? theme.statusNormal + '20'
                        : theme.backgroundElement,
                  },
                ]}>
                <ShieldCheck
                  size={20}
                  color={includeLocation && location ? theme.statusNormal : theme.mutedForeground}
                />
              </View>

              <View style={styles.locationTextContainer}>
                <Text style={[styles.locationTitle, { color: theme.text }]}>
                  Localização GPS verificada
                </Text>
                <Text style={[styles.locationSub, { color: theme.mutedForeground }]}>
                  {includeLocation && location
                    ? `GPS ativo (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}) • + Confiabilidade`
                    : 'Aumenta a pontuação de confiança do seu relato.'}
                </Text>
              </View>
            </View>

            <Switch
              value={includeLocation}
              onValueChange={async (val) => {
                setIncludeLocation(val);
                if (val && !location) {
                  await handleLocateNearest();
                }
              }}
            />
          </View>

          {includeLocation && (
            <Pressable
              onPress={handleLocateNearest}
              disabled={isLocating}
              style={({ pressed }) => [
                styles.refreshLocationBtn,
                { opacity: pressed || isLocating ? 0.7 : 1 },
              ]}>
              {isLocating ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <RefreshCw size={13} color={theme.primary} />
              )}
              <Text style={[styles.refreshLocationText, { color: theme.primary }]}>
                {isLocating ? 'Atualizando precisão...' : 'Recalibrar GPS'}
              </Text>
            </Pressable>
          )}
        </View>

        {/* Extra spacing for bottom dock clearance */}
        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Floating Bottom Action Dock */}
      <View
        style={[
          styles.floatingBottomDock,
          {
            backgroundColor: theme.card,
            borderTopColor: theme.border,
          },
        ]}>
        {/* Live Summary Strip */}
        <View style={styles.summaryStrip}>
          <View style={styles.summaryLeft}>
            <View style={[styles.summaryLineBadge, { backgroundColor: currentLine.color }]}>
              <Text style={styles.summaryLineText}>{currentLine.name.split(' ')[0]}</Text>
            </View>

            <Text style={[styles.summaryStationText, { color: theme.text }]} numberOfLines={1}>
              {selectedStation ? selectedStation.name : 'Estação pendente'}
            </Text>

            {selectedDirection && (
              <>
                <ArrowRight size={12} color={theme.mutedForeground} />
                <Text style={[styles.summaryDirText, { color: theme.mutedForeground }]} numberOfLines={1}>
                  {selectedDirection.name}
                </Text>
              </>
            )}
          </View>

          {isFormIncomplete && (
            <View style={styles.warningPill}>
              <AlertCircle size={12} color={theme.statusRestricted} />
              <Text style={[styles.warningText, { color: theme.statusRestricted }]}>
                Preencha estação e sentido
              </Text>
            </View>
          )}
        </View>

        {/* Main Action Buttons */}
        <View style={styles.actionButtonsRow}>
          {onCancel && (
            <Button
              variant="outline"
              size="lg"
              disabled={createReportMutation.isPending}
              onPress={onCancel}
              style={styles.cancelButton}>
              Cancelar
            </Button>
          )}

          <Button
            size="lg"
            loading={createReportMutation.isPending}
            onPress={handleSubmit}
            style={styles.submitButton}>
            <Send size={18} color="#FFFFFF" />
            <Text style={styles.submitBtnText}>Publicar Relato</Text>
          </Button>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    position: 'relative',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.four,
  },
  headerBox: {
    marginBottom: Spacing.three,
  },
  mainHeading: {
    fontSize: Typography.heading.fontSize,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subHeading: {
    fontSize: Typography.body.fontSize,
    marginTop: 2,
    lineHeight: 22,
  },
  sectionCard: {
    marginBottom: Spacing.three,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  stepNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: Typography.small.fontSize,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: Typography.bodyBold.fontSize,
    fontWeight: Typography.bodyBold.fontWeight,
  },
  sectionSubtitle: {
    fontSize: Typography.caption.fontSize,
    marginTop: 1,
  },
  linesRow: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  lineChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.full,
    marginRight: Spacing.two,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  lineColorDot: {
    width: 10,
    height: 10,
    borderRadius: Radius.full,
  },
  lineChipText: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '700',
  },
  quickTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one + 2,
    marginBottom: Spacing.two,
  },
  quickTagPill: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two + 2,
  },
  quickTagText: {
    fontSize: Typography.caption.fontSize,
  },
  notesInputContainer: {
    marginBottom: 4,
  },
  charCount: {
    fontSize: Typography.small.fontSize,
    textAlign: 'right',
    marginTop: 2,
  },
  locationCard: {
    borderWidth: 1,
    borderRadius: Radius.medium,
    padding: Spacing.three,
    marginBottom: Spacing.three,
  },
  locationHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flex: 1,
    marginRight: Spacing.two,
  },
  locationIconBadge: {
    width: 36,
    height: 36,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationTextContainer: {
    flex: 1,
  },
  locationTitle: {
    fontSize: Typography.bodyBold.fontSize,
    fontWeight: '700',
  },
  locationSub: {
    fontSize: Typography.small.fontSize,
    marginTop: 2,
    lineHeight: 16,
  },
  refreshLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.two,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  refreshLocationText: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '600',
  },
  floatingBottomDock: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.four,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  summaryStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  summaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
    flex: 1,
  },
  summaryLineBadge: {
    paddingVertical: 2,
    paddingHorizontal: Spacing.one + 2,
    borderRadius: Radius.small,
  },
  summaryLineText: {
    color: '#FFFFFF',
    fontSize: Typography.small.fontSize,
    fontWeight: '800',
  },
  summaryStationText: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '700',
    maxWidth: 130,
  },
  summaryDirText: {
    fontSize: Typography.caption.fontSize,
    maxWidth: 100,
  },
  warningPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingVertical: 2,
    paddingHorizontal: Spacing.one + 2,
    borderRadius: Radius.small,
  },
  warningText: {
    fontSize: Typography.small.fontSize,
    fontWeight: '700',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: Typography.bodyBold.fontSize,
    fontWeight: '700',
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.three,
  },
  authCard: {
    padding: Spacing.four,
    borderRadius: Radius.large,
    borderWidth: 1,
    alignItems: 'center',
  },
  authIconBadge: {
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  authTitle: {
    fontSize: Typography.heading.fontSize,
    fontWeight: '800',
    marginBottom: Spacing.one,
    textAlign: 'center',
  },
  authDesc: {
    fontSize: Typography.body.fontSize,
    marginBottom: Spacing.three,
    textAlign: 'center',
    lineHeight: 22,
  },
  benefitList: {
    width: '100%',
    marginBottom: Spacing.four,
    gap: Spacing.two,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  benefitDot: {
    width: 8,
    height: 8,
    borderRadius: Radius.full,
  },
  benefitText: {
    fontSize: Typography.caption.fontSize,
    flex: 1,
    lineHeight: 18,
  },
  authButtons: {
    width: '100%',
    gap: Spacing.two,
  },
  fullWidthBtn: {
    width: '100%',
  },
  successCard: {
    paddingVertical: Spacing.six,
  },
  successIconBadge: {
    width: 76,
    height: 76,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  successTitle: {
    fontSize: Typography.heading.fontSize,
    fontWeight: '800',
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: Typography.body.fontSize,
    marginTop: Spacing.one,
    marginBottom: Spacing.four,
    textAlign: 'center',
    lineHeight: 22,
  },
  publishedSummaryCard: {
    width: '100%',
    padding: Spacing.three,
    borderRadius: Radius.medium,
    borderWidth: 1,
    marginBottom: Spacing.four,
    gap: Spacing.two,
  },
  publishedSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  lineBadgeDot: {
    width: 12,
    height: 12,
    borderRadius: Radius.full,
  },
  publishedLineName: {
    fontSize: Typography.bodyBold.fontSize,
    fontWeight: '700',
  },
  publishedDetailText: {
    fontSize: Typography.body.fontSize,
  },
  publishedTypeIcon: {
    fontSize: 16,
  },
});
