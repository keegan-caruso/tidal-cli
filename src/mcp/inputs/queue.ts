import { z } from 'zod';

export const getQueueToolSchema = {
  queueId: z
    .string()
    .optional()
    .describe('Queue ID to retrieve. If not provided, returns the active queue (or creates one).'),
};

export type GetQueueToolInput = {
  queueId?: string;
};

export const listQueuesToolSchema = {};

export type ListQueuesToolInput = Record<string, never>;

export const addToQueueToolSchema = {
  queueId: z
    .string()
    .optional()
    .describe('Queue ID to add tracks to. If not provided, uses the active queue.'),
  trackIds: z
    .array(z.string())
    .min(1)
    .describe('Array of track IDs to add to the queue'),
  position: z
    .enum(['next', 'last'])
    .optional()
    .describe('Where to add tracks: "next" (play next) or "last" (end of queue). Default: "last"'),
};

export type AddToQueueToolInput = {
  queueId?: string;
  trackIds: string[];
  position?: 'next' | 'last';
};

export const removeFromQueueToolSchema = {
  queueId: z
    .string()
    .optional()
    .describe('Queue ID to remove track from. If not provided, uses the active queue.'),
  trackId: z
    .string()
    .describe('Track ID to remove'),
  itemId: z
    .string()
    .describe('Item ID of the specific queue entry to remove (from the queue response)'),
};

export type RemoveFromQueueToolInput = {
  queueId?: string;
  trackId: string;
  itemId: string;
};

export const clearQueueToolSchema = {
  queueId: z
    .string()
    .optional()
    .describe('Queue ID to clear. If not provided, uses the active queue.'),
};

export type ClearQueueToolInput = {
  queueId?: string;
};

export const skipToTrackToolSchema = {
  queueId: z
    .string()
    .optional()
    .describe('Queue ID. If not provided, uses the active queue.'),
  trackId: z
    .string()
    .describe('Track ID to skip to'),
  itemId: z
    .string()
    .describe('Item ID of the specific queue entry to skip to'),
};

export type SkipToTrackToolInput = {
  queueId?: string;
  trackId: string;
  itemId: string;
};

export const updateQueueToolSchema = {
  queueId: z
    .string()
    .optional()
    .describe('Queue ID to update. If not provided, uses the active queue.'),
  repeat: z
    .enum(['none', 'one', 'all'])
    .optional()
    .describe('Repeat mode: "none" (off), "one" (repeat current track), "all" (repeat all)'),
  shuffled: z
    .boolean()
    .optional()
    .describe('Enable or disable shuffle mode'),
};

export type UpdateQueueToolInput = {
  queueId?: string;
  repeat?: 'none' | 'one' | 'all';
  shuffled?: boolean;
};
