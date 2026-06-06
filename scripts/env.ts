import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface PrivateConfig {
  chatJid: string;
  chatSourceName: string;
  chatDisplayName: string;
  chatPhone: string;
  meDisplayName: string;
  authorSignature: string;
  timezone: string;
}

export function loadLocalEnv(root = process.cwd()): void {
  const envPath = join(root, '.env.local');
  if (!existsSync(envPath)) return;

  const lines = readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separator = trimmed.indexOf('=');
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

export function readPrivateConfig(): PrivateConfig {
  loadLocalEnv();
  const chatJid = process.env.BABE_CHAT_JID ?? '';
  if (!chatJid) {
    throw new Error('Missing BABE_CHAT_JID in .env.local.');
  }

  return {
    chatJid,
    chatSourceName: process.env.BABE_CHAT_NAME ?? 'Babe',
    chatDisplayName: process.env.BABE_DISPLAY_NAME ?? process.env.BABE_CHAT_NAME ?? 'Patty',
    chatPhone: process.env.BABE_CHAT_PHONE ?? '',
    meDisplayName: process.env.ME_DISPLAY_NAME ?? 'Chris',
    authorSignature: process.env.AUTHOR_SIGNATURE ?? 'Christofer Enríquez',
    timezone: process.env.WHATSAPP_TIMEZONE ?? 'America/Guatemala',
  };
}
