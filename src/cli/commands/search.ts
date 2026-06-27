import { createInterface } from 'node:readline/promises';
import { stdin as input, stderr as output } from 'node:process';
import { Command } from 'commander';
import type { SearchController } from '../../controllers/search.ts';
import type { Album, Artist, Playlist, Track } from '../../domain/media.ts';
import type { SearchResult, SearchType } from '../../domain/search.ts';
import { NoOpenableResultError } from '../../domain/errors.ts';
import { formatCliError, openUrl, parseLimitOption } from '../utils.ts';

interface SearchCommandOptions {
  type?: string;
  country?: string;
  explicit?: string;
  limit?: number;
  json?: boolean;
  open?: boolean;
}

interface OpenableResult {
  label: string;
  url: string;
}

export function createSearchCommand(controller: SearchController): Command {
  const cmd = new Command('search');

  cmd
    .description('Search Tidal for music')
    .argument('<query>', 'Search query string')
    .option(
      '-t, --type <type>',
      'Content type: tracks|albums|artists|playlists|all',
    )
    .option('-c, --country <code>', 'ISO 3166-1 alpha-2 country code')
    .option('--explicit <filter>', 'Explicit filter: INCLUDE|EXCLUDE')
    .option('--limit <n>', 'Maximum results per category', parseLimitOption)
    .option('--json', 'Output raw JSON instead of formatted text')
    .option('--open', 'Open a selected result URL in your browser')
    .action(async (query: string, options: SearchCommandOptions) => {
      try {
        const result = await controller.search({
          query,
          type: options.type as SearchType | undefined,
          countryCode: options.country,
          explicitFilter: options.explicit as 'INCLUDE' | 'EXCLUDE' | undefined,
          limit: options.limit,
        });

        if (options.json === true) {
          process.stdout.write(JSON.stringify(result, null, 2) + '\n');
        } else {
          process.stdout.write(formatCliSearchResult(result));
        }

        if (options.open === true) {
          await openSelectedResult(result);
        }
      } catch (err) {
        process.stderr.write(`${formatCliError(err)}\n`);
        process.exit(1);
      }
    });

  return cmd;
}

export function formatCliSearchResult(result: SearchResult): string {
  const lines: string[] = [];

  if (result.didYouMean != null) {
    lines.push(`Did you mean: "${result.didYouMean}"?`, '');
  }

  appendTracks(lines, result.tracks);
  appendAlbums(lines, result.albums);
  appendArtists(lines, result.artists);
  appendPlaylists(lines, result.playlists);

  if (lines.length === 0) {
    return 'No results found.\n';
  }

  return `${lines.join('\n')}\n`;
}

export function collectOpenableResults(result: SearchResult): OpenableResult[] {
  return [
    ...result.tracks.map((track) => ({
      label: `Track: ${track.title}`,
      url: track.url,
    })),
    ...result.albums.map((album) => ({
      label: `Album: ${album.title}`,
      url: album.url,
    })),
    ...result.artists.map((artist) => ({
      label: `Artist: ${artist.name}`,
      url: artist.url,
    })),
    ...result.playlists.map((playlist) => ({
      label: `Playlist: ${playlist.name}`,
      url: playlist.url,
    })),
  ].filter((result) => result.url.length > 0);
}

function appendTracks(lines: string[], tracks: Track[]): void {
  if (tracks.length === 0) return;

  addSection(lines, `Tracks (${tracks.length})`);
  for (const t of tracks) {
    const explicit = t.explicit ? ' [E]' : '';
    const artists = t.artists.length > 0 ? ` - ${joinNames(t.artists)}` : '';
    const albums = t.albums.length > 0 ? ` (${joinNames(t.albums)})` : '';
    lines.push(
      `  ${t.title}${explicit}${artists}${albums} - ${t.durationText} - ${t.url}`,
    );
  }
}

function appendAlbums(lines: string[], albums: Album[]): void {
  if (albums.length === 0) return;

  addSection(lines, `Albums (${albums.length})`);
  for (const a of albums) {
    const explicit = a.explicit ? ' [E]' : '';
    const artists = a.artists.length > 0 ? ` - ${joinNames(a.artists)}` : '';
    const date = a.releaseDate != null ? ` - ${a.releaseDate}` : '';
    lines.push(
      `  ${a.title}${explicit}${artists} - ${a.albumType}${date} - ${a.numberOfItems} tracks - ${a.durationText} - ${a.url}`,
    );
  }
}

function appendArtists(lines: string[], artists: Artist[]): void {
  if (artists.length === 0) return;

  addSection(lines, `Artists (${artists.length})`);
  for (const a of artists) {
    const handle = a.handle != null ? ` @${a.handle}` : '';
    lines.push(`  ${a.name}${handle} - ${a.url}`);
  }
}

function appendPlaylists(lines: string[], playlists: Playlist[]): void {
  if (playlists.length === 0) return;

  addSection(lines, `Playlists (${playlists.length})`);
  for (const p of playlists) {
    const count = p.numberOfItems != null ? ` - ${p.numberOfItems} tracks` : '';
    const duration = p.durationText != null ? ` - ${p.durationText}` : '';
    lines.push(`  ${p.name} - ${p.playlistType}${count}${duration} - ${p.url}`);
  }
}

function addSection(lines: string[], title: string): void {
  if (lines.length > 0 && lines.at(-1) !== '') lines.push('');
  lines.push(`${title}:`);
}

function joinNames(items: { name: string }[]): string {
  return items.map((item) => item.name).join(', ');
}

async function openSelectedResult(result: SearchResult): Promise<void> {
  const openable = collectOpenableResults(result);
  if (openable.length === 0) {
    throw new NoOpenableResultError();
  }

  const selected =
    openable.length === 1
      ? openable[0]
      : await promptForOpenableResult(openable);

  if (selected == null) {
    throw new NoOpenableResultError();
  }

  openUrl(selected.url);
  process.stderr.write(`Opened ${selected.url}\n`);
}

async function promptForOpenableResult(
  results: OpenableResult[],
): Promise<OpenableResult | undefined> {
  if (!input.isTTY) {
    throw new NoOpenableResultError(
      'Cannot choose a result without an interactive terminal',
    );
  }

  for (const [index, result] of results.entries()) {
    process.stderr.write(`${index + 1}. ${result.label} - ${result.url}\n`);
  }

  const rl = createInterface({ input, output });
  try {
    const answer = await rl.question('Open which result? ');
    const index = Number(answer.trim()) - 1;
    if (!Number.isInteger(index) || index < 0 || index >= results.length) {
      throw new NoOpenableResultError('No result selected');
    }
    return results[index];
  } finally {
    rl.close();
  }
}
