import type { ChatExport, ChatMessage } from '../types';
import { normalizeText } from './phrases';

export interface StoryChapter {
  id: string;
  label: string;
  range: string;
  messages: number;
  summary: string;
}

export interface StoryMoment {
  label: string;
  detail: string;
  ts: number;
  text: string;
  senderLabel: string;
}

export interface StoryMediaCard {
  label: string;
  count: number;
  tone: string;
}

export interface StoryImage {
  src: string;
  alt: string;
  messageId: string;
}

export interface StoryModel {
  meLabel: string;
  themLabel: string;
  poeticTitle: string;
  subtitle: string;
  totalSpanDays: number;
  activeDays: number;
  messageLeadLabel: string;
  messageLeadPercent: number;
  messageLeadSentence: string;
  wordsBySender: Array<{ label: string; value: number }>;
  yearlyCounts: Array<{ year: string; count: number }>;
  monthlyCounts: Array<{ month: string; count: number }>;
  chapters: StoryChapter[];
  gallery: StoryImage[];
  heroImages: StoryImage[];
  moments: StoryMoment[];
  topDay: { day: string; count: number } | null;
  mediaCards: StoryMediaCard[];
  firstMeaningful: StoryMoment | null;
}

function isMeaningful(message: ChatMessage): boolean {
  const text = normalizeText(message.text);
  if (!text) return Boolean(message.mediaPath);
  return !text.includes('this message was deleted') && !text.includes('messages and calls are end to end encrypted');
}

