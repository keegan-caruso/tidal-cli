import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  mapSimilarArtistsResponse,
  mapSimilarTracksResponse,
  mapSimilarAlbumsResponse,
  mapArtistRadioResponse,
} from './recommendation-mappers.ts';

describe('mapSimilarArtistsResponse', () => {
  it('extracts artists from included resources', () => {
    const doc = {
      data: [
        { id: 'artist-1', type: 'artists' as const },
        { id: 'artist-2', type: 'artists' as const },
      ],
      included: [
        {
          id: 'artist-1',
          type: 'artists' as const,
          attributes: {
            name: 'Similar Artist 1',
            popularity: 80,
            handle: 'similar-artist-1',
          },
        },
        {
          id: 'artist-2',
          type: 'artists' as const,
          attributes: {
            name: 'Similar Artist 2',
            popularity: 75,
            handle: 'similar-artist-2',
          },
        },
      ],
    };

    const result = mapSimilarArtistsResponse(doc);

    assert.strictEqual(result.artists.length, 2);
    assert.strictEqual(result.artists[0].name, 'Similar Artist 1');
    assert.strictEqual(result.artists[0].popularity, 80);
    assert.strictEqual(result.artists[1].name, 'Similar Artist 2');
  });

  it('handles empty included array', () => {
    const doc = {
      data: [],
      included: [],
    };

    const result = mapSimilarArtistsResponse(doc);
    assert.deepStrictEqual(result.artists, []);
  });

  it('handles missing included array', () => {
    const doc = {
      data: [],
    };

    const result = mapSimilarArtistsResponse(doc);
    assert.deepStrictEqual(result.artists, []);
  });

  it('skips resources without attributes', () => {
    const doc = {
      data: [{ id: 'artist-1', type: 'artists' as const }],
      included: [
        {
          id: 'artist-1',
          type: 'artists' as const,
        },
      ],
    };

    const result = mapSimilarArtistsResponse(doc);
    assert.deepStrictEqual(result.artists, []);
  });
});

describe('mapSimilarTracksResponse', () => {
  it('extracts tracks from included resources', () => {
    const doc = {
      data: [
        { id: 'track-1', type: 'tracks' as const },
        { id: 'track-2', type: 'tracks' as const },
      ],
      included: [
        {
          id: 'track-1',
          type: 'tracks' as const,
          attributes: {
            title: 'Similar Track 1',
            duration: 'PT3M30S',
            explicit: false,
            isrc: 'TEST001',
            popularity: 70,
          },
        },
        {
          id: 'track-2',
          type: 'tracks' as const,
          attributes: {
            title: 'Similar Track 2',
            duration: 'PT4M15S',
            explicit: true,
            isrc: 'TEST002',
            popularity: 65,
          },
        },
      ],
    };

    const result = mapSimilarTracksResponse(doc);

    assert.strictEqual(result.tracks.length, 2);
    assert.strictEqual(result.tracks[0].title, 'Similar Track 1');
    assert.strictEqual(result.tracks[0].durationText, '3:30');
    assert.strictEqual(result.tracks[1].title, 'Similar Track 2');
    assert.strictEqual(result.tracks[1].explicit, true);
  });

  it('handles empty included array', () => {
    const doc = {
      data: [],
      included: [],
    };

    const result = mapSimilarTracksResponse(doc);
    assert.deepStrictEqual(result.tracks, []);
  });

  it('skips resources without attributes', () => {
    const doc = {
      data: [{ id: 'track-1', type: 'tracks' as const }],
      included: [
        {
          id: 'track-1',
          type: 'tracks' as const,
        },
      ],
    };

    const result = mapSimilarTracksResponse(doc);
    assert.deepStrictEqual(result.tracks, []);
  });
});

describe('mapSimilarAlbumsResponse', () => {
  it('extracts albums from included resources', () => {
    const doc = {
      data: [{ id: 'album-1', type: 'albums' as const }],
      included: [
        {
          id: 'album-1',
          type: 'albums' as const,
          attributes: {
            title: 'Similar Album',
            albumType: 'ALBUM' as const,
            duration: 'PT45M',
            explicit: false,
            numberOfItems: 12,
            releaseDate: '2024-05-01',
            popularity: 85,
          },
        },
      ],
    };

    const result = mapSimilarAlbumsResponse(doc);

    assert.strictEqual(result.albums.length, 1);
    assert.strictEqual(result.albums[0].title, 'Similar Album');
    assert.strictEqual(result.albums[0].albumType, 'ALBUM');
    assert.strictEqual(result.albums[0].releaseDate, '2024-05-01');
  });

  it('handles empty included array', () => {
    const doc = {
      data: [],
      included: [],
    };

    const result = mapSimilarAlbumsResponse(doc);
    assert.deepStrictEqual(result.albums, []);
  });

  it('skips resources without attributes', () => {
    const doc = {
      data: [{ id: 'album-1', type: 'albums' as const }],
      included: [
        {
          id: 'album-1',
          type: 'albums' as const,
        },
      ],
    };

    const result = mapSimilarAlbumsResponse(doc);
    assert.deepStrictEqual(result.albums, []);
  });
});

describe('mapArtistRadioResponse', () => {
  it('extracts tracks for artist radio', () => {
    const doc = {
      data: [
        { id: 'track-1', type: 'tracks' as const },
        { id: 'track-2', type: 'tracks' as const },
      ],
      included: [
        {
          id: 'track-1',
          type: 'tracks' as const,
          attributes: {
            title: 'Radio Track 1',
            duration: 'PT3M00S',
            explicit: false,
            isrc: 'RADIO001',
            popularity: 80,
          },
        },
        {
          id: 'track-2',
          type: 'tracks' as const,
          attributes: {
            title: 'Radio Track 2',
            duration: 'PT3M45S',
            explicit: false,
            isrc: 'RADIO002',
            popularity: 78,
          },
        },
      ],
    };

    const result = mapArtistRadioResponse(doc);

    assert.strictEqual(result.tracks.length, 2);
    assert.strictEqual(result.tracks[0].title, 'Radio Track 1');
    assert.strictEqual(result.tracks[1].title, 'Radio Track 2');
  });

  it('handles empty response', () => {
    const doc = {
      data: [],
      included: [],
    };

    const result = mapArtistRadioResponse(doc);
    assert.deepStrictEqual(result.tracks, []);
  });
});
