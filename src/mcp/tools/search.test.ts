import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createSearchToolHandler } from './search.ts';
import {
  createGetAlbumToolHandler,
  createGetArtistToolHandler,
  createGetPlaylistToolHandler,
  createGetTrackToolHandler,
} from './detail.ts';
import { formatSearchResult } from '../format.ts';
import type { SearchResult } from '../../domain/search.ts';

const emptyResult: SearchResult = {
  tracks: [],
  albums: [],
  artists: [],
  playlists: [],
  trackingId: 'abc',
  query: 'radiohead',
  type: 'all',
  countryCode: 'US',
  limit: 10,
};

describe('formatSearchResult', () => {
  it('returns JSON for empty result', () => {
    assert.equal(
      formatSearchResult(emptyResult),
      JSON.stringify(emptyResult, null, 2),
    );
  });

  it('includes "Did you mean" when present', () => {
    const result: SearchResult = { ...emptyResult, didYouMean: 'radiohead' };
    assert.deepEqual(JSON.parse(formatSearchResult(result)), result);
  });

  it('formats tracks with explicit marker', () => {
    const result: SearchResult = {
      ...emptyResult,
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
          artists: [],
          albums: [],
        },
      ],
    };
    const output = formatSearchResult(result);
    const parsed = JSON.parse(output);
    assert.equal(parsed.tracks[0].title, 'Creep');
    assert.equal(parsed.tracks[0].explicit, true);
    assert.equal(parsed.tracks[0].durationText, '3:56');
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
          durationText: '52:00',
          explicit: false,
          numberOfItems: 12,
          releaseDate: '1997-05-21',
          popularity: 0.95,
          url: 'https://tidal.com/album/2',
          externalLinks: [],
          artists: [],
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
          url: 'https://tidal.com/artist/3',
          externalLinks: [],
        },
      ],
    };
    const output = formatSearchResult(result);
    const parsed = JSON.parse(output);
    assert.equal(parsed.artists[0].name, 'Radiohead');
    assert.equal(parsed.artists[0].handle, 'radiohead');
  });

  it('formats playlists with type', () => {
    const result: SearchResult = {
      ...emptyResult,
      playlists: [
        {
          id: '4',
          name: 'Alt Rock Classics',
          playlistType: 'EDITORIAL',
          url: 'https://tidal.com/playlist/4',
          externalLinks: [],
        },
      ],
    };
    const output = formatSearchResult(result);
    assert.match(output, /Alt Rock Classics/);
    assert.match(output, /EDITORIAL/);
  });
});

describe('MCP handlers', () => {
  it('returns structured JSON content for search', async () => {
    const controller = {
      search: async () => emptyResult,
    };

    const result = await createSearchToolHandler(
      // @ts-expect-error only search is needed for this handler test
      controller,
    )({ query: 'radiohead' });

    assert.deepEqual(result.structuredContent, emptyResult);
    assert.equal(result.content[0]?.type, 'text');
    assert.equal(result.content[0]?.text, JSON.stringify(emptyResult, null, 2));
  });

  it('returns structured JSON content for detail handlers', async () => {
    const track = {
      id: '1',
      title: 'Creep',
      duration: 'PT3M56S',
      durationText: '3:56',
      explicit: true,
      isrc: 'GBAYE9200100',
      popularity: 0.9,
      url: 'https://tidal.com/track/1',
      externalLinks: [],
      artists: [],
      albums: [],
    };
    const album = {
      id: '2',
      title: 'OK Computer',
      albumType: 'ALBUM',
      duration: 'PT52M',
      durationText: '52:00',
      explicit: false,
      numberOfItems: 12,
      popularity: 0.95,
      url: 'https://tidal.com/album/2',
      externalLinks: [],
      artists: [],
    };
    const artist = {
      id: '3',
      name: 'Radiohead',
      popularity: 0.92,
      url: 'https://tidal.com/artist/3',
      externalLinks: [],
    };
    const playlist = {
      id: '4',
      name: 'Alt Rock Classics',
      playlistType: 'EDITORIAL',
      url: 'https://tidal.com/playlist/4',
      externalLinks: [],
    };
    const controller = {
      getTrack: async () => track,
      getAlbum: async () => album,
      getArtist: async () => artist,
      getPlaylist: async () => playlist,
    };

    assert.deepEqual(
      (
        await createGetTrackToolHandler(
          // @ts-expect-error only getTrack is needed for this handler test
          controller,
        )({ id: '1' })
      ).structuredContent,
      { track },
    );
    assert.deepEqual(
      (
        await createGetAlbumToolHandler(
          // @ts-expect-error only getAlbum is needed for this handler test
          controller,
        )({ id: '2' })
      ).structuredContent,
      { album },
    );
    assert.deepEqual(
      (
        await createGetArtistToolHandler(
          // @ts-expect-error only getArtist is needed for this handler test
          controller,
        )({ id: '3' })
      ).structuredContent,
      { artist },
    );
    assert.deepEqual(
      (
        await createGetPlaylistToolHandler(
          // @ts-expect-error only getPlaylist is needed for this handler test
          controller,
        )({ id: '4' })
      ).structuredContent,
      { playlist },
    );
  });
});
