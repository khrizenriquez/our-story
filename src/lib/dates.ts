import type { RelationshipConfig, RelationshipPhase } from '../types';

export const DEFAULT_TIMEZONE = 'America/Guatemala';

export const DEFAULT_RELATIONSHIP: RelationshipConfig = {
  timezone: DEFAULT_TIMEZONE,
  milestones: {
    courtingStarted: '2025-12-27',
    officialStarted: '2026-02-08',
  },
  phases: [
    {
      id: 'before',
      label: 'Antes de pretenderla',
      start: '0000-01-01',
      end: '2025-12-26',
    },
    {
      id: 'courting',
      label: 'Pretendiendola',
      start: '2025-12-27',
      end: '2026-02-07',
    },
    {
      id: 'official',
      label: 'Novios',
      start: '2026-02-08',
      end: null,
    },
  ],
};

export function timestampToDate(ts: number): Date {
  return new Date(ts > 1_000_000_000_000 ? ts : ts * 1000);
}

export function timestampToDay(ts: number, timezone = DEFAULT_TIMEZONE): string {
  const date = timestampToDate(ts);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${lookup.year}-${lookup.month}-${lookup.day}`;
}

export function timestampToDisplay(ts: number, timezone = DEFAULT_TIMEZONE): string {
  return new Intl.DateTimeFormat('es-GT', {
    timeZone: timezone,
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(timestampToDate(ts));
}

export function phaseForDay(day: string, relationship = DEFAULT_RELATIONSHIP): RelationshipPhase {
  const phase = relationship.phases.find((item) => {
    const starts = day >= item.start;
    const ends = item.end === null || day <= item.end;
    return starts && ends;
  });

  return phase ?? relationship.phases[0];
}
