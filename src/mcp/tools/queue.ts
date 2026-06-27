import type { QueueController } from '../../controllers/queue.ts';
import type {
  GetQueueToolInput,
  ListQueuesToolInput,
  AddToQueueToolInput,
  RemoveFromQueueToolInput,
  ClearQueueToolInput,
  SkipToTrackToolInput,
  UpdateQueueToolInput,
} from '../inputs/queue.ts';
import { jsonToolResult } from '../format.ts';

export const getQueueToolName = 'tidal_get_queue' as const;
export const getQueueToolDescription =
  "Get the current play queue (requires login). Shows now playing, upcoming tracks, and recently played. If no queue ID provided, returns the active queue.";

export const listQueuesToolName = 'tidal_list_queues' as const;
export const listQueuesToolDescription =
  "List all play queues for the user (requires login).";

export const addToQueueToolName = 'tidal_add_to_queue' as const;
export const addToQueueToolDescription =
  "Add tracks to the play queue (requires login). Can add to play next or at the end of the queue.";

export const removeFromQueueToolName = 'tidal_remove_from_queue' as const;
export const removeFromQueueToolDescription =
  "Remove a track from the play queue (requires login). Requires the itemId from the queue response.";

export const clearQueueToolName = 'tidal_clear_queue' as const;
export const clearQueueToolDescription =
  "Clear all upcoming tracks from the play queue (requires login). Does not affect the currently playing track.";

export const skipToTrackToolName = 'tidal_skip_to_track' as const;
export const skipToTrackToolDescription =
  "Skip to a specific track in the queue (requires login). Makes the specified track the current track.";

export const updateQueueToolName = 'tidal_update_queue' as const;
export const updateQueueToolDescription =
  "Update queue settings like repeat mode and shuffle (requires login).";

export function createGetQueueToolHandler(controller: QueueController) {
  return async (input: GetQueueToolInput) => {
    let result;
    if (input.queueId) {
      result = await controller.getQueue(input.queueId);
    } else {
      result = await controller.getOrCreateQueue();
    }
    return jsonToolResult(result);
  };
}

export function createListQueuesToolHandler(controller: QueueController) {
  return async (_input: ListQueuesToolInput) => {
    const result = await controller.listQueues();
    return jsonToolResult(result);
  };
}

export function createAddToQueueToolHandler(controller: QueueController) {
  return async (input: AddToQueueToolInput) => {
    let queueId = input.queueId;
    if (!queueId) {
      const { queue } = await controller.getOrCreateQueue();
      queueId = queue.id;
    }

    await controller.addToQueue(queueId, {
      trackIds: input.trackIds,
      position: input.position,
    });

    return jsonToolResult({
      success: true,
      queueId,
      tracksAdded: input.trackIds.length,
      position: input.position ?? 'last',
    });
  };
}

export function createRemoveFromQueueToolHandler(controller: QueueController) {
  return async (input: RemoveFromQueueToolInput) => {
    let queueId = input.queueId;
    if (!queueId) {
      const { queue } = await controller.getOrCreateQueue();
      queueId = queue.id;
    }

    await controller.removeFromQueue(queueId, input.trackId, input.itemId);

    return jsonToolResult({
      success: true,
      queueId,
      removedTrackId: input.trackId,
    });
  };
}

export function createClearQueueToolHandler(controller: QueueController) {
  return async (input: ClearQueueToolInput) => {
    let queueId = input.queueId;
    if (!queueId) {
      const { queue } = await controller.getOrCreateQueue();
      queueId = queue.id;
    }

    await controller.clearQueue(queueId);

    return jsonToolResult({
      success: true,
      queueId,
      message: 'Queue cleared successfully',
    });
  };
}

export function createSkipToTrackToolHandler(controller: QueueController) {
  return async (input: SkipToTrackToolInput) => {
    let queueId = input.queueId;
    if (!queueId) {
      const { queue } = await controller.getOrCreateQueue();
      queueId = queue.id;
    }

    await controller.skipTo(queueId, input.trackId, input.itemId);

    return jsonToolResult({
      success: true,
      queueId,
      nowPlaying: input.trackId,
    });
  };
}

export function createUpdateQueueToolHandler(controller: QueueController) {
  return async (input: UpdateQueueToolInput) => {
    let queueId = input.queueId;
    if (!queueId) {
      const { queue } = await controller.getOrCreateQueue();
      queueId = queue.id;
    }

    await controller.updateQueue(queueId, {
      repeat: input.repeat,
      shuffled: input.shuffled,
    });

    return jsonToolResult({
      success: true,
      queueId,
      repeat: input.repeat,
      shuffled: input.shuffled,
    });
  };
}
