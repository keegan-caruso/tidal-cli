import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { SearchController } from './search.js';
import type { TidalApiService } from '../services/tidal-api.js';
import type { SearchResult } from '../domain/types.js';

const emptyResult: SearchResult = {
  tracks: [],
  albums: [],
  artists: [],
  playlists: [],
  trackingId: 'test-tracking-id',
};

function makeService(result: SearchResult = emptyResult): TidalApiService {
  return {
    search: mock.fn(async () => result),
  } as unknown as TidalApiService;
}

describe('SearchController', () => {
  it('throws when query is empty', async () => {
    const controller = new SearchController(makeService());

    await assert.rejects(
      () => controller.search({ query: '', type: 'all' }),
      /cannot be empty/,
    );
  });

  it('throws when query is only whitespace', async () => {
    const controller = new SearchController(makeService());

    await assert.rejects(
      () => controller.search({ query: '   ', type: 'all' }),
      /cannot be empty/,
    );
  });

  it('delegates to apiService.search with correct options', async () => {
    const service = makeService();
    const controller = new SearchController(service);

    const result = await controller.search({
      query: 'radiohead',
      type: 'tracks',
      countryCode: 'GB',
    });

    assert.deepEqual(result, emptyResult);
    // @ts-expect-error mock.fn has calls property
    const calls = service.search.mock.calls as { arguments: unknown[] }[];
    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0]?.arguments[0], {
      query: 'radiohead',
      type: 'tracks',
      countryCode: 'GB',
    });
  });
});
