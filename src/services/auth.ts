import { init, credentialsProvider } from '@tidal-music/auth';
import type { StorageAdapter } from '@tidal-music/auth';
import { AuthConfigError } from '../domain/errors.ts';

function createInMemoryStorage(): StorageAdapter {
  const store = new Map<string, string>();
  return {
    async load(key: string): Promise<string | null> {
      return store.get(key) ?? null;
    },
    async save(key: string, value: string): Promise<void> {
      store.set(key, value);
    },
    async remove(key: string): Promise<void> {
      store.delete(key);
    },
  };
}

export async function initAuth(): Promise<void> {
  const clientId = process.env['TIDAL_CLIENT_ID'];
  const clientSecret = process.env['TIDAL_CLIENT_SECRET'];

  if (!clientId) {
    throw new AuthConfigError(
      'Missing required environment variable: TIDAL_CLIENT_ID',
    );
  }
  if (!clientSecret) {
    throw new AuthConfigError(
      'Missing required environment variable: TIDAL_CLIENT_SECRET',
    );
  }

  await init({
    clientId,
    clientSecret,
    credentialsStorageKey: 'tidal-cli-credentials',
    storage: createInMemoryStorage(),
  });
}

export { credentialsProvider };
