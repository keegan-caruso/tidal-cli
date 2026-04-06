import { createAPIClient } from '@tidal-music/api';
import type { components } from '@tidal-music/api';
import type { CredentialsProvider } from '@tidal-music/common';
import type {
  SearchOptions,
  SearchResult,
  Track,
  Album,
  Artist,
  Playlist,
} from '../domain/types.ts';
import { SearchError } from '../domain/errors.ts';

export type ApiClient = ReturnType<typeof createAPIClient>;

export function createTidalApiService(client: ApiClient): TidalApiService {
  return new TidalApiService(client);
}

export function createApiClient(
  credentialsProvider: CredentialsProvider,
): ApiClient {
  return createAPIClient(credentialsProvider);
}

export class TidalApiService {
  private readonly client: ApiClient;

  constructor(client: ApiClient) {
    this.client = client;
  }

  async search(options: SearchOptions): Promise<SearchResult> {
    const include = buildIncludeList(options.type);

    const { data, error } = await this.client.GET('/searchResults/{id}', {
      params: {
        path: { id: options.query },
        query: {
          include,
          countryCode: options.countryCode ?? 'US',
          explicitFilter: options.explicitFilter,
        },
      },
    });

    if (error != null || data == null) {
      throw new SearchError(
        `Search failed for query "${options.query}"`,
        error,
      );
    }

    return mapSearchResponse(data);
  }
}

function buildIncludeList(type: SearchOptions['type']): string[] {
  if (type === 'all') return ['tracks', 'albums', 'artists', 'playlists'];
  return [type];
}

type SearchDocument =
  components['schemas']['SearchResults_Single_Resource_Data_Document'];

function mapSearchResponse(doc: SearchDocument): SearchResult {
  const included = doc.included ?? [];
  const attrs = doc.data.attributes;

  const tracks: Track[] = [];
  const albums: Album[] = [];
  const artists: Artist[] = [];
  const playlists: Playlist[] = [];

  for (const resource of included) {
    if (resource.type === 'tracks') {
      const r = resource as components['schemas']['Tracks_Resource_Object'];
      if (r.attributes != null) tracks.push(mapTrack(r.id, r.attributes));
    } else if (resource.type === 'albums') {
      const r = resource as components['schemas']['Albums_Resource_Object'];
      if (r.attributes != null) albums.push(mapAlbum(r.id, r.attributes));
    } else if (resource.type === 'artists') {
      const r = resource as components['schemas']['Artists_Resource_Object'];
      if (r.attributes != null) artists.push(mapArtist(r.id, r.attributes));
    } else if (resource.type === 'playlists') {
      const r = resource as components['schemas']['Playlists_Resource_Object'];
      if (r.attributes != null)
        playlists.push(mapPlaylist(r.id, r.attributes));
    }
  }

  return {
    tracks,
    albums,
    artists,
    playlists,
    didYouMean: attrs?.didYouMean,
    trackingId: attrs?.trackingId ?? '',
  };
}

function mapTrack(
  id: string,
  a: components['schemas']['Tracks_Attributes'],
): Track {
  return {
    id,
    title: a.title,
    duration: a.duration,
    explicit: a.explicit,
    isrc: a.isrc,
    popularity: a.popularity,
    bpm: a.bpm,
  };
}

function mapAlbum(
  id: string,
  a: components['schemas']['Albums_Attributes'],
): Album {
  return {
    id,
    title: a.title,
    albumType: a.albumType,
    duration: a.duration,
    explicit: a.explicit,
    numberOfItems: a.numberOfItems,
    releaseDate: a.releaseDate,
    popularity: a.popularity,
  };
}

function mapArtist(
  id: string,
  a: components['schemas']['Artists_Attributes'],
): Artist {
  return {
    id,
    name: a.name,
    popularity: a.popularity,
    handle: a.handle,
  };
}

function mapPlaylist(
  id: string,
  a: components['schemas']['Playlists_Attributes'],
): Playlist {
  return {
    id,
    name: a.name,
    description: a.description,
    playlistType: a.playlistType,
    numberOfItems: a.numberOfItems,
    duration: a.duration,
  };
}
