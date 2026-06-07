import { execFileSync } from 'node:child_process';
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { homedir } from 'node:os';
import type { ChatExport, ChatMessage } from '../src/types';
import { DEFAULT_RELATIONSHIP } from '../src/lib/dates';
import { normalizeText, phraseMatchesForText } from '../src/lib/phrases';
import { enrichMessage, normalizeExport } from '../src/lib/metrics';
import { deriveStoryModel } from '../src/lib/story';
import { readPrivateConfig } from './env';
import { commandExists, sqliteJson, sqlString } from './sqlite';

interface WacrawlChatRow {
  jid: string;
  name: string;
}

interface WacrawlMessageRow {
  rowid: number;
  msg_id: string;
  ts: number;
  from_me: number;
  text: string;
  message_type: string;
  media_type: string;
  media_title: string;
  media_path: string;
  media_size: number;
}

interface BackupParseResult {
  inferredMeLabel: string;
  messages: ChatMessage[];
}

const args = new Set(process.argv.slice(2));
const skipSync = args.has('--skip-sync') || process.env.WACRAWL_SKIP_SYNC === '1';
const dbPath = resolvePath(process.env.WACRAWL_DB ?? '~/.wacrawl/wacrawl.db');
const outPath = resolve(process.env.BABE_EXPORT_PATH ?? 'public/data/babe-chat.json');
const publicOutPath = resolve(process.env.BABE_PUBLIC_EXPORT_PATH ?? 'public/published/babe-chat-public.json');
const mediaOutDir = resolve(process.env.BABE_MEDIA_DIR ?? 'public/private-media');
const archiveCachePath = resolve(process.env.BABE_ARCHIVE_CACHE_PATH ?? '.private/babe-chat-master.json');
const backupDir = resolve(process.env.BABE_BACKUP_DIR ?? 'chat_bk/WhatsApp Chat - Babe');
const backupTextPath = join(backupDir, '_chat.txt');
const backupLinkDir = join(mediaOutDir, 'chat_bk');

function resolvePath(value: string): string {
  if (value === '~') return homedir();
  if (value.startsWith('~/')) return join(homedir(), value.slice(2));
  return resolve(value);
}

function installHint(): string {
  return [
    'wacrawl is required for private export.',
    'Install it with:',
    '  brew install steipete/tap/wacrawl',
    'or:',
    '  go install github.com/steipete/wacrawl/cmd/wacrawl@latest',
  ].join('\n');
}

function syncWacrawl(): void {
  if (skipSync) return;
  if (!commandExists('wacrawl')) {
    throw new Error(installHint());
  }
  execFileSync('wacrawl', ['sync', '--copy-media'], { stdio: 'inherit' });
}

function ensureBackupMediaLink(): boolean {
  if (!existsSync(backupDir)) return false;

  mkdirSync(mediaOutDir, { recursive: true });
  if (existsSync(backupLinkDir) || lstatSafe(backupLinkDir)) {
    rmSync(backupLinkDir, { recursive: true, force: true });
  }

  const relativeTarget = resolve(backupDir);
  symlinkSync(relativeTarget, backupLinkDir, 'dir');
  return true;
}

function lstatSafe(path: string): boolean {
  try {
    lstatSync(path);
    return true;
  } catch {
    return false;
  }
}

function cleanLine(line: string): string {
  return line.replace(/\u200e/g, '').trim();
}

function offsetMinutesForZone(utcMs: number, timezone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'shortOffset',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(utcMs));
  const zoneName = parts.find((part) => part.type === 'timeZoneName')?.value ?? 'GMT';
  const match = zoneName.match(/^GMT([+-])(\d{1,2})(?::(\d{2}))?$/);
  if (!match) return 0;

  const sign = match[1] === '+' ? 1 : -1;
  const hours = Number(match[2]);
  const minutes = Number(match[3] ?? 0);
  return sign * (hours * 60 + minutes);
}

function parseBackupDate(match: RegExpMatchArray, timezone: string): number {
  const day = Number(match[1]);
  const month = Number(match[2]);
  const rawYear = Number(match[3]);
  const year = rawYear < 100 ? 2000 + rawYear : rawYear;
  let hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6] || 0);
  const ampm = match[7]?.toUpperCase();

  if (ampm === 'PM' && hour < 12) hour += 12;
  if (ampm === 'AM' && hour === 12) hour = 0;

  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second);
  return utcGuess - offsetMinutesForZone(utcGuess, timezone) * 60_000;
}

