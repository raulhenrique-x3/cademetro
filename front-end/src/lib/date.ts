/**
 * Format ISO date string into human-friendly relative time in Portuguese.
 */
export function formatTimeAgo(isoString?: string | null): string {
  if (!isoString) return 'Sem registros recentes';

  try {
    // Backend emits Postgres format ("YYYY-MM-DD HH:mm:ss.SSS+00"): space
    // separator and bare-hour offset. JS parsers need ISO 8601, so normalize
    // both ("+00" -> "+00:00").
    const date = new Date(isoString.replace(' ', 'T').replace(/([+-]\d{2})$/, '$1:00'));
    if (isNaN(date.getTime())) return 'horário indisponível';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);

    if (diffSec < 45) return 'agora mesmo';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `há ${diffMin} min`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `há ${diffHour} h`;
    const diffDays = Math.floor(diffHour / 24);
    return `há ${diffDays} d`;
  } catch {
    return 'horário indisponível';
  }
}

export function formatTimeShort(isoString?: string | null): string {
  if (!isoString) return '';
  try {
    const date = new Date(isoString.replace(' ', 'T').replace(/([+-]\d{2})$/, '$1:00'));
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}
