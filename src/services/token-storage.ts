import { mkdir, readFile, writeFile, unlink, chmod } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import type { StorageAdapter } from '@tidal-music/auth';

const CONFIG_DIR = join(homedir(), '.tidal-cli');
const TOKENS_FILE = join(CONFIG_DIR, 'tokens.json');

export function createFileStorage(): StorageAdapter {
  return {
    async load(key: string): Promise<string | null> {
      try {
        const content = await readFile(TOKENS_FILE, 'utf-8');
        const data = JSON.parse(content) as Record<string, string>;
        return data[key] ?? null;
      } catch {
        return null;
      }
    },

    async save(key: string, value: string): Promise<void> {
      await mkdir(dirname(TOKENS_FILE), { recursive: true });

      let data: Record<string, string> = {};
      try {
        const content = await readFile(TOKENS_FILE, 'utf-8');
        data = JSON.parse(content) as Record<string, string>;
      } catch {
        // File doesn't exist or is invalid, start fresh
      }

      data[key] = value;
      await writeFile(TOKENS_FILE, JSON.stringify(data, null, 2), 'utf-8');
      await chmod(TOKENS_FILE, 0o600);
    },

    async remove(key: string): Promise<void> {
      try {
        const content = await readFile(TOKENS_FILE, 'utf-8');
        const data = JSON.parse(content) as Record<string, string>;
        const { [key]: _, ...rest } = data;

        if (Object.keys(rest).length === 0) {
          await unlink(TOKENS_FILE);
        } else {
          await writeFile(TOKENS_FILE, JSON.stringify(rest, null, 2), 'utf-8');
        }
      } catch {
        // File doesn't exist, nothing to remove
      }
    },
  };
}

export async function clearAllTokens(): Promise<void> {
  try {
    await unlink(TOKENS_FILE);
  } catch {
    // File doesn't exist, nothing to clear
  }
}

const USER_LOGIN_KEY = '__user_logged_in__';

export async function setUserLoggedIn(loggedIn: boolean): Promise<void> {
  await mkdir(dirname(TOKENS_FILE), { recursive: true });

  let data: Record<string, string> = {};
  try {
    const content = await readFile(TOKENS_FILE, 'utf-8');
    data = JSON.parse(content) as Record<string, string>;
  } catch {
    // File doesn't exist or is invalid, start fresh
  }

  let finalData: Record<string, string>;
  if (loggedIn) {
    finalData = { ...data, [USER_LOGIN_KEY]: 'true' };
  } else {
    const { [USER_LOGIN_KEY]: _, ...rest } = data;
    finalData = rest;
  }

  if (Object.keys(finalData).length === 0) {
    try {
      await unlink(TOKENS_FILE);
    } catch {
      // Ignore
    }
  } else {
    await writeFile(TOKENS_FILE, JSON.stringify(finalData, null, 2), 'utf-8');
    await chmod(TOKENS_FILE, 0o600);
  }
}

export async function getUserLoggedIn(): Promise<boolean> {
  try {
    const content = await readFile(TOKENS_FILE, 'utf-8');
    const data = JSON.parse(content) as Record<string, string>;
    return data[USER_LOGIN_KEY] === 'true';
  } catch {
    return false;
  }
}