function isStoryworthyText(message: ChatMessage): boolean {
  const raw = message.text.trim();
  if (!raw) return false;
  if (raw.length > 180) return false;
  if (raw.split('\n').length > 2) return false;
  if (/^\d[\d\s+\-()]{6,}/.test(raw)) return false;
  if (/\.(jpg|jpeg|png|gif|mp4|mov|opus|mp3|pdf)$/i.test(raw)) return false;
  return /[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(raw);
}

function approximateWordCount(message: ChatMessage): number {
  return normalizeText(message.text).split(' ').filter(Boolean).length;
}

function summarizeYear(year: string, count: number): string {
  if (year === '2020') return `${count} primeros rastros de la conversacion.`;
  if (year === '2022') return `${count} mensajes cuando la historia empezo a tomar forma.`;
  if (year === '2023') return `${count} momentos en los que hablarse ya era parte del dia a dia.`;
  if (year === '2024') return `${count} mensajes para seguir cerca durante todo el anio.`;
  if (year === '2025') return `${count} mensajes en un tramo que fue agarrando mas ritmo.`;
  if (year === '2026') return `${count} mensajes en la etapa mas intensa de la conversacion.`;
  return `${count} mensajes compartidos en ${year}.`;
}

function evenlySample<T>(items: T[], count: number): T[] {
  if (items.length <= count) return items;
  const result: T[] = [];
  for (let index = 0; index < count; index += 1) {
    const ratio = index / Math.max(count - 1, 1);
    result.push(items[Math.round(ratio * (items.length - 1))]);
  }
  return result;
}

function normalizeMediaKey(type: string): string {
  if (type === 'photo' || type === 'image') return 'photo';
  if (type === 'video' || type === 'gif') return 'video';
  if (type === 'audio') return 'audio';
  if (type === 'sticker') return 'sticker';
  if (type === 'document') return 'document';
  return type || 'media';
}

function fallbackMomentText(message: ChatMessage): string {
  const mediaKey = normalizeMediaKey(message.mediaType);
  if (mediaKey === 'photo') return 'Una foto que quedo guardada entre ustedes.';
  if (mediaKey === 'audio') return 'Una nota de voz que todavia alcanza a contar algo.';
  if (mediaKey === 'video') return 'Un video compartido en medio de la historia.';
  if (mediaKey === 'sticker') return 'Un sticker que tambien hizo su parte.';
  if (mediaKey === 'document') return 'Algo importante tambien paso por aqui.';
  return 'Un pedacito de conversacion que sigue formando parte de la historia.';
}

function makeMoment(label: string, detail: string, message: ChatMessage | null): StoryMoment | null {
  if (!message) return null;
  const text = isStoryworthyText(message) ? message.text.replace(/\s+/g, ' ').trim() : fallbackMomentText(message);
  return {
    label,
    detail,
    ts: message.ts,
    text,
    senderLabel: message.senderLabel,
  };
}

export function deriveStoryModel(data: ChatExport): StoryModel {
  const meLabel = data.chat.participantLabels?.me || 'Chris';
  const themLabel = data.chat.participantLabels?.them || data.chat.name;
  const meaningfulMessages = data.messages.filter(isMeaningful);
  const firstMeaningfulMessage = meaningfulMessages.find(isStoryworthyText) ?? meaningfulMessages[0] ?? data.messages[0] ?? null;
  const lastMeaningfulMessage = [...meaningfulMessages].reverse().find(isStoryworthyText) ?? [...meaningfulMessages].reverse().find(Boolean) ?? data.messages[data.messages.length - 1] ?? null;
  const firstPhotoMessage = meaningfulMessages.find((message) => normalizeMediaKey(message.mediaType) === 'photo' && message.mediaPath) ?? null;
  const firstAudioMessage = meaningfulMessages.find((message) => normalizeMediaKey(message.mediaType) === 'audio') ?? null;

  const dayCounts = new Map<string, number>();
  const monthCounts = new Map<string, number>();
  const yearCounts = new Map<string, number>();
  const wordsBySender = new Map<string, number>();
  const mediaCounts = new Map<string, number>();

  for (const message of meaningfulMessages) {
    dayCounts.set(message.day, (dayCounts.get(message.day) ?? 0) + 1);
    const month = message.day.slice(0, 7);
    monthCounts.set(month, (monthCounts.get(month) ?? 0) + 1);
    const year = message.day.slice(0, 4);
    yearCounts.set(year, (yearCounts.get(year) ?? 0) + 1);
    wordsBySender.set(message.senderLabel, (wordsBySender.get(message.senderLabel) ?? 0) + approximateWordCount(message));
    if (message.mediaType || message.mediaPath) {
      const key = normalizeMediaKey(message.mediaType);
      mediaCounts.set(key, (mediaCounts.get(key) ?? 0) + 1);
    }
  }

  const topDayEntry = [...dayCounts.entries()].sort((left, right) => right[1] - left[1])[0] ?? null;
  const topDay = topDayEntry ? { day: topDayEntry[0], count: topDayEntry[1] } : null;

  const firstTs = meaningfulMessages[0]?.ts ?? data.messages[0]?.ts ?? 0;
  const lastTs = meaningfulMessages[meaningfulMessages.length - 1]?.ts ?? data.messages[data.messages.length - 1]?.ts ?? 0;
  const totalSpanDays = firstTs && lastTs ? Math.floor((lastTs - firstTs) / 86400) + 1 : data.metrics.totals.activeDays;
  const meMessages = data.metrics.bySender.me.messages;
  const themMessages = data.metrics.bySender.them.messages;
  const leadIsMe = meMessages >= themMessages;
  const messageLeadLabel = leadIsMe ? meLabel : themLabel;
  const messageLeadPercent = Math.round((Math.abs(meMessages - themMessages) / Math.max(Math.min(meMessages, themMessages), 1)) * 100);
  const messageLeadSentence =
    meMessages === themMessages
      ? `${meLabel} y ${themLabel} se han escrito exactamente la misma cantidad de mensajes.`
      : `${messageLeadLabel} escribio ${messageLeadPercent}% mas mensajes que ${leadIsMe ? themLabel : meLabel}.`;

  const yearly = [...yearCounts.entries()].sort((left, right) => left[0].localeCompare(right[0]));
  const monthly = [...monthCounts.entries()].sort((left, right) => left[0].localeCompare(right[0]));
  const chapters = yearly.map(([year, count]) => ({
    id: year,
    label: year,
    range: year,
    messages: count,
    summary: summarizeYear(year, count),
  }));

  const photoMessages = meaningfulMessages.filter((message) => normalizeMediaKey(message.mediaType) === 'photo' && message.mediaPath);
  const gallery = evenlySample(photoMessages, 10).map((message, index) => ({
    src: message.mediaPath,
    alt: `Recuerdo ${index + 1}`,
    messageId: message.id,
  }));
  const heroImages = gallery.slice(0, 4);

  const firstTeAmoMessage =
    data.metrics.firstTeAmo ? data.messages.find((message) => message.id === data.metrics.firstTeAmo?.messageId) ?? null : null;

  const moments = [
    makeMoment('Primer mensaje guardado', 'La primera huella de esta conversacion que sigue viva aqui.', firstMeaningfulMessage),
    makeMoment('Primer te amo', 'La primera vez que quedo escrito.', firstTeAmoMessage),
    makeMoment('Primera foto guardada', 'Uno de los primeros recuerdos visuales.', firstPhotoMessage),
    makeMoment('Primera nota de voz', 'Una voz tambien cuenta la historia.', firstAudioMessage),
    makeMoment('Mensaje mas reciente', 'La historia sigue viva.', lastMeaningfulMessage),
  ].filter((moment): moment is StoryMoment => Boolean(moment));

  const mediaCards: StoryMediaCard[] = [
    { label: 'Fotos', count: mediaCounts.get('photo') ?? 0, tone: 'rose' },
    { label: 'Audios', count: mediaCounts.get('audio') ?? 0, tone: 'teal' },
    { label: 'Videos y gifs', count: (mediaCounts.get('video') ?? 0) + (mediaCounts.get('gif') ?? 0), tone: 'gold' },
    { label: 'Stickers', count: mediaCounts.get('sticker') ?? 0, tone: 'plum' },
  ];

  return {
    meLabel,
    themLabel,
    poeticTitle: 'Nuestra historia, la que se escribe día a día',
    subtitle: `${data.chat.dateRange.start} - ${data.chat.dateRange.end}`,
    totalSpanDays,
    activeDays: data.metrics.totals.activeDays,
    messageLeadLabel,
    messageLeadPercent,
    messageLeadSentence,
    wordsBySender: [...wordsBySender.entries()]
      .sort((left, right) => right[1] - left[1])
      .map(([label, value]) => ({ label, value })),
    yearlyCounts: yearly.map(([year, count]) => ({ year, count })),
    monthlyCounts: monthly.map(([month, count]) => ({ month, count })),
    chapters,
    gallery,
    heroImages,
    moments,
    topDay,
    mediaCards,
    firstMeaningful: moments[0] ?? null,
  };
}
