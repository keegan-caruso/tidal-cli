import { afterEach, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { ConfigError } from '../domain/errors.ts';
import { loadProjectConfig } from './config.ts';

describe('loadProjectConfig', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'tidal-cli-config-'));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('returns empty defaults when config file is absent', async () => {
    assert.deepEqual(await loadProjectConfig(dir), {});
  });

  it('loads and normalizes project-local config', async () => {
    await writeFile(
      join(dir, '.tidal-cli.json'),
      JSON.stringify({
        countryCode: 'gb',
        explicitFilter: 'EXCLUDE',
        searchType: 'tracks',
        limit: 5,
      }),
    );

    assert.deepEqual(await loadProjectConfig(dir), {
      countryCode: 'GB',
      explicitFilter: 'EXCLUDE',
      searchType: 'tracks',
      limit: 5,
    });
  });

  it('throws ConfigError for invalid config', async () => {
    await writeFile(join(dir, '.tidal-cli.json'), '{"limit": 100}');

    await assert.rejects(
      () => loadProjectConfig(dir),
      (err: unknown) => {
        assert(err instanceof ConfigError);
        assert.match(err.message, /invalid/);
        return true;
      },
    );
  });
});
