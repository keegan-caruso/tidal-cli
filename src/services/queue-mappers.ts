import type { components } from '@tidal-music/api';
import type { PlayQueue, QueueItem, RepeatMode } from '../domain/queue.ts';
import type { Track } from '../domain/media.ts';
import { createIncludedIndex, mapTrack } from './tidal-mappers.ts';

type PlayQueueSingleDoc =
  components['schemas']['PlayQueues_Single_Resource_Data_Document'];
type PlayQueueMultiDoc =
  components['schemas']['PlayQueues_Multi_Resource_Data_Document'];
type PlayQueueResource = components['schemas']['PlayQueues_Resource_Object'];
type IncludedResource = components['schemas']['Included'][number];

export interface PlayQueueResult {
  queue: PlayQueue;
}

export interface PlayQueuesResult {
  queues: PlayQueue[];
}

export function mapPlayQueueResponse(doc: PlayQueueSingleDoc): PlayQueueResult {
  const index = createIncludedIndex(doc.included ?? []);
  return {
    queue: mapPlayQueue(doc.data, index),
  };
}

export function mapPlayQueuesResponse(
  doc: PlayQueueMultiDoc,
): PlayQueuesResult {
  const index = createIncludedIndex(doc.included ?? []);
  return {
    queues: doc.data.map((q) => mapPlayQueue(q, index)),
  };
}

function mapPlayQueue(
  resource: PlayQueueResource,
  index: Map<string, IncludedResource>,
): PlayQueue {
  const attrs = resource.attributes;
  const rels = resource.relationships;

  return {
    id: resource.id,
    createdAt: attrs?.createdAt ?? '',
    lastModifiedAt: attrs?.lastModifiedAt ?? '',
    repeat: mapRepeatMode(attrs?.repeat),
    shuffled: attrs?.shuffled ?? false,
    current: mapCurrentItem(rels?.current?.data, index),
    future: mapQueueItems(rels?.future?.data, index),
    past: mapQueueItems(rels?.past?.data, index),
  };
}

function mapRepeatMode(mode?: 'NONE' | 'ONE' | 'BATCH'): RepeatMode {
  switch (mode) {
    case 'ONE':
      return 'one';
    case 'BATCH':
      return 'all';
    default:
      return 'none';
  }
}

function mapCurrentItem(
  data:
    components['schemas']['PlayQueues_Current_Resource_Identifier'] | undefined,
  index: Map<string, IncludedResource>,
): QueueItem | undefined {
  if (data == null) return undefined;

  const track = getTrackFromIndex(data.id, index);
  if (track == null) return undefined;

  return {
    track,
    itemId: data.meta?.itemId ?? '',
    batchId: data.meta?.batchId ?? '',
  };
}

function mapQueueItems(
  data:
    | (
        | components['schemas']['PlayQueues_Future_Resource_Identifier']
        | components['schemas']['PlayQueues_Past_Resource_Identifier']
      )[]
    | undefined,
  index: Map<string, IncludedResource>,
): QueueItem[] {
  if (data == null) return [];

  return data
    .map((item) => {
      const track = getTrackFromIndex(item.id, index);
      if (track == null) return null;

      return {
        track,
        itemId: item.meta?.itemId ?? '',
        batchId: item.meta?.batchId ?? '',
      };
    })
    .filter((item): item is QueueItem => item != null);
}

function getTrackFromIndex(
  trackId: string,
  index: Map<string, IncludedResource>,
): Track | undefined {
  const key = `tracks:${trackId}`;
  const resource = index.get(key);

  if (resource?.type !== 'tracks') return undefined;

  const trackResource = resource;
  if (trackResource.attributes == null) return undefined;

  return mapTrack(
    trackResource.id,
    trackResource.attributes,
    trackResource,
    index,
  );
}
