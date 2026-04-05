import { z } from 'zod';
import type { SearchController } from '../../controllers/search.js';
import type { SearchResult } from '../../domain/types.js';

export const searchToolName = 'tidal_search' as const;

export const searchToolDescription =
  'Search Tidal for tracks, albums, artists, or playlists. Returns structured results.';

export const searchToolSchema = {
  query: z.string().min(1).describe('The search query string'),
  type: z
    .enum(['tracks', 'albums', 'artists', 'playlists', 'all'])
    .default('all')
    .describe('Type of content to search for'),
  countryCode: z
    .string()
    .length(2)
    .default('US')
    .describe('ISO 3166-1 alpha-2 country code'),
  explicitFilter: z
    .enum(['INCLUDE', 'EXCLUDE'])
    .optional()
    .describe('Whether to include or exclude explicit content'),
};

export function createSearchToolHandler(controller: SearchController) {
  return async (input: {
    query: string;
    type: 'tracks' | 'albums' | 'artists' | 'playlists' | 'all';
    countryCode: string;
    explicitFilter?: 'INCLUDE' | 'EXCLUDE';
  }) => {
    const result = await controller.search({
      query: input.query,
      type: input.type,
      countryCode: input.countryCode,
      explicitFilter: input.explicitFilter,
    });

    return {
      content: [
        {
          type: 'text' as const,
          text: formatSearchResult(result),
        },
      ],
    };
  };
}

export function formatSearchResult(result: SearchResult): string {
  const lines: string[] = [];

  if (result.didYouMean != null) {
    lines.push(`Did you mean: "${result.didYouMean}"?\n`);
  }

  if (result.tracks.length > 0) {
    lines.push(`## Tracks (${result.tracks.length})`);
    for (const t of result.tracks) {
      const explicit = t.explicit ? ' [E]' : '';
      lines.push(`- ${t.title}${explicit} — ${t.duration} (id: ${t.id})`);
    }
  }

  if (result.albums.length > 0) {
    lines.push(`\n## Albums (${result.albums.length})`);
    for (const a of result.albums) {
      const date = a.releaseDate != null ? ` (${a.releaseDate})` : '';
      lines.push(`- ${a.title} [${a.albumType}]${date} (id: ${a.id})`);
    }
  }

  if (result.artists.length > 0) {
    lines.push(`\n## Artists (${result.artists.length})`);
    for (const a of result.artists) {
      const handle = a.handle != null ? ` @${a.handle}` : '';
      lines.push(`- ${a.name}${handle} (id: ${a.id})`);
    }
  }

  if (result.playlists.length > 0) {
    lines.push(`\n## Playlists (${result.playlists.length})`);
    for (const p of result.playlists) {
      lines.push(`- ${p.name} [${p.playlistType}] (id: ${p.id})`);
    }
  }

  if (lines.length === 0) {
    return 'No results found.';
  }

  return lines.join('\n');
}
