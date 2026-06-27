import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  mapDailyMixesResponse,
  mapDiscoveryMixesResponse,
  mapNewReleaseMixesResponse,
  mapCollectionTracksResponse,
  mapCollectionAlbumsResponse,
  mapCollectionArtistsResponse,
  mapCollectionPlaylistsResponse,
} from './user-mappers.ts';

describe('mapDailyMixesResponse', () => {
  it('extracts playlists from included resources', () => {
    const doc = {
      data: {
        id: 'me',
        type: 'userDailyMixes' as const,
      },
      included: [
        {
          id: 'playlist-1',
          type: 'playlists' as const,
          attributes: {
            name: 'Daily Mix 1',
            description: 'Your daily mix',
            playlistType: 'ARTIST' as const,
            numberOfItems: 50,
            duration: 'PT3H',
          },
        },
        {
          id: 'playlist-2',
          type: 'playlists' as const,
          attributes: {
            name: 'Daily Mix 2',
            description: 'Another daily mix',
            playlistType: 'ARTIST' as const,
            numberOfItems: 40,
            duration: 'PT2H30M',
          },
        },
      ],
    };

    const result = mapDailyMixesResponse(doc);

    assert.strictEqual(result.playlists.length, 2);
    assert.strictEqual(result.playlists[0].name, 'Daily Mix 1');
    assert.strictEqual(result.playlists[1].name, 'Daily Mix 2');
  });

  it('handles empty included array', () => {
    const doc = {
      data: {
        id: 'me',
        type: 'userDailyMixes' as const,
      },
      included: [],
    };

    const result = mapDailyMixesResponse(doc);
    assert.deepStrictEqual(result.playlists, []);
  });

  it('handles missing included array', () => {
    const doc = {
      data: {
        id: 'me',
        type: 'userDailyMixes' as const,
      },
    };

    const result = mapDailyMixesResponse(doc);
    assert.deepStrictEqual(result.playlists, []);
  });

  it('skips resources without attributes', () => {
    const doc = {
      data: {
        id: 'me',
        type: 'userDailyMixes' as const,
      },
      included: [
        {
          id: 'playlist-1',
          type: 'playlists' as const,
        },
      ],
    };

    const result = mapDailyMixesResponse(doc);
    assert.deepStrictEqual(result.playlists, []);
  });
});

describe('mapDiscoveryMixesResponse', () => {
  it('extracts playlists from included resources', () => {
    const doc = {
      data: {
        id: 'me',
        type: 'userDiscoveryMixes' as const,
      },
      included: [
        {
          id: 'playlist-1',
          type: 'playlists' as const,
          attributes: {
            name: 'Discovery Mix',
            description: 'New music for you',
            playlistType: 'DISCOVERY' as const,
            numberOfItems: 30,
            duration: 'PT1H30M',
          },
        },
      ],
    };

    const result = mapDiscoveryMixesResponse(doc);

    assert.strictEqual(result.playlists.length, 1);
    assert.strictEqual(result.playlists[0].name, 'Discovery Mix');
  });
});

describe('mapNewReleaseMixesResponse', () => {
  it('extracts playlists from included resources', () => {
    const doc = {
      data: {
        id: 'me',
        type: 'userNewReleaseMixes' as const,
      },
      included: [
        {
          id: 'playlist-1',
          type: 'playlists' as const,
          attributes: {
            name: 'New Releases',
            description: 'Fresh releases',
            playlistType: 'RELEASE' as const,
            numberOfItems: 25,
            duration: 'PT1H',
          },
        },
      ],
    };

    const result = mapNewReleaseMixesResponse(doc);

    assert.strictEqual(result.playlists.length, 1);
    assert.strictEqual(result.playlists[0].name, 'New Releases');
  });
});

describe('mapCollectionTracksResponse', () => {
  it('maps collection tracks with addedAt metadata', () => {
    const doc = {
      data: [
        {
          id: 'track-1',
          type: 'tracks' as const,
          meta: { addedAt: '2025-01-15T10:00:00Z' },
        },
      ],
      included: [
        {
          id: 'track-1',
          type: 'tracks' as const,
          attributes: {
            title: 'Saved Track',
            duration: 'PT3M30S',
            explicit: false,
            isrc: 'TEST001',
            popularity: 75,
          },
        },
      ],
      links: {},
    };

    const result = mapCollectionTracksResponse(doc);

    assert.strictEqual(result.items.length, 1);
    assert.strictEqual(result.items[0].item.title, 'Saved Track');
    assert.strictEqual(result.items[0].addedAt, '2025-01-15T10:00:00Z');
  });

  it('extracts cursor from next link', () => {
    const doc = {
      data: [],
      included: [],
      links: {
        next: 'https://api.tidal.com/v2/userCollectionTracks?page[cursor]=abc123',
      },
    };

    const result = mapCollectionTracksResponse(doc);
    assert.strictEqual(result.cursor, 'abc123');
  });

  it('handles missing next link', () => {
    const doc = {
      data: [],
      included: [],
      links: {},
    };

    const result = mapCollectionTracksResponse(doc);
    assert.strictEqual(result.cursor, undefined);
  });

  it('uses current date when addedAt is missing', () => {
    const doc = {
      data: [
        {
          id: 'track-1',
          type: 'tracks' as const,
        },
      ],
      included: [
        {
          id: 'track-1',
          type: 'tracks' as const,
          attributes: {
            title: 'Track',
            duration: 'PT3M',
            explicit: false,
            isrc: 'TEST001',
            popularity: 50,
          },
        },
      ],
      links: {},
    };

    const result = mapCollectionTracksResponse(doc);

    assert.strictEqual(result.items.length, 1);
    assert.ok(result.items[0].addedAt.includes('T'));
  });

  it('skips tracks not found in included', () => {
    const doc = {
      data: [
        {
          id: 'missing-track',
          type: 'tracks' as const,
          meta: { addedAt: '2025-01-15T10:00:00Z' },
        },
      ],
      included: [],
      links: {},
    };

    const result = mapCollectionTracksResponse(doc);
    assert.strictEqual(result.items.length, 0);
  });
});

