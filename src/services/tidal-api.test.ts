import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { RateLimitError } from '../domain/errors.ts';
import { TidalApiService } from './tidal-api.ts';

function makeClient(response: unknown) {
  return {
    GET: mock.fn(async () => response),
  };
}

describe('TidalApiService', () => {
  it('maps rich search results and applies per-category limits', async () => {
    const client = makeClient({
      data: {
        data: {
          attributes: {
            trackingId: 'tracking',
          },
        },
        included: [
          track('1', 'First'),
          track('2', 'Second'),
          artist('3', 'Radiohead'),
          album('4', 'OK Computer'),
        ],
      },
      response: new Response(null, { status: 200 }),
    });
    const service = new TidalApiService(client as never);

    const result = await service.search({
      query: 'radiohead',
      type: 'all',
      countryCode: 'US',
      limit: 1,
    });

    assert.equal(result.tracks.length, 1);
    assert.equal(result.tracks[0]?.durationText, '3:56');
    assert.equal(result.tracks[0]?.url, 'https://tidal.com/share/track/1');
    assert.equal(result.albums.length, 1);
    assert.equal(result.artists.length, 1);
    assert.equal(result.limit, 1);
  });

  it('maps playlists in search results', async () => {
    const client = makeClient({
      data: {
        data: {
          attributes: {
            trackingId: 'tracking',
          },
        },
        included: [playlist('1', 'Best of 2024')],
      },
      response: new Response(null, { status: 200 }),
    });
    const service = new TidalApiService(client as never);

    const result = await service.search({
      query: 'best of',
      type: 'all',
      countryCode: 'US',
      limit: 10,
    });

    assert.equal(result.playlists.length, 1);
    assert.equal(result.playlists[0]?.name, 'Best of 2024');
    assert.equal(result.playlists[0]?.playlistType, 'EDITORIAL');
  });

  it('maps track relationships to artists and albums', async () => {
    const client = makeClient({
      data: {
        data: {
          attributes: {
            trackingId: 'tracking',
          },
        },
        included: [
          trackWithRelationships('1', 'Karma Police', ['3'], ['4']),
          artist('3', 'Radiohead'),
          album('4', 'OK Computer'),
        ],
      },
      response: new Response(null, { status: 200 }),
    });
    const service = new TidalApiService(client as never);

    const result = await service.search({
      query: 'karma police',
      type: 'tracks',
      countryCode: 'US',
      limit: 10,
    });

    assert.equal(result.tracks.length, 1);
    assert.equal(result.tracks[0]?.artists.length, 1);
    assert.equal(result.tracks[0]?.artists[0]?.name, 'Radiohead');
    assert.equal(result.tracks[0]?.albums.length, 1);
    assert.equal(result.tracks[0]?.albums[0]?.name, 'OK Computer');
  });

  it('maps rate limit responses to RateLimitError', async () => {
    const client = makeClient({
      error: { errors: [{ status: '429' }] },
      response: new Response(null, { status: 429 }),
    });
    const service = new TidalApiService(client as never);

    await assert.rejects(
      () =>
        service.search({
          query: 'radiohead',
          type: 'tracks',
          countryCode: 'US',
          limit: 10,
        }),
      (err: unknown) => {
        assert(err instanceof RateLimitError);
        return true;
      },
    );
  });
});

function track(id: string, title: string) {
  return {
    id,
    type: 'tracks',
    attributes: {
      title,
      duration: 'PT3M56S',
      explicit: true,
      isrc: `isrc-${id}`,
      popularity: 0.9,
      key: 'UNKNOWN',
      keyScale: 'UNKNOWN',
      mediaTags: [],
      externalLinks: [
        {
          href: `https://tidal.com/share/track/${id}`,
          meta: { type: 'TIDAL_SHARING' },
        },
      ],
    },
  };
}

function artist(id: string, name: string) {
  return {
    id,
    type: 'artists',
    attributes: {
      name,
      popularity: 0.9,
      externalLinks: [],
    },
  };
}

function album(id: string, title: string) {
  return {
    id,
    type: 'albums',
    attributes: {
      title,
      albumType: 'ALBUM',
      duration: 'PT52M',
      explicit: false,
      numberOfItems: 12,
      numberOfVolumes: 1,
      popularity: 0.9,
      barcodeId: 'barcode',
      mediaTags: [],
      externalLinks: [],
    },
  };
}

function playlist(id: string, name: string) {
  return {
    id,
    type: 'playlists',
    attributes: {
      name,
      description: 'A great playlist',
      playlistType: 'EDITORIAL',
      numberOfItems: 50,
      duration: 'PT3H',
      externalLinks: [],
    },
  };
}

function trackWithRelationships(
  id: string,
  title: string,
  artistIds: string[],
  albumIds: string[],
) {
  return {
    id,
    type: 'tracks',
    attributes: {
      title,
      duration: 'PT4M21S',
      explicit: false,
      isrc: `isrc-${id}`,
      popularity: 0.95,
      externalLinks: [],
    },
    relationships: {
      artists: {
        data: artistIds.map((aid) => ({ id: aid, type: 'artists' })),
      },
      albums: {
        data: albumIds.map((aid) => ({ id: aid, type: 'albums' })),
      },
    },
  };
}
