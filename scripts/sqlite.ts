import { execFileSync } from 'node:child_process';

export function commandExists(command: string): boolean {
  try {
    execFileSync('command', ['-v', command], { stdio: 'ignore', shell: true });
    return true;
  } catch {
    return false;
  }
}

export function sqlString(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

export function sqliteJson<T>(dbPath: string, sql: string): T[] {
  const output = execFileSync('sqlite3', ['-json', dbPath, sql], {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 512,
  });
  if (!output.trim()) return [];
  return JSON.parse(output) as T[];
}
