import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { z } from 'zod';
import { ConfigError } from '../domain/errors.ts';
import type { SearchDefaults } from '../domain/search.ts';

const configSchema = z
  .object({
    countryCode: z.string().length(2).optional(),
    explicitFilter: z.enum(['INCLUDE', 'EXCLUDE']).optional(),
    searchType: z
      .enum(['tracks', 'albums', 'artists', 'playlists', 'all'])
      .optional(),
    limit: z.number().int().positive().max(50).optional(),
  })
  .strict();

export async function loadProjectConfig(
  cwd = process.cwd(),
): Promise<SearchDefaults> {
  const path = join(cwd, '.tidal-cli.json');

  let raw: string;
  try {
    raw = await readFile(path, 'utf8');
  } catch (err) {
    if (isNotFoundError(err)) return {};
    throw new ConfigError(`Failed to read ${path}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new ConfigError(`${path} contains invalid JSON`);
  }

  const result = configSchema.safeParse(parsed);
  if (!result.success) {
    throw new ConfigError(
      `${path} is invalid: ${result.error.issues
        .map((issue) => issue.message)
        .join('; ')}`,
    );
  }

  return {
    ...result.data,
    countryCode: result.data.countryCode?.toUpperCase(),
  };
}

function isNotFoundError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err != null &&
    'code' in err &&
    err.code === 'ENOENT'
  );
}
