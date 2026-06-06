import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { ChatExport } from '../types';
import { DEFAULT_RELATIONSHIP } from '../lib/dates';
import { countTeAmo, normalizeText } from '../lib/phrases';
import { enrichMessage, normalizeExport } from '../lib/metrics';

function message(id: string, ts: number, fromMe: boolean, text: string, mediaType = '') {
  return enrichMessage(
    {
      id,
      ts,
      fromMe,
      senderLabel: fromMe ? 'Tu' : 'Ella',
      text,
      type: mediaType ? 'media' : 'text',
      mediaType,
      mediaPath: mediaType ? `private-media/${id}.jpg` : '',
      mediaTitle: '',
      mediaSize: mediaType ? 1024 : 0,
    },
    DEFAULT_RELATIONSHIP,
  );
}

function unix(value: string): number {
  return Math.floor(new Date(value).getTime() / 1000);
}

describe('phrase normalization', () => {
  it('normalizes accents, punctuation, casing, and repeated letters', () => {
    assert.equal(normalizeText('TE   amooo!!!'), 'te amooo');
    assert.equal(countTeAmo('Te amo. TE AMOOO, teee amoooo'), 3);
  });
});

describe('metrics', () => {
  it('counts senders, daily activity, phases, media, and first te amo', () => {
    const input: ChatExport = {
      chat: {
        jid: 'demo@s.whatsapp.net',
        name: 'Demo',
        phone: '',
        exportedAt: '2026-06-05T00:00:00.000Z',
        messageCount: 4,
        dateRange: { start: '2025-12-26', end: '2026-02-08' },
      },
      relationship: DEFAULT_RELATIONSHIP,
      messages: [
        message('1', unix('2025-12-26T12:00:00-06:00'), true, 'hola'),
        message('2', unix('2025-12-27T12:00:00-06:00'), false, 'Te amooo'),
        message('3', unix('2026-02-01T12:00:00-06:00'), true, 'foto', 'image'),
        message('4', unix('2026-02-08T12:00:00-06:00'), false, 'te amo'),
      ],
      metrics: {} as ChatExport['metrics'],
    };

    const output = normalizeExport(input);

    assert.equal(output.metrics.totals.messages, 4);
    assert.equal(output.metrics.totals.teAmoCount, 2);
    assert.equal(output.metrics.bySender.me.messages, 2);
    assert.equal(output.metrics.bySender.them.messages, 2);
    assert.equal(output.metrics.totals.imageMessages, 1);
    assert.equal(output.metrics.firstTeAmo?.messageId, '2');
    assert.equal(output.metrics.phases.find((phase) => phase.phaseId === 'before')?.total, 1);
    assert.equal(output.metrics.phases.find((phase) => phase.phaseId === 'courting')?.total, 2);
    assert.equal(output.metrics.phases.find((phase) => phase.phaseId === 'official')?.total, 1);
  });
});
