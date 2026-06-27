import { Command } from 'commander';
import type { QueueController, GetQueueResult, ListQueuesResult } from '../../controllers/queue.ts';
import type { PlayQueue, QueueItem, RepeatMode } from '../../domain/queue.ts';
import { TidalCliError } from '../../domain/errors.ts';

interface QueueShowOptions {
  id?: string;
  json?: boolean;
}

interface QueueAddOptions {
  id?: string;
  next?: boolean;
}

interface QueueRemoveOptions {
  id?: string;
}

interface QueueUpdateOptions {
  id?: string;
  repeat?: string;
  shuffle?: boolean;
  noShuffle?: boolean;
}

export function createQueueCommand(controller: QueueController): Command {
  const cmd = new Command('queue');
  cmd.description('Manage your play queue');

  // tidal queue (show current queue)
  cmd
    .command('show', { isDefault: true })
    .description('Show the current play queue')
    .option('--id <queueId>', 'Specific queue ID (uses active queue if not provided)')
    .option('--json', 'Output raw JSON instead of formatted text')
    .action(async (options: QueueShowOptions) => {
      try {
        let result: GetQueueResult;
        if (options.id) {
          result = await controller.getQueue(options.id);
        } else {
          result = await controller.getOrCreateQueue();
        }

        if (options.json === true) {
          process.stdout.write(JSON.stringify(result, null, 2) + '\n');
        } else {
          process.stdout.write(formatQueueResult(result.queue));
        }
      } catch (err) {
        process.stderr.write(`${formatCliError(err)}\n`);
        process.exit(1);
      }
    });

  // tidal queue list
  cmd
    .command('list')
    .description('List all play queues')
    .option('--json', 'Output raw JSON instead of formatted text')
    .action(async (options: { json?: boolean }) => {
      try {
        const result = await controller.listQueues();

        if (options.json === true) {
          process.stdout.write(JSON.stringify(result, null, 2) + '\n');
        } else {
          process.stdout.write(formatQueuesListResult(result));
        }
      } catch (err) {
        process.stderr.write(`${formatCliError(err)}\n`);
        process.exit(1);
      }
    });

  // tidal queue add <trackId...>
  cmd
    .command('add <trackIds...>')
    .description('Add tracks to the queue')
    .option('--id <queueId>', 'Specific queue ID (uses active queue if not provided)')
    .option('-n, --next', 'Add tracks to play next (default: add to end)')
    .action(async (trackIds: string[], options: QueueAddOptions) => {
      try {
        let queueId = options.id;
        if (!queueId) {
          const { queue } = await controller.getOrCreateQueue();
          queueId = queue.id;
        }

        await controller.addToQueue(queueId, {
          trackIds,
          position: options.next ? 'next' : 'last',
        });

        const positionText = options.next ? 'next' : 'end of queue';
        process.stdout.write(`Added ${trackIds.length} track(s) to play ${positionText}.\n`);
      } catch (err) {
        process.stderr.write(`${formatCliError(err)}\n`);
        process.exit(1);
      }
    });

  // tidal queue remove <trackId> <itemId>
  cmd
    .command('remove <trackId> <itemId>')
    .description('Remove a track from the queue')
    .option('--id <queueId>', 'Specific queue ID (uses active queue if not provided)')
    .action(async (trackId: string, itemId: string, options: QueueRemoveOptions) => {
      try {
        let queueId = options.id;
        if (!queueId) {
          const { queue } = await controller.getOrCreateQueue();
          queueId = queue.id;
        }

        await controller.removeFromQueue(queueId, trackId, itemId);
        process.stdout.write(`Removed track from queue.\n`);
      } catch (err) {
        process.stderr.write(`${formatCliError(err)}\n`);
        process.exit(1);
      }
    });

  // tidal queue clear
  cmd
    .command('clear')
    .description('Clear all upcoming tracks from the queue')
    .option('--id <queueId>', 'Specific queue ID (uses active queue if not provided)')
    .action(async (options: { id?: string }) => {
      try {
        let queueId = options.id;
        if (!queueId) {
          const { queue } = await controller.getOrCreateQueue();
          queueId = queue.id;
        }

        await controller.clearQueue(queueId);
        process.stdout.write(`Queue cleared.\n`);
      } catch (err) {
        process.stderr.write(`${formatCliError(err)}\n`);
        process.exit(1);
      }
    });

  // tidal queue skip <trackId> <itemId>
  cmd
    .command('skip <trackId> <itemId>')
    .description('Skip to a specific track in the queue')
    .option('--id <queueId>', 'Specific queue ID (uses active queue if not provided)')
    .action(async (trackId: string, itemId: string, options: { id?: string }) => {
      try {
        let queueId = options.id;
        if (!queueId) {
          const { queue } = await controller.getOrCreateQueue();
          queueId = queue.id;
        }

        await controller.skipTo(queueId, trackId, itemId);
        process.stdout.write(`Skipped to track.\n`);
      } catch (err) {
        process.stderr.write(`${formatCliError(err)}\n`);
        process.exit(1);
      }
    });

  // tidal queue shuffle
  cmd
    .command('shuffle')
    .description('Toggle shuffle mode')
    .option('--id <queueId>', 'Specific queue ID (uses active queue if not provided)')
    .action(async (options: { id?: string }) => {
      try {
        let queueId = options.id;
        if (!queueId) {
          const { queue } = await controller.getOrCreateQueue();
          queueId = queue.id;
        }

        const newState = await controller.toggleShuffle(queueId);
        process.stdout.write(`Shuffle ${newState ? 'enabled' : 'disabled'}.\n`);
      } catch (err) {
        process.stderr.write(`${formatCliError(err)}\n`);
        process.exit(1);
      }
    });

  // tidal queue repeat
  cmd
    .command('repeat')
    .description('Cycle repeat mode (none -> all -> one -> none)')
    .option('--id <queueId>', 'Specific queue ID (uses active queue if not provided)')
    .action(async (options: { id?: string }) => {
      try {
        let queueId = options.id;
        if (!queueId) {
          const { queue } = await controller.getOrCreateQueue();
          queueId = queue.id;
        }

        const newMode = await controller.cycleRepeat(queueId);
        process.stdout.write(`Repeat mode: ${formatRepeatMode(newMode)}.\n`);
      } catch (err) {
        process.stderr.write(`${formatCliError(err)}\n`);
        process.exit(1);
      }
    });

  // tidal queue create
  cmd
    .command('create')
    .description('Create a new play queue')
    .option('--json', 'Output raw JSON instead of formatted text')
    .action(async (options: { json?: boolean }) => {
      try {
        const result = await controller.createQueue();

        if (options.json === true) {
          process.stdout.write(JSON.stringify(result, null, 2) + '\n');
        } else {
          process.stdout.write(`Created new queue: ${result.queue.id}\n`);
        }
      } catch (err) {
        process.stderr.write(`${formatCliError(err)}\n`);
        process.exit(1);
      }
    });

  // tidal queue delete <queueId>
  cmd
    .command('delete <queueId>')
    .description('Delete a play queue')
    .action(async (queueId: string) => {
      try {
        await controller.deleteQueue(queueId);
        process.stdout.write(`Deleted queue: ${queueId}\n`);
      } catch (err) {
        process.stderr.write(`${formatCliError(err)}\n`);
        process.exit(1);
      }
    });

  return cmd;
}

