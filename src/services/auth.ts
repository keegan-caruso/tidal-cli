import {
  init,
  credentialsProvider,
  initializeLogin,
  finalizeLogin,
  logout,
} from '@tidal-music/auth';
import type { StorageAdapter } from '@tidal-music/auth';
import type { CredentialsProvider } from '@tidal-music/common';
import { AuthConfigError, DeviceLoginError } from '../domain/errors.ts';
import {
  createFileStorage,
  clearAllTokens,
  setUserLoggedIn,
  getUserLoggedIn,
} from './token-storage.ts';

function createInMemoryStorage(): StorageAdapter {
  const store = new Map<string, string>();
  return {
    load(key: string): Promise<string | null> {
      return Promise.resolve(store.get(key) ?? null);
    },
    save(key: string, value: string): Promise<void> {
      store.set(key, value);
      return Promise.resolve();
    },
    remove(key: string): Promise<void> {
      store.delete(key);
      return Promise.resolve();
    },
  };
}

let authInitialized = false;
let usingPersistentStorage = false;

/**
 * Initialize auth with in-memory storage (no user login persistence).
 * Use this for simple search-only scenarios.
 */
export async function initAuth(): Promise<void> {
  if (authInitialized) return;

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

  authInitialized = true;
  usingPersistentStorage = false;
}

// Scopes for user data access
const USER_SCOPES = [
  'user.read',
  'collection.read',
  'collection.write',
  'playlists.read',
  'playlists.write',
  'playback',
  'recommendations.read',
  'search.read',
];

/**
 * Initialize auth with file-based storage (persists user login).
 * Use this for full functionality including user endpoints.
 * Call this INSTEAD of initAuth(), not in addition to it.
 */
export async function initUserAuth(): Promise<void> {
  if (authInitialized) return;

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
    scopes: USER_SCOPES,
    storage: createFileStorage(),
  });

  authInitialized = true;
  usingPersistentStorage = true;
}

/**
 * Start authorization code login flow. Returns the URL to open in browser.
 */
export async function startLogin(redirectUri: string): Promise<string> {
  if (!authInitialized) {
    throw new DeviceLoginError(
      'Auth not initialized. Call initUserAuth() first.',
    );
  }

  try {
    return await initializeLogin({ redirectUri });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new DeviceLoginError(`Failed to initialize login: ${message}`, err);
  }
}

/**
 * Complete authorization code login flow with the callback query string.
 */
export async function completeLogin(callbackQuery: string): Promise<void> {
  if (!authInitialized) {
    throw new DeviceLoginError(
      'Auth not initialized. Call initUserAuth() first.',
    );
  }

  try {
    await finalizeLogin(callbackQuery);
    // Mark user as logged in after successful login
    await setUserLoggedIn(true);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new DeviceLoginError(`Failed to complete login: ${message}`, err);
  }
}

/**
 * Check if user is logged in (has completed login).
 */
export async function isUserLoggedIn(): Promise<boolean> {
  if (!authInitialized) {
    return false;
  }

  // Check our persisted login state flag
  return getUserLoggedIn();
}

/**
 * Log out user and clear all stored tokens.
 */
export async function logoutUser(): Promise<void> {
  logout();
  // Clear the login flag first, then all tokens
  await setUserLoggedIn(false);
  if (usingPersistentStorage) {
    await clearAllTokens();
  }
}

/**
 * Get the credentials provider for user API calls.
 */
export function getUserCredentialsProvider(): CredentialsProvider {
  return credentialsProvider;
}

export { credentialsProvider };
