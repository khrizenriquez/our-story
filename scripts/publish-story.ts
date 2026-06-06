import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const COMMIT_MESSAGE = 'Update published story data';
const PUBLISHED_SUMMARY_PATH = 'public/published/babe-chat-public.json';

function run(command: string, args: string[], options: { stdio?: 'inherit' | 'pipe'; encoding?: BufferEncoding } = {}): string {
  return execFileSync(command, args, {
    stdio: options.stdio ?? 'pipe',
    encoding: options.encoding ?? 'utf8',
  });
}

function npmCommand(): string {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm';
}

function currentBranch(): string {
  return run('git', ['branch', '--show-current']).trim();
}

function ensureMainBranch(): void {
  const branch = currentBranch();
  if (branch !== 'main') {
    throw new Error(`publish only runs from main. Current branch: ${branch}`);
  }
}

function ensurePublishedSummaryExists(): void {
  const summaryPath = resolve(PUBLISHED_SUMMARY_PATH);
  if (!existsSync(summaryPath)) {
    throw new Error(`missing published summary at ${summaryPath}`);
  }
}

function hasStagedSummaryChanges(): boolean {
  const output = run('git', ['diff', '--cached', '--name-only', '--', PUBLISHED_SUMMARY_PATH]);
  return output.split(/\r?\n/).some((line) => line.trim() === PUBLISHED_SUMMARY_PATH);
}

function main(): void {
  ensureMainBranch();

  run(npmCommand(), ['run', 'export'], { stdio: 'inherit' });
  ensurePublishedSummaryExists();

  run('git', ['add', '--', PUBLISHED_SUMMARY_PATH], { stdio: 'inherit' });

  if (!hasStagedSummaryChanges()) {
    console.log('No published summary changes to commit.');
    return;
  }

  run('git', ['commit', '-m', COMMIT_MESSAGE], { stdio: 'inherit' });
  run('git', ['push', 'origin', 'main'], { stdio: 'inherit' });
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
