import { Command } from 'commander';
import type { UserController, MixesResult } from '../../controllers/user.ts';
import type { MixType } from '../../domain/user.ts';
import type { Playlist } from '../../domain/media.ts';
import { TidalCliError } from '../../domain/errors.ts';

interface MixesCommandOptions {
  type?: string;
  json?: boolean;
}

export function createMixesCommand(controller: UserController): Command {
  const cmd = new Command('mixes');

  cmd
    .description('Get your personalized mixes')
    .option(
      '-t, --type <type>',
      'Mix type: daily|discovery|new-releases',
      'daily',
    )
    .option('--json', 'Output raw JSON instead of formatted text')
    .action(async (options: MixesCommandOptions) => {
      try {
        const result = await controller.getMixes({
          type: options.type as MixType | undefined,
        });

        if (options.json === true) {
          process.stdout.write(JSON.stringify(result, null, 2) + '\n');
        } else {
          process.stdout.write(formatCliMixesResult(result));
        }
      } catch (err) {
        process.stderr.write(`${formatCliError(err)}\n`);
        process.exit(1);
      }
    });

  return cmd;
}

export function formatCliMixesResult(result: MixesResult): string {
  const lines: string[] = [];

  const typeLabel = formatMixTypeLabel(result.type);
  lines.push(`${typeLabel}:`);

  if (result.playlists.length === 0) {
    lines.push('  No mixes found.');
  } else {
    appendPlaylists(lines, result.playlists);
  }

  return `${lines.join('\n')}\n`;
}

function formatMixTypeLabel(type: MixType): string {
  switch (type) {
    case 'daily':
      return 'Daily Mixes';
    case 'discovery':
      return 'Discovery Mixes';
    case 'new-releases':
      return 'New Release Mixes';
  }
}

function appendPlaylists(lines: string[], playlists: Playlist[]): void {
  for (const p of playlists) {
    const count =
      p.numberOfItems != null ? ` - ${p.numberOfItems} tracks` : '';
    const duration = p.durationText != null ? ` - ${p.durationText}` : '';
    lines.push(`  ${p.name}${count}${duration} - ${p.url}`);
  }
}

function formatCliError(err: unknown): string {
  if (err instanceof TidalCliError) {
    return `Error [${err.code}]: ${err.message}`;
  }
  return `Error: ${err instanceof Error ? err.message : String(err)}`;
}
