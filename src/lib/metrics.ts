import type {
  ChatExport,
  ChatMessage,
  ChatMetrics,
  DailyMetric,
  PhaseMetric,
  RelationshipConfig,
  SenderKey,
  SenderMetric,
} from '../types';
import { DEFAULT_RELATIONSHIP, phaseForDay, timestampToDay } from './dates';
import { phraseMatchesForText } from './phrases';

const DEFAULT_ME_LABEL = 'Yo';
const DEFAULT_THEM_LABEL = 'La otra persona';

function resolveSenderLabels(messages: ChatMessage[], participantLabels?: { me: string; them: string }) {
  const firstMe = messages.find((message) => message.fromMe && message.senderLabel)?.senderLabel;
  const firstThem = messages.find((message) => !message.fromMe && message.senderLabel)?.senderLabel;
  return {
    me: participantLabels?.me || firstMe || DEFAULT_ME_LABEL,
    them: participantLabels?.them || firstThem || DEFAULT_THEM_LABEL,
  };
}

export function enrichMessage(
  message: Omit<ChatMessage, 'day' | 'phaseId' | 'phraseMatches'> & Partial<Pick<ChatMessage, 'day' | 'phaseId' | 'phraseMatches'>>,
  relationship: RelationshipConfig = DEFAULT_RELATIONSHIP,
): ChatMessage {
  const day = message.day ?? timestampToDay(message.ts, relationship.timezone);
  return {
    ...message,
    senderLabel: message.senderLabel || (message.fromMe ? DEFAULT_ME_LABEL : DEFAULT_THEM_LABEL),
    text: message.text ?? '',
    type: message.type || 'text',
    mediaType: message.mediaType || '',
    mediaPath: message.mediaPath || '',
    mediaTitle: message.mediaTitle || '',
    mediaSize: message.mediaSize || 0,
    day,
    phaseId: message.phaseId ?? phaseForDay(day, relationship).id,
    phraseMatches: message.phraseMatches ?? phraseMatchesForText(message.text ?? ''),
  };
}

export function normalizeExport(input: ChatExport): ChatExport {
  const relationship = input.relationship ?? DEFAULT_RELATIONSHIP;
  const messages = input.messages.map((message) => enrichMessage(message, relationship));
  const participantLabels = input.chat.participantLabels ?? resolveSenderLabels(messages);
  return {
    ...input,
    chat: {
      ...input.chat,
      participantLabels,
    },
    relationship,
    messages,
    metrics: calculateMetrics(messages, relationship, participantLabels),
  };
}

export function calculateMetrics(
  messages: ChatMessage[],
  relationship: RelationshipConfig = DEFAULT_RELATIONSHIP,
  participantLabels?: { me: string; them: string },
): ChatMetrics {
  const labels = resolveSenderLabels(messages, participantLabels);
  const senderTemplate = (label: string): SenderMetric => ({
    label,
    messages: 0,
    textMessages: 0,
    mediaMessages: 0,
    imageMessages: 0,
    teAmoCount: 0,
  });

  const bySender: Record<SenderKey, SenderMetric> = {
    me: senderTemplate(labels.me),
    them: senderTemplate(labels.them),
  };
  const dailyMap = new Map<string, DailyMetric>();
  const phaseMap = new Map<string, PhaseMetric>(
    relationship.phases.map((phase) => [
      phase.id,
      { phaseId: phase.id, label: phase.label, total: 0, fromMe: 0, fromThem: 0, teAmoCount: 0 },
    ]),
  );
  const mediaByType: Record<string, number> = {};
  let firstTeAmo: ChatMetrics['firstTeAmo'] = null;

  for (const message of messages) {
    const senderKey: SenderKey = message.fromMe ? 'me' : 'them';
    const sender = bySender[senderKey];
    const teAmoCount = message.phraseMatches.reduce((total, match) => total + match.count, 0);
    const hasMedia = Boolean(message.mediaType || message.mediaPath);
    const isImage = message.mediaType.toLowerCase().includes('image') || message.type.toLowerCase().includes('image');

    sender.messages += 1;
    sender.textMessages += message.text.trim() ? 1 : 0;
    sender.mediaMessages += hasMedia ? 1 : 0;
    sender.imageMessages += isImage ? 1 : 0;
    sender.teAmoCount += teAmoCount;

    const daily = dailyMap.get(message.day) ?? {
      day: message.day,
      total: 0,
      fromMe: 0,
      fromThem: 0,
      media: 0,
      phaseId: message.phaseId,
    };
    daily.total += 1;
    daily.fromMe += message.fromMe ? 1 : 0;
    daily.fromThem += message.fromMe ? 0 : 1;
    daily.media += hasMedia ? 1 : 0;
    daily.phaseId = message.phaseId;
    dailyMap.set(message.day, daily);

    const phase = phaseMap.get(message.phaseId);
    if (phase) {
      phase.total += 1;
      phase.fromMe += message.fromMe ? 1 : 0;
      phase.fromThem += message.fromMe ? 0 : 1;
      phase.teAmoCount += teAmoCount;
    }

    if (hasMedia) {
      const key = message.mediaType || 'media';
      mediaByType[key] = (mediaByType[key] ?? 0) + 1;
    }

    if (teAmoCount > 0 && firstTeAmo === null) {
      firstTeAmo = {
        messageId: message.id,
        ts: message.ts,
        day: message.day,
        fromMe: message.fromMe,
        senderLabel: message.senderLabel,
        text: message.text,
      };
    }
  }

  const daily = Array.from(dailyMap.values()).sort((a, b) => a.day.localeCompare(b.day));
  const phases = Array.from(phaseMap.values());

  return {
    totals: {
      messages: messages.length,
      textMessages: bySender.me.textMessages + bySender.them.textMessages,
      mediaMessages: bySender.me.mediaMessages + bySender.them.mediaMessages,
      imageMessages: bySender.me.imageMessages + bySender.them.imageMessages,
      teAmoCount: bySender.me.teAmoCount + bySender.them.teAmoCount,
      activeDays: daily.length,
    },
    bySender,
    daily,
    phases,
    mediaByType,
    firstTeAmo,
  };
}
