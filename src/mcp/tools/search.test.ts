import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatSearchResult } from './search.ts';
import type { SearchResult } from '../../domain/types.ts';

const emptyResult: SearchResult = {
  tracks: [],
  albums: [],
  artists: [],
  playlists: [],
  trackingId: 'abc',
};

describe('formatSearchResult', () => {
  it('returns "No results found." for empty result', () => {
    assert.equal(formatSearchResult(emptyResult), 'No results found.');
  });

  it('includes "Did you mean" when present', () => {
    const result: SearchResult = { ...emptyResult, didYouMean: 'radiohead' };
    assert.match(formatSearchResult(result), /Did you mean: "radiohead"/);
  });

  it('formats tracks with explicit marker', () => {
    const result: SearchResult = {
      ...emptyResult,
      tracks: [
        {
          id: '1',
          title: 'Creep',
          duration: 'PT3M56S',
          explicit: true,
          isrc: 'GBAYE9200100',
          popularity: 0.9,
        },
      ],
    };
    const output = formatSearchResult(result);
    assert.match(output, /Creep/);
    assert.match(output, /\[E\]/);
    assert.match(output, /PT3M56S/);
  });

  it('formats albums with type and release date', () => {
    const result: SearchResult = {
      ...emptyResult,
      albums: [
        {
          id: '2',
          title: 'OK Computer',
          albumType: 'ALBUM',
          duration: 'PT52M',
          explicit: false,
          numberOfItems: 12,
          releaseDate: '1997-05-21',
          popularity: 0.95,
        },
      ],
    };
    const output = formatSearchResult(result);
    assert.match(output, /OK Computer/);
    assert.match(output, /ALBUM/);
    assert.match(output, /1997-05-21/);
  });

  it('formats artists with handle', () => {
    const result: SearchResult = {
      ...emptyResult,
      artists: [
        {
          id: '3',
          name: 'Radiohead',
          popularity: 0.92,
          handle: 'radiohead',
        },
      ],
    };
    const output = formatSearchResult(result);
    assert.match(output, /Radiohead/);
    assert.match(output, /@radiohead/);
  });

  it('formats playlists with type', () => {
    const result: SearchResult = {
      ...emptyResult,
      playlists: [
        {
          id: '4',
          name: 'Alt Rock Classics',
          playlistType: 'EDITORIAL',
        },
      ],
    };
    const output = formatSearchResult(result);
    assert.match(output, /Alt Rock Classics/);
    assert.match(output, /EDITORIAL/);
  });
});
