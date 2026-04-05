import { Command } from 'commander';
import type { SearchController } from '../../controllers/search.js';
import type { SearchResult, SearchType } from '../../domain/types.js';

export function createSearchCommand(controller: SearchController): Command {
  const cmd = new Command('search');

  cmd
    .description('Search Tidal for music')
    .argument('<query>', 'Search query string')
    .option(
      '-t, --type <type>',
      'Content type: tracks|albums|artists|playlists|all',
      'all',
    )
    .option('-c, --country <code>', 'ISO 3166-1 alpha-2 country code', 'US')
    .option('--explicit <filter>', 'Explicit filter: INCLUDE|EXCLUDE')
    .option('--json', 'Output raw JSON instead of formatted text')
    .action(
      async (
        query: string,
        options: {
          type: string;
          country: string;
          explicit?: string;
          json?: boolean;
        },
      ) => {
        try {
          const result = await controller.search({
            query,
            type: options.type as SearchType,
            countryCode: options.country,
            explicitFilter: options.explicit as
              | 'INCLUDE'
              | 'EXCLUDE'
              | undefined,
          });

          if (options.json === true) {
            process.stdout.write(JSON.stringify(result, null, 2) + '\n');
          } else {
            printFormattedResult(result);
          }
        } catch (err) {
          process.stderr.write(
            `Error: ${err instanceof Error ? err.message : String(err)}\n`,
          );
          process.exit(1);
        }
      },
    );

  return cmd;
}

function printFormattedResult(result: SearchResult): void {
  if (result.didYouMean != null) {
    process.stdout.write(`Did you mean: "${result.didYouMean}"?\n\n`);
  }

  if (result.tracks.length > 0) {
    process.stdout.write('Tracks:\n');
    for (const t of result.tracks) {
      const explicit = t.explicit ? ' [E]' : '';
      process.stdout.write(
        `  ${t.title}${explicit} — ${t.duration} (id: ${t.id})\n`,
      );
    }
  }

  if (result.albums.length > 0) {
    process.stdout.write('\nAlbums:\n');
    for (const a of result.albums) {
      process.stdout.write(
        `  ${a.title} (${a.albumType}) id: ${a.id}\n`,
      );
    }
  }

  if (result.artists.length > 0) {
    process.stdout.write('\nArtists:\n');
    for (const a of result.artists) {
      process.stdout.write(`  ${a.name} id: ${a.id}\n`);
    }
  }

  if (result.playlists.length > 0) {
    process.stdout.write('\nPlaylists:\n');
    for (const p of result.playlists) {
      process.stdout.write(`  ${p.name} (${p.playlistType}) id: ${p.id}\n`);
    }
  }

  if (
    result.tracks.length === 0 &&
    result.albums.length === 0 &&
    result.artists.length === 0 &&
    result.playlists.length === 0
  ) {
    process.stdout.write('No results found.\n');
  }
}
