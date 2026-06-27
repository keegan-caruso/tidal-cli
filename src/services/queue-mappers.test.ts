import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  mapPlayQueueResponse,
  mapPlayQueuesResponse,
} from './queue-mappers.ts';

describe('mapPlayQueueResponse', () => {
  it('maps a play queue with current, future, and past tracks', () => {
    const doc = {
      data: {
        id: 'queue-1',
        type: 'playQueues' as const,
        attributes: {
          createdAt: '2025-01-01T00:00:00Z',
          lastModifiedAt: '2025-01-01T01:00:00Z',
          repeat: 'NONE' as const,
          shuffled: false,
        },
        relationships: {
          current: {
            data: {
              id: 'track-1',
              type: 'tracks' as const,
              meta: { itemId: 'item-1', batchId: 'batch-1' },
            },
          },
          future: {
            data: [
              {
                id: 'track-2',
                type: 'tracks' as const,
                meta: { itemId: 'item-2', batchId: 'batch-1' },
              },
            ],
          },
          past: {
            data: [
              {
                id: 'track-3',
                type: 'tracks' as const,
                meta: { itemId: 'item-3', batchId: 'batch-1' },
              },
            ],
          },
        },
      },
      included: [
        {
          id: 'track-1',
          type: 'tracks' as const,
          attributes: {
            title: 'Current Song',
            duration: 'PT3M30S',
            explicit: false,
            isrc: 'TEST001',
            popularity: 80,
          },
        },
        {
          id: 'track-2',
          type: 'tracks' as const,
          attributes: {
            title: 'Next Song',
            duration: 'PT4M00S',
            explicit: true,
            isrc: 'TEST002',
            popularity: 70,
          },
        },
        {
          id: 'track-3',
          type: 'tracks' as const,
          attributes: {
            title: 'Previous Song',
            duration: 'PT2M45S',
            explicit: false,
            isrc: 'TEST003',
            popularity: 60,
          },
        },
      ],
    };

    const result = mapPlayQueueResponse(doc);

    assert.strictEqual(result.queue.id, 'queue-1');
    assert.strictEqual(result.queue.createdAt, '2025-01-01T00:00:00Z');
    assert.strictEqual(result.queue.lastModifiedAt, '2025-01-01T01:00:00Z');
    assert.strictEqual(result.queue.repeat, 'none');
    assert.strictEqual(result.queue.shuffled, false);

    assert.ok(result.queue.current);
    assert.strictEqual(result.queue.current.track.title, 'Current Song');
    assert.strictEqual(result.queue.current.itemId, 'item-1');

    assert.strictEqual(result.queue.future.length, 1);
    assert.strictEqual(result.queue.future[0].track.title, 'Next Song');

    assert.strictEqual(result.queue.past.length, 1);
    assert.strictEqual(result.queue.past[0].track.title, 'Previous Song');
  });

  it('maps repeat mode ONE to "one"', () => {
    const doc = {
      data: {
        id: 'queue-1',
        type: 'playQueues' as const,
        attributes: {
          repeat: 'ONE' as const,
          shuffled: false,
        },
      },
      included: [],
    };

    const result = mapPlayQueueResponse(doc);
    assert.strictEqual(result.queue.repeat, 'one');
  });

  it('maps repeat mode BATCH to "all"', () => {
    const doc = {
      data: {
        id: 'queue-1',
        type: 'playQueues' as const,
        attributes: {
          repeat: 'BATCH' as const,
          shuffled: true,
        },
      },
      included: [],
    };

    const result = mapPlayQueueResponse(doc);
    assert.strictEqual(result.queue.repeat, 'all');
    assert.strictEqual(result.queue.shuffled, true);
  });

  it('handles missing current track', () => {
    const doc = {
      data: {
        id: 'queue-1',
        type: 'playQueues' as const,
        attributes: {
          repeat: 'NONE' as const,
          shuffled: false,
        },
        relationships: {},
      },
      included: [],
    };

    const result = mapPlayQueueResponse(doc);
    assert.strictEqual(result.queue.current, undefined);
    assert.deepStrictEqual(result.queue.future, []);
    assert.deepStrictEqual(result.queue.past, []);
  });

  it('filters out tracks not found in included', () => {
    const doc = {
      data: {
        id: 'queue-1',
        type: 'playQueues' as const,
        attributes: {
          repeat: 'NONE' as const,
          shuffled: false,
        },
        relationships: {
          future: {
            data: [
              {
                id: 'missing-track',
                type: 'tracks' as const,
                meta: { itemId: 'item-1', batchId: 'batch-1' },
              },
              {
                id: 'existing-track',
                type: 'tracks' as const,
                meta: { itemId: 'item-2', batchId: 'batch-1' },
              },
            ],
          },
        },
      },
      included: [
        {
          id: 'existing-track',
          type: 'tracks' as const,
          attributes: {
            title: 'Existing Track',
            duration: 'PT3M00S',
            explicit: false,
            isrc: 'TEST001',
            popularity: 50,
          },
        },
      ],
    };

    const result = mapPlayQueueResponse(doc);
    assert.strictEqual(result.queue.future.length, 1);
    assert.strictEqual(result.queue.future[0].track.title, 'Existing Track');
  });
});

describe('mapPlayQueuesResponse', () => {
  it('maps multiple play queues', () => {
    const doc = {
      data: [
        {
          id: 'queue-1',
          type: 'playQueues' as const,
          attributes: {
            createdAt: '2025-01-01T00:00:00Z',
            lastModifiedAt: '2025-01-01T01:00:00Z',
            repeat: 'NONE' as const,
            shuffled: false,
          },
        },
        {
          id: 'queue-2',
          type: 'playQueues' as const,
          attributes: {
            createdAt: '2025-01-02T00:00:00Z',
            lastModifiedAt: '2025-01-02T01:00:00Z',
            repeat: 'ONE' as const,
            shuffled: true,
          },
        },
      ],
      included: [],
    };

    const result = mapPlayQueuesResponse(doc);

    assert.strictEqual(result.queues.length, 2);
    assert.strictEqual(result.queues[0].id, 'queue-1');
    assert.strictEqual(result.queues[0].repeat, 'none');
    assert.strictEqual(result.queues[1].id, 'queue-2');
    assert.strictEqual(result.queues[1].repeat, 'one');
    assert.strictEqual(result.queues[1].shuffled, true);
  });

  it('handles empty queues list', () => {
    const doc = {
      data: [],
      included: [],
    };

    const result = mapPlayQueuesResponse(doc);
    assert.deepStrictEqual(result.queues, []);
  });
});
