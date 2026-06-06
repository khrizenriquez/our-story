import type { PhraseMatch } from '../types';

const DIACRITICS_PATTERN = /[\u0300-\u036f]/g;
const WORD_SEPARATOR_PATTERN = /[^\p{L}\p{N}]+/gu;
const TE_AMO_PATTERN = /\bte+\s+a+m+o+\b/gu;

export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(DIACRITICS_PATTERN, '')
    .toLocaleLowerCase('es-GT')
    .replace(WORD_SEPARATOR_PATTERN, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function countTeAmo(value: string): number {
  if (!value) return 0;
  const normalized = normalizeText(value);
  return Array.from(normalized.matchAll(TE_AMO_PATTERN)).length;
}

export function phraseMatchesForText(value: string): PhraseMatch[] {
  const count = countTeAmo(value);
  return count > 0 ? [{ phrase: 'te amo', count }] : [];
}
