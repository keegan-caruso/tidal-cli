import { mkdtemp, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { loadProjectEnv } from './env.ts';

describe('loadProjectEnv', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env['TIDAL_CLIENT_ID'];
    delete process.env['TIDAL_CLIENT_SECRET'];
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('does nothing when .env is absent', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'tidal-cli-env-'));

    await loadProjectEnv(dir);

    assert.equal(process.env['TIDAL_CLIENT_ID'], undefined);
    assert.equal(process.env['TIDAL_CLIENT_SECRET'], undefined);
  });

  it('loads project-local .env values', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'tidal-cli-env-'));
    await writeFile(
      join(dir, '.env'),
      [
        '# local secrets',
        'TIDAL_CLIENT_ID=test-id',
        'TIDAL_CLIENT_SECRET="test-secret"',
        '',
      ].join('\n'),
      'utf8',
    );

    await loadProjectEnv(dir);

    assert.equal(process.env['TIDAL_CLIENT_ID'], 'test-id');
    assert.equal(process.env['TIDAL_CLIENT_SECRET'], 'test-secret');
  });

  it('does not override existing environment variables', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'tidal-cli-env-'));
    process.env['TIDAL_CLIENT_ID'] = 'existing-id';
    await writeFile(join(dir, '.env'), 'TIDAL_CLIENT_ID=file-id\n', 'utf8');

    await loadProjectEnv(dir);

    assert.equal(process.env['TIDAL_CLIENT_ID'], 'existing-id');
  });
});
