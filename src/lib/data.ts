import type { ChatExport, LoadedChatExport } from '../types';
import { normalizeExport } from './metrics';

const BASE_URL = import.meta.env.BASE_URL;

async function fetchJson(path: string): Promise<ChatExport | null> {
  const response = await fetch(`${BASE_URL}${path}`, { cache: 'no-store' });
  if (!response.ok) return null;
  return response.json() as Promise<ChatExport>;
}

export async function loadChatExport(): Promise<LoadedChatExport> {
  const privateExport = await fetchJson('data/babe-chat.json').catch(() => null);
  if (privateExport) {
    return { ...normalizeExport(privateExport), source: 'private' };
  }

  const publicExport = await fetchJson('published/babe-chat-public.json').catch(() => null);
  if (publicExport) {
    return { ...normalizeExport(publicExport), source: 'public' };
  }

  const demoExport = await fetchJson('demo/babe-chat-demo.json');
  if (!demoExport) {
    throw new Error('No se pudo cargar la data de demo.');
  }
  return { ...normalizeExport(demoExport), source: 'demo' };
}
