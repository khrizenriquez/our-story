import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import type { ChatExport } from '../src/types';
import { normalizeExport } from '../src/lib/metrics';
import { readPrivateConfig } from './env';
import { commandExists, sqliteJson, sqlString } from './sqlite';

interface CountRow {
  count: number;
  start_ts: number;
  end_ts: number;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function runFixtureHarness(): void {
  const fixture = JSON.parse(readFileSync('public/demo/babe-chat-demo.json', 'utf8')) as ChatExport;
  const normalized = normalizeExport(fixture);
  assert(normalized.metrics.totals.messages === 12, 'Fixture should contain 12 messages.');
  assert(normalized.metrics.totals.teAmoCount === 4, 'Fixture should count four te amo occurrences.');
  assert(normalized.metrics.firstTeAmo?.messageId === 'demo-005', 'Fixture first te amo should be deterministic.');
  console.log('Fixture harness passed.');
}

function trackedFiles(): string[] {
  try {
    execFileSync('git', ['rev-parse', '--is-inside-work-tree'], { stdio: 'ignore' });
  } catch {
    return [];
  }

  const tracked = execFileSync('git', ['ls-files'], { encoding: 'utf8' }).split(/\r?\n/).filter(Boolean);
  const staged = execFileSync('git', ['diff', '--cached', '--name-only'], { encoding: 'utf8' })
    .split(/\r?\n/)
    .filter(Boolean);
  return Array.from(new Set([...tracked, ...staged]));
}

function runPrivacyHarness(): void {
  const gitignore = readFileSync('.gitignore', 'utf8');
  for (const pattern of ['public/data/', 'public/private-media/', '.env.local', 'chat_bk/', 'chat_bk*.zip', '*.sqlite', '*.sqlite3', '*.db']) {
    assert(gitignore.includes(pattern), `.gitignore must include ${pattern}.`);
  }

  const privateConfig = readPrivateConfig();
  const files = trackedFiles();
  const inGitRepo = files.length > 0 || existsSync('.git');
  if (!inGitRepo) {
    console.log('Privacy harness note: this folder is not a git repository yet, so tracked-file audit is skipped.');
  }

  const forbiddenPath =
    /(^|\/)(public\/data|public\/private-media|data|media|chat_bk)(\/|$)|(^|\/)chat_bk[^/]*\.zip$|\.(sqlite|sqlite3|db)(-|$|\.)|(^|\/)\.env(\..*)?$/;
  const leakedPath = files.find((file) => forbiddenPath.test(file));
  assert(!leakedPath, `Private artifact is tracked or staged: ${leakedPath}`);

  const privateNeedles = [privateConfig.chatJid, privateConfig.chatPhone].filter(Boolean);
  for (const file of files) {
    if (!existsSync(file)) continue;
    const contents = readFileSync(file, 'utf8');
    const leakedNeedle = privateNeedles.find((needle) => contents.includes(needle));
    assert(!leakedNeedle, `Private identifier leaked in versioned file: ${file}`);
  }

  console.log('Privacy harness passed.');
}

function runLocalArchiveHarness(): void {
  const dbPath = join(homedir(), '.wacrawl', 'wacrawl.db');
  if (!existsSync(dbPath)) {
    console.log('Local wacrawl archive not found; skipping private archive validation.');
    return;
  }
  if (!commandExists('sqlite3')) {
    throw new Error('sqlite3 CLI is required for local archive validation.');
  }

  const config = readPrivateConfig();
  const countRows = sqliteJson<CountRow>(
    dbPath,
    `select count(*) as count, min(ts) as start_ts, max(ts) as end_ts
     from messages
     where chat_jid = ${sqlString(config.chatJid)};`,
  );
  const count = Number(countRows[0]?.count ?? 0);
  assert(count > 0, 'Configured private chat has no messages in the wacrawl archive.');

  const chatRows = sqliteJson<{ name: string }>(
    dbPath,
    `select coalesce(name, '') as name from chats where jid = ${sqlString(config.chatJid)} limit 1;`,
  );
  assert(chatRows.length === 1, 'Configured private chat does not exist in chats table.');

  console.log(`Local archive harness passed: ${count} messages found; message text was not printed.`);
}

function main(): void {
  runFixtureHarness();
  runPrivacyHarness();
  runLocalArchiveHarness();
}

main();
