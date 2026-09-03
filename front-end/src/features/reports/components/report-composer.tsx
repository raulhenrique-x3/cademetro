import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { PartyPopper } from 'lucide-react-native';
import { ReportTypeString, LineDto, StationDto } from '@/api/types';
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

export interface ReportComposerProps {
  initialLineId?: number;
  initialStationId?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ReportComposer({
  initialLineId,
  initialStationId,
  onSuccess,
  onCancel,
}: ReportComposerProps) {
  const theme = useTheme();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { showError } = useToast();

  const { data: lines = [], isLoading: loadingLines } = useLines();
  const [selectedLineId, setSelectedLineId] = useState<number>(initialLineId ?? 1);

  const { data: stations = [], isLoading: loadingStations } = useStations(selectedLineId);
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

  // Find the selected line object
  const currentLine = lines.find((l) => l.id === selectedLineId) || lines[0];

  // Set line when initialLineId changes or lines load
  useEffect(() => {
    if (lines.length > 0 && !lines.some((l) => l.id === selectedLineId)) {
      setSelectedLineId(lines[0].id);
    }
  }, [lines, selectedLineId]);

  // If station is picked, find if it has directions on the line
  const handleLineChange = (lineId: number) => {
    setSelectedLineId(lineId);
    setSelectedStationId(null);
    setSelectedDirectionId(null);
  };

  const handleStationChange = (stationId: number) => {
    setSelectedStationId(stationId);
    setFormErrors((prev) => ({ ...prev, stationId: '' }));
  };

  const handleDirectionChange = (directionId: number) => {
    setSelectedDirectionId(directionId);
    setFormErrors((prev) => ({ ...prev, directionId: '' }));
  };

  const handleLocateNearest = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      alert('Geolocalização não suportada neste dispositivo.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        setLocation({ lat: latitude, lng: longitude });

        // Find nearest station by Euclidean distance (approximate)
        if (stations.length > 0) {
          let nearest = stations[0];
          let minDist = Infinity;
          for (const s of stations) {
            const dist =
              Math.pow(s.latitude - latitude, 2) + Math.pow(s.longitude - longitude, 2);
            if (dist < minDist) {
              minDist = dist;
              nearest = s;
            }
          }
          setSelectedStationId(nearest.id);
        }
      },
      () => {
        setIsLocating(false);
        alert('Não foi possível obter sua localização atual.');
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const handleSubmit = async () => {
    setServerError(null);

    const payload = {
      type: reportType,
      lineId: selectedLineId,
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
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          } else {
            router.push('/');
          }
        }, 1200);
      },
      onError: (err: any) => {
        setServerError(
          err.message || 'Erro ao enviar relato. Tente novamente em alguns segundos.',
        );
      },
    });
  };

  if (!isAuthenticated) {
    return (
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.authTitle, { color: theme.text }]}>Faça login para reportar</Text>
        <Text style={[styles.authDesc, { color: theme.mutedForeground }]}>
          Para garantir a confiabilidade da comunidade, é necessário estar conectado para registrar
          relatos sobre o metrô.
        </Text>
        <View style={styles.authButtons}>
          <Button onPress={() => router.push('/login')}>Entrar com minha conta</Button>
          <Button variant="outline" onPress={() => router.push('/register')}>
            Criar conta gratuita
          </Button>
          {onCancel && (
            <Button variant="ghost" onPress={onCancel}>
              Voltar
            </Button>
          )}
        </View>
      </View>
    );
  }

  if (isSuccess) {
    return (
      <View style={[styles.card, styles.successCard, { backgroundColor: theme.card, borderColor: theme.statusNormal }]}>
        <PartyPopper size={48} color={theme.statusNormal} />
        <Text style={[styles.successTitle, { color: theme.text }]}>Relato registrado!</Text>
        <Text style={[styles.successSubtitle, { color: theme.mutedForeground }]}>
          Obrigado por ajudar outros passageiros a se locomover melhor.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.contentContainer}>
      <View style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.mainHeading, { color: theme.text }]}>
          Novo Relato de Metrô
        </Text>
        <Text style={[styles.subHeading, { color: theme.mutedForeground }]}>
          Compartilhe a situação do trem em tempo real com a comunidade.
        </Text>

        {serverError && <ErrorState message={serverError} />}

        {/* 1. Select Line */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.text }]}>Linha:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.linesRow}>
            {lines.map((l) => {
              const isSelected = l.id === selectedLineId;
              return (
                <Pressable
                  key={l.id}
                  onPress={() => handleLineChange(l.id)}
                  style={({ pressed }) => [
                    styles.lineChip,
                    {
                      backgroundColor: isSelected ? l.color : theme.backgroundElement,
                      borderColor: l.color,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.lineChipText,
                      { color: isSelected ? '#FFFFFF' : theme.text },
                    ]}>
                    {l.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* 2. Select Station */}
        <StationSelector
          stations={stations}
          value={selectedStationId}
          onChange={handleStationChange}
          error={formErrors.stationId}
          onLocateNearest={handleLocateNearest}
          isLocating={isLocating}
        />

        {/* 3. Select Direction (endpoints) */}
        {currentLine && currentLine.directions && currentLine.directions.length > 0 && (
          <DirectionSelector
            directions={currentLine.directions}
            value={selectedDirectionId}
            onChange={handleDirectionChange}
            error={formErrors.directionId}
          />
        )}

        {/* 4. Select Event Type */}
        <TypeSelector value={reportType} onChange={setReportType} />

        {/* 5. Optional Description */}
        <Input
          label="Observações (opcional)"
          placeholder="Ex: Plataforma cheia, ar condicionado desligado..."
          value={description}
          onChangeText={setDescription}
          maxLength={500}
        />

        {/* 6. Optional Geolocation Toggle */}
        <View style={styles.locationToggleRow}>
          <View style={styles.toggleTextContainer}>
            <Text style={[styles.toggleLabel, { color: theme.text }]}>
              Enviar coordenadas GPS aproximadas
            </Text>
            <Text style={[styles.toggleSub, { color: theme.mutedForeground }]}>
              Aumenta a confiabilidade do seu relato.
            </Text>
          </View>
          <Switch
            value={includeLocation}
            onValueChange={(val) => {
              setIncludeLocation(val);
              if (val && !location) {
                handleLocateNearest();
              }
            }}
          />
        </View>

        {/* Submit and Cancel Buttons */}
        <View style={styles.actionsRow}>
          <Button
            size="lg"
            loading={createReportMutation.isPending}
            onPress={handleSubmit}
            style={styles.submitBtn}>
            Publicar Relato
          </Button>

          {onCancel && (
            <Button
              variant="outline"
              size="lg"
              disabled={createReportMutation.isPending}
              onPress={onCancel}>
              Cancelar
            </Button>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.three,
    paddingBottom: Spacing.seven,
  },
  formCard: {
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.four,
  },
  mainHeading: {
    fontSize: Typography.heading.fontSize,
    fontWeight: Typography.heading.fontWeight,
  },
  subHeading: {
    fontSize: Typography.body.fontSize,
    marginTop: Spacing.half,
    marginBottom: Spacing.three,
  },
  section: {
    marginBottom: Spacing.three,
  },
  sectionLabel: {
    fontSize: Typography.bodyBold.fontSize,
    fontWeight: Typography.bodyBold.fontWeight,
    marginBottom: Spacing.one,
  },
  linesRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  lineChip: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.medium,
    borderWidth: 1.5,
    marginRight: Spacing.two,
  },
  lineChipText: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '700',
  },
  locationToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    marginBottom: Spacing.three,
  },
  toggleTextContainer: {
    flex: 1,
    marginRight: Spacing.two,
  },
  toggleLabel: {
    fontSize: Typography.body.fontSize,
    fontWeight: '600',
  },
  toggleSub: {
    fontSize: Typography.small.fontSize,
  },
  actionsRow: {
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  submitBtn: {
    width: '100%',
  },
  card: {
    padding: Spacing.four,
    borderRadius: Radius.large,
    borderWidth: 1,
    margin: Spacing.three,
  },
  authTitle: {
    fontSize: Typography.heading.fontSize,
    fontWeight: '700',
    marginBottom: Spacing.one,
  },
  authDesc: {
    fontSize: Typography.body.fontSize,
    marginBottom: Spacing.three,
    lineHeight: 22,
  },
  authButtons: {
    gap: Spacing.two,
  },
  successCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.six,
  },
  successIcon: {
    fontSize: 48,
    marginBottom: Spacing.two,
  },
  successTitle: {
    fontSize: Typography.heading.fontSize,
    fontWeight: '700',
  },
  successSubtitle: {
    fontSize: Typography.body.fontSize,
    marginTop: Spacing.one,
    textAlign: 'center',
  },
});
