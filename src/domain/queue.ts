import type { Track } from './media.ts';

export type RepeatMode = 'none' | 'one' | 'all';

export interface QueueItem {
  track: Track;
  itemId: string;
  batchId: string;
}

export interface PlayQueue {
  id: string;
  createdAt: string;
  lastModifiedAt: string;
  repeat: RepeatMode;
  shuffled: boolean;
  current?: QueueItem;
  future: QueueItem[];
  past: QueueItem[];
}

export interface QueueOptions {
  include?: ('current' | 'future' | 'past')[];
}

export interface AddToQueueOptions {
  trackIds: string[];
  position?: 'next' | 'last'; // 'next' adds after current, 'last' adds to end
}

export interface SetCurrentOptions {
  trackId: string;
  itemId?: string; // If track appears multiple times, specify which one
}

export interface UpdateQueueOptions {
  repeat?: RepeatMode;
  shuffled?: boolean;
}
