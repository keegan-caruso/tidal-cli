import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export async function loadProjectEnv(cwd = process.cwd()): Promise<void> {
  const path = join(cwd, '.env');

  let raw: string;
  try {
    raw = await readFile(path, 'utf8');
  } catch (err) {
    if (isNotFoundError(err)) return;
    throw err;
  }

  for (const line of raw.split(/\r?\n/)) {
    const entry = parseEnvLine(line);
    if (entry == null) continue;

    const [key, value] = entry;
    process.env[key] ??= value;
  }
}

function parseEnvLine(line: string): [string, string] | undefined {
  const trimmed = line.trim();
  if (trimmed.length === 0 || trimmed.startsWith('#')) return undefined;

  const separatorIndex = trimmed.indexOf('=');
  if (separatorIndex <= 0) return undefined;

  const key = trimmed.slice(0, separatorIndex).trim();
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) return undefined;

  const rawValue = trimmed.slice(separatorIndex + 1).trim();
  return [key, unquoteEnvValue(rawValue)];
}

function unquoteEnvValue(value: string): string {
  if (value.length < 2) return value;

  const quote = value[0];
  if ((quote !== '"' && quote !== "'") || value.at(-1) !== quote) return value;

  return value.slice(1, -1);
}

function isNotFoundError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err != null &&
    'code' in err &&
    err.code === 'ENOENT'
  );
}
