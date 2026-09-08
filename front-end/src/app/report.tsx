import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenShell } from '@/components/layout/screen-shell';
import { ReportComposer } from '@/features/reports/components/report-composer';

export default function ReportScreen() {
  const params = useLocalSearchParams<{ lineId?: string; stationId?: string }>();
  const router = useRouter();

  const lineId = params.lineId ? parseInt(params.lineId, 10) : undefined;
  const stationId = params.stationId ? parseInt(params.stationId, 10) : undefined;

  return (
    <ScreenShell title="Reportar Trem" showBack scrollable={false} showBottomNav={false}>
      <ReportComposer
        initialLineId={lineId}
        initialStationId={stationId}
        onSuccess={() => router.push('/')}
        onCancel={() => router.back()}
      />
    </ScreenShell>
  );
}