describe('mapCollectionAlbumsResponse', () => {
  it('maps collection albums with addedAt metadata', () => {
    const doc = {
      data: [
        {
          id: 'album-1',
          type: 'albums' as const,
          meta: { addedAt: '2025-01-10T08:00:00Z' },
        },
      ],
      included: [
        {
          id: 'album-1',
          type: 'albums' as const,
          attributes: {
            title: 'Saved Album',
            albumType: 'ALBUM' as const,
            duration: 'PT45M',
            explicit: false,
            numberOfItems: 12,
            releaseDate: '2024-06-15',
            popularity: 85,
          },
        },
      ],
      links: {},
    };

    const result = mapCollectionAlbumsResponse(doc);

    assert.strictEqual(result.items.length, 1);
    assert.strictEqual(result.items[0].item.title, 'Saved Album');
    assert.strictEqual(result.items[0].addedAt, '2025-01-10T08:00:00Z');
  });

  it('extracts cursor from next link', () => {
    const doc = {
      data: [],
      included: [],
      links: {
        next: 'https://api.tidal.com/v2/userCollectionAlbums?page[cursor]=xyz789',
      },
    };

    const result = mapCollectionAlbumsResponse(doc);
    assert.strictEqual(result.cursor, 'xyz789');
  });
});

describe('mapCollectionArtistsResponse', () => {
  it('maps collection artists with addedAt metadata', () => {
    const doc = {
      data: [
        {
          id: 'artist-1',
          type: 'artists' as const,
          meta: { addedAt: '2025-01-05T12:00:00Z' },
        },
      ],
      included: [
        {
          id: 'artist-1',
          type: 'artists' as const,
          attributes: {
            name: 'Favorite Artist',
            popularity: 90,
            handle: 'favorite-artist',
          },
        },
      ],
      links: {},
    };

    const result = mapCollectionArtistsResponse(doc);

    assert.strictEqual(result.items.length, 1);
    assert.strictEqual(result.items[0].item.name, 'Favorite Artist');
    assert.strictEqual(result.items[0].addedAt, '2025-01-05T12:00:00Z');
  });

  it('skips artists not found in included', () => {
    const doc = {
      data: [
        {
          id: 'missing-artist',
          type: 'artists' as const,
          meta: { addedAt: '2025-01-05T12:00:00Z' },
        },
      ],
      included: [],
      links: {},
    };

    const result = mapCollectionArtistsResponse(doc);
    assert.strictEqual(result.items.length, 0);
  });
});

describe('mapCollectionPlaylistsResponse', () => {
  it('maps collection playlists with addedAt metadata', () => {
    const doc = {
      data: [
        {
          id: 'playlist-1',
          type: 'playlists' as const,
          meta: { addedAt: '2025-01-20T15:00:00Z' },
        },
      ],
      included: [
        {
          id: 'playlist-1',
          type: 'playlists' as const,
          attributes: {
            name: 'Saved Playlist',
            description: 'My favorite songs',
            playlistType: 'USER' as const,
            numberOfItems: 100,
            duration: 'PT5H',
          },
        },
      ],
      links: {},
    };

    const result = mapCollectionPlaylistsResponse(doc);

    assert.strictEqual(result.items.length, 1);
    assert.strictEqual(result.items[0].item.name, 'Saved Playlist');
    assert.strictEqual(result.items[0].addedAt, '2025-01-20T15:00:00Z');
  });

  it('extracts cursor from next link', () => {
    const doc = {
      data: [],
      included: [],
      links: {
        next: 'https://api.tidal.com/v2/userCollectionPlaylists?page[cursor]=cursor456',
      },
    };

    const result = mapCollectionPlaylistsResponse(doc);
    assert.strictEqual(result.cursor, 'cursor456');
  });

  it('handles invalid URL in next link', () => {
    const doc = {
      data: [],
      included: [],
      links: {
        next: 'not-a-valid-url',
      },
    };

    const result = mapCollectionPlaylistsResponse(doc);
    assert.strictEqual(result.cursor, undefined);
  });
});