function detectAttachment(text: string): { fileName: string; mediaType: string } | null {
  const attached = text.match(/<attached:\s*([^>]+)>/i);
  const fileName = attached?.[1]?.trim();
  if (!fileName) return null;

  const lower = fileName.toLowerCase();
  const mediaType =
    lower.includes('-photo-') || /\.(jpe?g|png)$/i.test(lower)
      ? 'photo'
      : lower.includes('-video-') || /\.(mp4|mov)$/i.test(lower)
        ? 'video'
        : lower.includes('-audio-') || /\.opus$/i.test(lower)
          ? 'audio'
          : lower.includes('-sticker-') || /\.webp$/i.test(lower)
            ? 'sticker'
            : lower.includes('-gif-')
              ? 'gif'
              : lower.endsWith('.pdf')
                ? 'document'
                : lower.endsWith('.vcf')
                  ? 'contact'
                  : lower.endsWith('.xlsx')
                    ? 'spreadsheet'
                    : 'media';

  return { fileName, mediaType };
}

function backupMediaWebPath(fileName: string): string {
  return `private-media/chat_bk/${encodeURIComponent(fileName)}`;
}

function parseBackupMessages(chatSourceName: string, chatDisplayName: string, meDisplayName: string, relationship = DEFAULT_RELATIONSHIP): BackupParseResult | null {
  if (!existsSync(backupTextPath)) return null;

  const lines = readFileSync(backupTextPath, 'utf8').split(/\r?\n/);
  const pattern = /^\[?(\d{1,2})\/(\d{1,2})\/(\d{2,4}),?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AP]M)?\]?\s*-?\s*([^:]+):\s?(.*)$/i;
  const senders = new Map<string, number>();
  const rawMessages: Array<{ sender: string; ts: number; text: string }> = [];
  let current: { sender: string; ts: number; text: string } | null = null;

  for (const rawLine of lines) {
    const line = cleanLine(rawLine);
    if (!line) continue;

    const match = line.match(pattern);
    if (match) {
      current = {
        sender: match[8].trim(),
        ts: parseBackupDate(match, relationship.timezone),
        text: match[9] ?? '',
      };
      rawMessages.push(current);
      senders.set(current.sender, (senders.get(current.sender) ?? 0) + 1);
      continue;
    }

    if (current) {
      current.text += `\n${line}`;
    }
  }

  const inferredMeLabel =
    [...senders.entries()].find(([sender]) => sender !== chatSourceName)?.[0] ??
    [...senders.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ??
    meDisplayName;

  const messages = rawMessages.map((message, index) => {
    const attachment = detectAttachment(message.text);
    const fromMe = message.sender !== chatSourceName && message.sender === inferredMeLabel;
    const mediaPath = attachment ? backupMediaWebPath(attachment.fileName) : '';
    return enrichMessage(
      {
        id: `backup-${index + 1}`,
        ts: Math.floor(message.ts / 1000),
        fromMe,
        senderLabel: fromMe ? meDisplayName : chatDisplayName,
        text: message.text.replace(/\s*<attached:[^>]+>/gi, '').trim(),
        type: attachment?.mediaType || 'text',
        mediaType: attachment?.mediaType || '',
        mediaPath,
        mediaTitle: attachment?.fileName || '',
        mediaSize: 0,
        phraseMatches: phraseMatchesForText(message.text),
      },
      relationship,
    );
  });

  return { inferredMeLabel, messages };
}

function readWacrawlMessages(chatJid: string, chatDisplayName: string, meDisplayName: string, relationship = DEFAULT_RELATIONSHIP): ChatMessage[] {
  if (!existsSync(dbPath)) return [];

  const rows = sqliteJson<WacrawlChatRow>(
    dbPath,
    `select jid, coalesce(name, '') as name
     from chats
     where jid = ${sqlString(chatJid)}
     limit 1;`,
  );

  if (!rows[0]) return [];

  const messageRows = sqliteJson<WacrawlMessageRow>(
    dbPath,
    `select rowid, msg_id, ts, from_me, coalesce(text, '') as text,
            coalesce(message_type, '') as message_type, coalesce(media_type, '') as media_type,
            coalesce(media_title, '') as media_title, coalesce(media_path, '') as media_path,
            coalesce(media_size, 0) as media_size
     from messages
     where chat_jid = ${sqlString(chatJid)}
     order by ts asc, rowid asc;`,
  );

  return messageRows.map((row) =>
    enrichMessage(
      {
        id: `wacrawl-${row.rowid}-${row.msg_id || 'message'}`,
        ts: Number(row.ts),
        fromMe: Number(row.from_me) === 1,
        senderLabel: Number(row.from_me) === 1 ? meDisplayName : chatDisplayName,
        text: row.text ?? '',
        type: normalizeWacrawlType(row.message_type || row.media_type || 'text'),
        mediaType: normalizeWacrawlType(row.media_type),
        mediaPath: '',
        mediaTitle: row.media_title ?? '',
        mediaSize: Number(row.media_size ?? 0),
      },
      relationship,
    ),
  );
}

