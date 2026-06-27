import type { TidalApiService } from '../services/tidal-api.ts';
import type {
  PlayQueue,
  RepeatMode,
  AddToQueueOptions,
  UpdateQueueOptions,
} from '../domain/queue.ts';
import { ValidationError } from '../domain/errors.ts';
import { requireUserAuth } from './utils.ts';

const repeatModes = new Set<RepeatMode>(['none', 'one', 'all']);

export interface GetQueueResult {
  queue: PlayQueue;
}

export interface ListQueuesResult {
  queues: PlayQueue[];
}

export class QueueController {
  private readonly apiService: TidalApiService;

  constructor(apiService: TidalApiService) {
    this.apiService = apiService;
  }

  /**
   * List all play queues for the current user.
   */
  async listQueues(): Promise<ListQueuesResult> {
    await requireUserAuth();
    const result = await this.apiService.getPlayQueues();
    return { queues: result.queues };
  }

  /**
   * Get a specific play queue by ID.
   */
  async getQueue(queueId: string): Promise<GetQueueResult> {
    await requireUserAuth();
    validateQueueId(queueId);
    const result = await this.apiService.getPlayQueue(queueId);
    return { queue: result.queue };
  }

  /**
   * Get the active play queue (creates one if none exists).
   */
  async getOrCreateQueue(): Promise<GetQueueResult> {
    await requireUserAuth();

    const { queues } = await this.apiService.getPlayQueues();

    if (queues.length > 0) {
      // Return the most recently modified queue
      const sorted = [...queues].sort(
        (a, b) =>
          new Date(b.lastModifiedAt).getTime() -
          new Date(a.lastModifiedAt).getTime(),
      );
      return { queue: sorted[0] };
    }

    // No queues exist, create one
    const result = await this.apiService.createPlayQueue();
    return { queue: result.queue };
  }

  /**
   * Create a new play queue.
   */
  async createQueue(): Promise<GetQueueResult> {
    await requireUserAuth();
    const result = await this.apiService.createPlayQueue();
    return { queue: result.queue };
  }

  /**
   * Delete a play queue.
   */
  async deleteQueue(queueId: string): Promise<void> {
    await requireUserAuth();
    validateQueueId(queueId);
    await this.apiService.deletePlayQueue(queueId);
  }

  /**
   * Update queue settings (repeat mode, shuffle).
   */
  async updateQueue(
    queueId: string,
    options: UpdateQueueOptions,
  ): Promise<void> {
    await requireUserAuth();
    validateQueueId(queueId);

    if (options.repeat != null) {
      validateRepeatMode(options.repeat);
    }

    await this.apiService.updatePlayQueue(queueId, options);
  }

  /**
   * Add tracks to the queue.
   */
  async addToQueue(queueId: string, options: AddToQueueOptions): Promise<void> {
    await requireUserAuth();
    validateQueueId(queueId);

    if (options.trackIds.length === 0) {
      throw new ValidationError('At least one track ID is required');
    }

    const mode = options.position === 'next' ? 'next' : 'last';
    await this.apiService.addToQueue(queueId, options.trackIds, mode);
  }

  /**
   * Remove a track from the queue.
   */
  async removeFromQueue(
    queueId: string,
    trackId: string,
    itemId: string,
  ): Promise<void> {
    await requireUserAuth();
    validateQueueId(queueId);

    await this.apiService.removeFromQueue(queueId, [{ trackId, itemId }]);
  }

  /**
   * Clear all tracks from the queue (future tracks only, keeps current).
   */
  async clearQueue(queueId: string): Promise<void> {
    await requireUserAuth();
    validateQueueId(queueId);
    await this.apiService.clearQueue(queueId);
  }

  /**
   * Skip to a specific track in the queue.
   */
  async skipTo(
    queueId: string,
    trackId: string,
    itemId: string,
  ): Promise<void> {
    await requireUserAuth();
    validateQueueId(queueId);
    await this.apiService.setCurrentTrack(queueId, trackId, itemId);
  }

  /**
   * Toggle shuffle mode.
   */
  async toggleShuffle(queueId: string): Promise<boolean> {
    await requireUserAuth();
    validateQueueId(queueId);

    const { queue } = await this.apiService.getPlayQueue(queueId, []);
    const newShuffled = !queue.shuffled;

    await this.apiService.updatePlayQueue(queueId, { shuffled: newShuffled });
    return newShuffled;
  }

  /**
   * Cycle through repeat modes: none -> all -> one -> none
   */
  async cycleRepeat(queueId: string): Promise<RepeatMode> {
    await requireUserAuth();
    validateQueueId(queueId);

    const { queue } = await this.apiService.getPlayQueue(queueId, []);

    const nextMode: Record<RepeatMode, RepeatMode> = {
      none: 'all',
      all: 'one',
      one: 'none',
    };

    const newRepeat = nextMode[queue.repeat];
    await this.apiService.updatePlayQueue(queueId, { repeat: newRepeat });
    return newRepeat;
  }
}

function validateQueueId(queueId: string): void {
  if (!queueId || queueId.trim() === '') {
    throw new ValidationError('Queue ID is required');
  }
}

function validateRepeatMode(mode: RepeatMode): void {
  if (!repeatModes.has(mode)) {
    throw new ValidationError('Repeat mode must be none, one, or all');
  }
}
