import { spawn } from 'node:child_process';
import { TidalCliError } from '../domain/errors.ts';

export function formatCliError(err: unknown): string {
  if (err instanceof TidalCliError) {
    return `Error [${err.code}]: ${err.message}`;
  }
  return `Error: ${err instanceof Error ? err.message : String(err)}`;
}

export function openUrl(url: string): void {
  const command =
    process.platform === 'darwin'
      ? 'open'
      : process.platform === 'win32'
        ? 'cmd'
        : 'xdg-open';
  const args =
    process.platform === 'win32' ? ['/c', 'start', '', url] : [url];

  const child = spawn(command, args, {
    detached: true,
    stdio: 'ignore',
  });
  child.unref();
}

export function parseLimitOption(value: string): number {
  return Number(value);
}
