import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { collectOpenableResults, formatCliSearchResult } from './search.ts';
import type { SearchResult } from '../../domain/search.ts';

const result: SearchResult = {
  tracks: [
    {
      id: '1',
      title: 'Creep',
      duration: 'PT3M56S',
      durationText: '3:56',
      explicit: true,
      isrc: 'GBAYE9200100',
      popularity: 0.9,
      url: 'https://tidal.com/track/1',
      externalLinks: [],
      artists: [{ id: '3', type: 'artists', name: 'Radiohead' }],
      albums: [{ id: '2', type: 'albums', name: 'Pablo Honey' }],
    },
  ],
  albums: [
    {
      id: '2',
      title: 'OK Computer',
      albumType: 'ALBUM',
      duration: 'PT52M',
      durationText: '52:00',
      explicit: false,
      numberOfItems: 12,
      releaseDate: '1997-05-21',
      popularity: 0.95,
      url: 'https://tidal.com/album/2',
      externalLinks: [],
      artists: [{ id: '3', type: 'artists', name: 'Radiohead' }],
    },
  ],
  artists: [
    {
      id: '3',
      name: 'Radiohead',
      popularity: 0.92,
      handle: 'radiohead',
      url: 'https://tidal.com/artist/3',
      externalLinks: [],
    },
  ],
  playlists: [
    {
      id: '4',
      name: 'Alt Rock Classics',
      playlistType: 'EDITORIAL',
      numberOfItems: 50,
      durationText: '3:00:00',
      url: 'https://tidal.com/playlist/4',
      externalLinks: [],
    },
  ],
  trackingId: 'abc',
  query: 'radiohead',
  type: 'all',
  countryCode: 'US',
  limit: 10,
};

describe('formatCliSearchResult', () => {
  it('formats richer text output', () => {
    const output = formatCliSearchResult(result);

    assert.match(output, /Tracks \(1\):/);
    assert.match(output, /Creep \[E\] - Radiohead \(Pablo Honey\) - 3:56/);
    assert.match(output, /OK Computer - Radiohead - ALBUM - 1997-05-21/);
    assert.match(output, /Radiohead @radiohead/);
    assert.match(output, /Alt Rock Classics - EDITORIAL - 50 tracks/);
    assert.match(output, /https:\/\/tidal.com\/track\/1/);
  });

  it('returns no-results text for empty result', () => {
    assert.equal(
      formatCliSearchResult({
        tracks: [],
        albums: [],
        artists: [],
        playlists: [],
        trackingId: 'abc',
        query: 'missing',
        type: 'all',
        countryCode: 'US',
        limit: 10,
      }),
      'No results found.\n',
    );
  });
});

describe('collectOpenableResults', () => {
  it('returns openable URLs in display order', () => {
    assert.deepEqual(collectOpenableResults(result), [
      { label: 'Track: Creep', url: 'https://tidal.com/track/1' },
      { label: 'Album: OK Computer', url: 'https://tidal.com/album/2' },
      { label: 'Artist: Radiohead', url: 'https://tidal.com/artist/3' },
      {
        label: 'Playlist: Alt Rock Classics',
        url: 'https://tidal.com/playlist/4',
      },
    ]);
  });
});