function normalizeWacrawlType(type: string): string {
  const lower = type.toLowerCase();
  if (!lower) return '';
  if (lower.includes('image')) return 'photo';
  if (lower.includes('sticker')) return 'sticker';
  if (lower.includes('video')) return 'video';
  if (lower.includes('audio') || lower.includes('voice')) return 'audio';
  if (lower.includes('gif')) return 'gif';
  if (lower.includes('document')) return 'document';
  return lower;
}

function messageBaseSignature(message: ChatMessage): string {
  const normalizedBody = normalizeText(message.text || '');
  const title = normalizeText(message.mediaTitle || '');
  return [
    message.day,
    message.fromMe ? 'me' : 'them',
    message.type || 'text',
    message.mediaType || '',
    normalizedBody,
    title,
  ].join('|');
}

function messageRichness(message: ChatMessage): number {
  return [
    message.text.trim().length,
    message.mediaPath ? 20 : 0,
    message.mediaTitle ? 10 : 0,
    message.mediaSize > 0 ? 5 : 0,
  ].reduce((total, value) => total + value, 0);
}

function pickPreferredMessage(current: ChatMessage, candidate: ChatMessage): ChatMessage {
  const currentScore = messageRichness(current);
  const candidateScore = messageRichness(candidate);
  if (candidateScore > currentScore) return candidate;
  if (candidateScore < currentScore) return current;

  const currentIsBackup = current.id.startsWith('backup-');
  const candidateIsBackup = candidate.id.startsWith('backup-');
  if (candidateIsBackup && !currentIsBackup) return candidate;
  if (currentIsBackup && !candidateIsBackup) return current;
  return current;
}

function loadExistingArchiveCache(): ChatMessage[] {
  if (!existsSync(archiveCachePath)) return [];
  const existing = JSON.parse(readFileSync(archiveCachePath, 'utf8')) as ChatExport;
  const normalized = normalizeExport(existing);
  return normalized.messages;
}

function mergeMessages(sources: ChatMessage[][]): { messages: ChatMessage[]; mergedExtraCount: number } {
  const deduped = new Map<string, ChatMessage>();
  let mergedExtraCount = 0;

  for (const [sourceIndex, sourceMessages] of sources.entries()) {
    const occurrences = new Map<string, number>();
    for (const message of sourceMessages) {
      const baseKey = messageBaseSignature(message);
      const occurrence = (occurrences.get(baseKey) ?? 0) + 1;
      occurrences.set(baseKey, occurrence);
      const key = `${baseKey}#${occurrence}`;
      const existing = deduped.get(key);
      if (!existing) {
        deduped.set(key, message);
        if (sourceIndex > 0) mergedExtraCount += 1;
        continue;
      }
      deduped.set(key, pickPreferredMessage(existing, message));
    }
  }

  const messages = [...deduped.values()].sort((left, right) => {
    if (left.ts !== right.ts) return left.ts - right.ts;
    if (left.fromMe !== right.fromMe) return Number(left.fromMe) - Number(right.fromMe);
    return left.id.localeCompare(right.id);
  });

  return { messages, mergedExtraCount };
}

