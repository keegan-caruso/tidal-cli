import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { AuthConfigError } from '../domain/errors.js';
import { initAuth } from './auth.js';

describe('initAuth', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env['TIDAL_CLIENT_ID'];
    delete process.env['TIDAL_CLIENT_SECRET'];
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('throws AuthConfigError when TIDAL_CLIENT_ID is missing', async () => {
    await assert.rejects(
      () => initAuth(),
      (err: unknown) => {
        assert(err instanceof AuthConfigError);
        assert.match(err.message, /TIDAL_CLIENT_ID/);
        return true;
      },
    );
  });

  it('throws AuthConfigError when TIDAL_CLIENT_SECRET is missing', async () => {
    process.env['TIDAL_CLIENT_ID'] = 'test-id';

    await assert.rejects(
      () => initAuth(),
      (err: unknown) => {
        assert(err instanceof AuthConfigError);
        assert.match(err.message, /TIDAL_CLIENT_SECRET/);
        return true;
      },
    );
  });
});