function formatQueueResult(queue: PlayQueue): string {
  const lines: string[] = [];

  lines.push('');
  lines.push(`  Play Queue`);
  lines.push(`  ID: ${queue.id}`);
  lines.push(`  Repeat: ${formatRepeatMode(queue.repeat)} | Shuffle: ${queue.shuffled ? 'on' : 'off'}`);
  lines.push('');

  // Current track
  if (queue.current) {
    lines.push('  Now Playing:');
    lines.push(formatQueueItem(queue.current, '    '));
    lines.push('');
  } else {
    lines.push('  Now Playing: (none)');
    lines.push('');
  }

  // Upcoming tracks
  lines.push(`  Up Next (${queue.future.length}):`);
  if (queue.future.length === 0) {
    lines.push('    (empty)');
  } else {
    for (let i = 0; i < Math.min(queue.future.length, 10); i++) {
      lines.push(formatQueueItem(queue.future[i], '    ', i + 1));
    }
    if (queue.future.length > 10) {
      lines.push(`    ... and ${queue.future.length - 10} more`);
    }
  }
  lines.push('');

  // Recently played
  if (queue.past.length > 0) {
    lines.push(`  Recently Played (${queue.past.length}):`);
    const recentPast = queue.past.slice(-5).reverse();
    for (const item of recentPast) {
      lines.push(formatQueueItem(item, '    '));
    }
    lines.push('');
  }

  return `${lines.join('\n')}\n`;
}

function formatQueueItem(item: QueueItem, indent: string, index?: number): string {
  const track = item.track;
  const num = index != null ? `${index}. ` : '';
  const explicit = track.explicit ? ' [E]' : '';
  const artists = track.artists.map((a) => a.name).join(', ');
  const artistText = artists ? ` - ${artists}` : '';

  return `${indent}${num}${track.title}${explicit}${artistText} (${track.durationText}) [itemId: ${item.itemId}]`;
}

function formatQueuesListResult(result: ListQueuesResult): string {
  const lines: string[] = [];

  lines.push('');
  lines.push(`  Play Queues (${result.queues.length})`);
  lines.push('');

  if (result.queues.length === 0) {
    lines.push('  No play queues found.');
  } else {
    for (const queue of result.queues) {
      const current = queue.current ? queue.current.track.title : '(none)';
      const futureCount = queue.future.length;
      lines.push(`  ${queue.id}`);
      lines.push(`    Now: ${current} | Up next: ${futureCount} tracks`);
      lines.push(`    Repeat: ${formatRepeatMode(queue.repeat)} | Shuffle: ${queue.shuffled ? 'on' : 'off'}`);
      lines.push('');
    }
  }

  return `${lines.join('\n')}\n`;
}

function formatRepeatMode(mode: RepeatMode): string {
  switch (mode) {
    case 'none':
      return 'off';
    case 'one':
      return 'one';
    case 'all':
      return 'all';
  }
}

function formatCliError(err: unknown): string {
  if (err instanceof TidalCliError) {
    return `Error [${err.code}]: ${err.message}`;
  }
  return `Error: ${err instanceof Error ? err.message : String(err)}`;
}