function buildChatExport(): ChatExport {
  const config = readPrivateConfig();
  const relationship = {
    ...DEFAULT_RELATIONSHIP,
    timezone: config.timezone,
  };

  const backupLinked = ensureBackupMediaLink();
  const backup = parseBackupMessages(config.chatSourceName, config.chatDisplayName, config.meDisplayName, relationship);
  const cacheMessages = loadExistingArchiveCache();
  const wacrawlMessages = readWacrawlMessages(config.chatJid, config.chatDisplayName, config.meDisplayName, relationship);

  if (!backup && cacheMessages.length === 0 && wacrawlMessages.length === 0) {
    throw new Error('No private source was found. Expected chat_bk backup, a local archive cache, or a wacrawl archive.');
  }

  const merged = mergeMessages([
    backup?.messages ?? [],
    cacheMessages,
    wacrawlMessages,
  ]);
  const participantLabels = {
    me: config.meDisplayName,
    them: config.chatDisplayName,
  };
  const archivePrimarySource = backup ? (cacheMessages.length > 0 || wacrawlMessages.length > 0 ? 'hybrid' : 'backup') : cacheMessages.length > 0 ? 'hybrid' : 'wacrawl';

  const normalized = normalizeExport({
    chat: {
      jid: config.chatJid,
      name: config.chatDisplayName,
      phone: config.chatPhone,
      exportedAt: new Date().toISOString(),
      messageCount: merged.messages.length,
      storyBrand: config.storyBrand,
      authorSignature: config.authorSignature,
      participantLabels,
      archive: {
        primarySource: archivePrimarySource,
        backupFound: backupLinked && Boolean(backup),
        backupMessageCount: backup?.messages.length ?? 0,
        wacrawlMessageCount: wacrawlMessages.length,
        mergedExtraCount: merged.mergedExtraCount,
      },
      dateRange: {
        start: merged.messages[0]?.day ?? '',
        end: merged.messages[merged.messages.length - 1]?.day ?? '',
      },
    },
    relationship,
    messages: merged.messages,
    metrics: {} as ChatExport['metrics'],
  });

  normalized.chat.messageCount = normalized.messages.length;
  normalized.chat.participantLabels = participantLabels;
  return normalized;
}

function buildPublishedSummary(exportData: ChatExport): ChatExport {
  const story = deriveStoryModel(exportData);
  return {
    chat: {
      ...exportData.chat,
      jid: 'published-story',
      phone: '',
    },
    relationship: exportData.relationship,
    messages: [],
    metrics: {
      ...exportData.metrics,
      firstTeAmo: exportData.metrics.firstTeAmo
        ? {
            ...exportData.metrics.firstTeAmo,
            messageId: 'published-first-te-amo',
            text: '',
          }
        : null,
    },
    story: {
      ...story,
      moments: story.moments.map((moment) => ({
        ...moment,
        text:
          moment.label === 'Primer te amo'
            ? 'La primera vez que eso quedo por escrito.'
            : moment.label === 'Primer mensaje guardado'
              ? 'El inicio de esta historia.'
              : moment.label === 'Primera foto guardada'
                ? 'Uno de los primeros recuerdos que quedo guardado.'
                : moment.label === 'Primera nota de voz'
                  ? 'Una voz que tambien forma parte de la historia.'
                  : 'La historia sigue viva.',
      })),
    },
  } as ChatExport;
}

function attachStorySnapshot(exportData: ChatExport): ChatExport {
  return {
    ...exportData,
    story: deriveStoryModel(exportData),
  };
}

function main(): void {
  if (!commandExists('sqlite3')) {
    throw new Error('sqlite3 CLI is required to read the local WhatsApp archives.');
  }

  syncWacrawl();
  const exportData = attachStorySnapshot(buildChatExport());
  const publicSummary = buildPublishedSummary(exportData);

  mkdirSync(resolve('.private'), { recursive: true });
  mkdirSync(resolve('public/data'), { recursive: true });
  mkdirSync(resolve('public/published'), { recursive: true });
  writeFileSync(archiveCachePath, `${JSON.stringify(exportData, null, 2)}\n`);
  writeFileSync(outPath, `${JSON.stringify(exportData, null, 2)}\n`);
  writeFileSync(publicOutPath, `${JSON.stringify(publicSummary, null, 2)}\n`);

  const archive = exportData.chat.archive;
  console.log(`Exported ${exportData.messages.length} story messages to ${outPath}.`);
  console.log(`Published safe summary to ${publicOutPath}.`);
  console.log(`Updated local archive cache at ${archiveCachePath}.`);
  if (archive) {
    console.log(
      `Source: ${archive.primarySource} (backup=${archive.backupMessageCount}, wacrawl=${archive.wacrawlMessageCount}, extras=${archive.mergedExtraCount}).`,
    );
  }
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
