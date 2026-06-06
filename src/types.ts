export type SenderKey = 'me' | 'them';

export interface ChatSummary {
  jid: string;
  name: string;
  phone: string;
  exportedAt: string;
  messageCount: number;
  authorSignature?: string;
  participantLabels?: {
    me: string;
    them: string;
  };
  archive?: {
    primarySource: 'backup' | 'wacrawl' | 'hybrid';
    backupFound: boolean;
    backupMessageCount: number;
    wacrawlMessageCount: number;
    mergedExtraCount: number;
  };
  dateRange: {
    start: string;
    end: string;
  };
}

export interface RelationshipPhase {
  id: 'before' | 'courting' | 'official';
  label: string;
  start: string;
  end: string | null;
}

export interface RelationshipConfig {
  timezone: string;
  milestones: {
    courtingStarted: string;
    officialStarted: string;
  };
  phases: RelationshipPhase[];
}

export interface PhraseMatch {
  phrase: 'te amo';
  count: number;
}

export interface ChatMessage {
  id: string;
  ts: number;
  day: string;
  phaseId: RelationshipPhase['id'];
  fromMe: boolean;
  senderLabel: string;
  text: string;
  type: string;
  mediaType: string;
  mediaPath: string;
  mediaTitle: string;
  mediaSize: number;
  phraseMatches: PhraseMatch[];
}

export interface SenderMetric {
  label: string;
  messages: number;
  textMessages: number;
  mediaMessages: number;
  imageMessages: number;
  teAmoCount: number;
}

export interface DailyMetric {
  day: string;
  total: number;
  fromMe: number;
  fromThem: number;
  media: number;
  phaseId: RelationshipPhase['id'];
}

export interface PhaseMetric {
  phaseId: RelationshipPhase['id'];
  label: string;
  total: number;
  fromMe: number;
  fromThem: number;
  teAmoCount: number;
}

export interface FirstPhraseMetric {
  messageId: string;
  ts: number;
  day: string;
  fromMe: boolean;
  senderLabel: string;
  text: string;
}

export interface ChatMetrics {
  totals: {
    messages: number;
    textMessages: number;
    mediaMessages: number;
    imageMessages: number;
    teAmoCount: number;
    activeDays: number;
  };
  bySender: Record<SenderKey, SenderMetric>;
  daily: DailyMetric[];
  phases: PhaseMetric[];
  mediaByType: Record<string, number>;
  firstTeAmo: FirstPhraseMetric | null;
}

export interface ChatExport {
  chat: ChatSummary;
  relationship: RelationshipConfig;
  messages: ChatMessage[];
  metrics: ChatMetrics;
}

export interface LoadedChatExport extends ChatExport {
  source: 'private' | 'demo';
}
