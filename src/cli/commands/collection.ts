import { Command } from 'commander';
import type { UserController, CollectionResult } from '../../controllers/user.ts';
import type { CollectionType, CollectionSort, CollectionItem } from '../../domain/user.ts';
import type { Track, Album, Artist, Playlist } from '../../domain/media.ts';
import { formatCliError, parseLimitOption } from '../utils.ts';

interface CollectionCommandOptions {
  type?: string;
  sort?: string;
  limit?: number;
  json?: boolean;
}

export function createCollectionCommand(controller: UserController): Command {
  const cmd = new Command('collection');

  cmd
    .description('Get your saved music collection')
    .option(
      '-t, --type <type>',
      'Collection type: tracks|albums|artists|playlists',
      'tracks',
    )
    .option(
      '-s, --sort <sort>',
      'Sort order: addedAt|-addedAt (default: -addedAt for newest first)',
      '-addedAt',
    )
    .option('--limit <n>', 'Maximum number of items', parseLimitOption)
    .option('--json', 'Output raw JSON instead of formatted text')
    .action(async (options: CollectionCommandOptions) => {
      try {
        const result = await controller.getCollection({
          type: options.type as CollectionType | undefined,
          sort: options.sort as CollectionSort | undefined,
          limit: options.limit,
        });

        if (options.json === true) {
          process.stdout.write(JSON.stringify(result, null, 2) + '\n');
        } else {
          process.stdout.write(formatCliCollectionResult(result));
        }
      } catch (err) {
        process.stderr.write(`${formatCliError(err)}\n`);
        process.exit(1);
      }
    });

  return cmd;
}

export function formatCliCollectionResult(result: CollectionResult): string {
  const lines: string[] = [];

  const typeLabel = formatCollectionTypeLabel(result.type);
  const sortLabel = result.sort === '-addedAt' ? 'newest first' : 'oldest first';

  lines.push('');
  lines.push(`  ${typeLabel}`);
  lines.push(`  ${result.tracks.length + result.albums.length + result.artists.length + result.playlists.length} items, ${sortLabel}`);
  lines.push('');

  switch (result.type) {
    case 'tracks':
      if (result.tracks.length === 0) {
        lines.push('  No tracks in collection.');
      } else {
        appendCollectionTracks(lines, result.tracks);
      }
      break;
    case 'albums':
      if (result.albums.length === 0) {
        lines.push('  No albums in collection.');
      } else {
        appendCollectionAlbums(lines, result.albums);
      }
      break;
    case 'artists':
      if (result.artists.length === 0) {
        lines.push('  No artists in collection.');
      } else {
        appendCollectionArtists(lines, result.artists);
      }
      break;
    case 'playlists':
      if (result.playlists.length === 0) {
        lines.push('  No playlists in collection.');
      } else {
        appendCollectionPlaylists(lines, result.playlists);
      }
      break;
  }

  lines.push('');
  return `${lines.join('\n')}\n`;
}

function formatCollectionTypeLabel(type: CollectionType): string {
  switch (type) {
    case 'tracks':
      return 'Saved Tracks';
    case 'albums':
      return 'Saved Albums';
    case 'artists':
      return 'Followed Artists';
    case 'playlists':
      return 'Saved Playlists';
  }
}

function appendCollectionTracks(
  lines: string[],
  items: CollectionItem<Track>[],
): void {
  // Calculate column widths (minimum is header length)
  const maxTitleLen = Math.min(45, Math.max(5, ...items.map(({ item }) => {
    const explicit = item.explicit ? ' [E]' : '';
    return (item.title + explicit).length;
  })));

  // Header
  lines.push(`  ${'#'.padEnd(4)} ${'Title'.padEnd(maxTitleLen)} ${'Time'.padEnd(6)} ${'Added'.padEnd(12)} URL`);
  lines.push(`  ${'─'.repeat(4)} ${'─'.repeat(maxTitleLen)} ${'─'.repeat(6)} ${'─'.repeat(12)} ${'─'.repeat(30)}`);

  items.forEach(({ item: t, addedAt }, index) => {
    const num = String(index + 1).padEnd(4);
    const explicit = t.explicit ? ' [E]' : '';
    const title = truncate(t.title + explicit, maxTitleLen).padEnd(maxTitleLen);
    const duration = t.durationText.padEnd(6);
    const added = formatAddedAt(addedAt).padEnd(12);

    lines.push(`  ${num} ${title} ${duration} ${added} ${t.url}`);
  });
}

