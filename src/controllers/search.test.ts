import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { SearchController } from './search.ts';
import type { TidalApiService } from '../services/tidal-api.ts';
import type { SearchResult } from '../domain/search.ts';

const emptyResult: SearchResult = {
  tracks: [],
  albums: [],
  artists: [],
  playlists: [],
  trackingId: 'test-tracking-id',
  query: 'radiohead',
  type: 'all',
  countryCode: 'US',
  limit: 10,
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
      explicitFilter: undefined,
      limit: 10,
    });
  });

  it('applies configured defaults when options omit them', async () => {
    const service = makeService();
    const controller = new SearchController(service, {
      countryCode: 'gb',
      explicitFilter: 'EXCLUDE',
      searchType: 'albums',
      limit: 3,
    });

    await controller.search({ query: 'radiohead' });

    // @ts-expect-error mock.fn has calls property
    const calls = service.search.mock.calls as { arguments: unknown[] }[];
    assert.deepEqual(calls[0]?.arguments[0], {
      query: 'radiohead',
      type: 'albums',
      countryCode: 'GB',
      explicitFilter: 'EXCLUDE',
      limit: 3,
    });
  });

  it('throws when limit is out of range', async () => {
    const controller = new SearchController(makeService());

    await assert.rejects(
      () => controller.search({ query: 'radiohead', limit: 100 }),
      /Limit must be an integer/,
    );
  });
});