function appendCollectionAlbums(
  lines: string[],
  items: CollectionItem<Album>[],
): void {
  const maxTitleLen = Math.min(45, Math.max(5, ...items.map(({ item }) => {
    const explicit = item.explicit ? ' [E]' : '';
    return (item.title + explicit).length;
  })));

  lines.push(`  ${'#'.padEnd(4)} ${'Album'.padEnd(maxTitleLen)} ${'Year'.padEnd(6)} ${'Added'.padEnd(12)} URL`);
  lines.push(`  ${'─'.repeat(4)} ${'─'.repeat(maxTitleLen)} ${'─'.repeat(6)} ${'─'.repeat(12)} ${'─'.repeat(30)}`);

  items.forEach(({ item: a, addedAt }, index) => {
    const num = String(index + 1).padEnd(4);
    const explicit = a.explicit ? ' [E]' : '';
    const title = truncate(a.title + explicit, maxTitleLen).padEnd(maxTitleLen);
    const year = (a.releaseDate?.slice(0, 4) ?? '—').padEnd(6);
    const added = formatAddedAt(addedAt).padEnd(12);

    lines.push(`  ${num} ${title} ${year} ${added} ${a.url}`);
  });
}

function appendCollectionArtists(
  lines: string[],
  items: CollectionItem<Artist>[],
): void {
  const maxNameLen = Math.min(45, Math.max(6, ...items.map(({ item }) => item.name.length)));

  lines.push(`  ${'#'.padEnd(4)} ${'Artist'.padEnd(maxNameLen)} ${'Followed'.padEnd(12)} URL`);
  lines.push(`  ${'─'.repeat(4)} ${'─'.repeat(maxNameLen)} ${'─'.repeat(12)} ${'─'.repeat(30)}`);

  items.forEach(({ item: a, addedAt }, index) => {
    const num = String(index + 1).padEnd(4);
    const name = truncate(a.name, maxNameLen).padEnd(maxNameLen);
    const added = formatAddedAt(addedAt).padEnd(12);

    lines.push(`  ${num} ${name} ${added} ${a.url}`);
  });
}

function appendCollectionPlaylists(
  lines: string[],
  items: CollectionItem<Playlist>[],
): void {
  const maxNameLen = Math.min(40, Math.max(8, ...items.map(({ item }) => item.name.length)));

  lines.push(`  ${'#'.padEnd(4)} ${'Playlist'.padEnd(maxNameLen)} ${'Tracks'.padEnd(8)} ${'Duration'.padEnd(10)} ${'Added'.padEnd(12)} URL`);
  lines.push(`  ${'─'.repeat(4)} ${'─'.repeat(maxNameLen)} ${'─'.repeat(8)} ${'─'.repeat(10)} ${'─'.repeat(12)} ${'─'.repeat(30)}`);

  items.forEach(({ item: p, addedAt }, index) => {
    const num = String(index + 1).padEnd(4);
    const name = truncate(p.name, maxNameLen).padEnd(maxNameLen);
    const tracks = (p.numberOfItems?.toString() ?? '—').padEnd(8);
    const duration = (p.durationText ?? '—').padEnd(10);
    const added = formatAddedAt(addedAt).padEnd(12);

    lines.push(`  ${num} ${name} ${tracks} ${duration} ${added} ${p.url}`);
  });
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + '…';
}

function formatAddedAt(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return isoDate;
  }
}

