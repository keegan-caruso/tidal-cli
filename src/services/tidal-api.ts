import { createAPIClient } from '@tidal-music/api';
import type { CredentialsProvider } from '@tidal-music/common';
import type { Album, Artist, Playlist, Track } from '../domain/media.ts';
import type { ResolvedDetailOptions } from '../domain/detail.ts';
import type { ResolvedSearchOptions, SearchResult } from '../domain/search.ts';
import {
  ApiError,
  NetworkError,
  RateLimitError,
  SearchError,
} from '../domain/errors.ts';
import {
  buildSearchIncludeList,
  createIncludedIndex,
  limitSearchResult,
  mapAlbum,
  mapArtist,
  mapPlaylist,
  mapSearchResponse,
  mapTrack,
} from './tidal-mappers.ts';

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

  async search(options: ResolvedSearchOptions): Promise<SearchResult> {
    const include = buildSearchIncludeList(options.type);

    const { data } = await this.request(
      () =>
        this.client.GET('/searchResults/{id}', {
          params: {
            path: { id: options.query },
            query: {
              include,
              countryCode: options.countryCode,
              explicitFilter: options.explicitFilter,
            },
          },
        }),
      `Search failed for query "${options.query}"`,
    );

    if (data == null) {
      throw new SearchError(`Search failed for query "${options.query}"`);
    }

    return limitSearchResult(mapSearchResponse(data, options), options.limit);
  }

  async getTrack(options: ResolvedDetailOptions): Promise<Track> {
    const { data } = await this.request(
      () =>
        this.client.GET('/tracks/{id}', {
          params: {
            path: { id: options.id },
            query: {
              countryCode: options.countryCode,
              include: ['albums', 'artists'],
            },
          },
        }),
      `Failed to load track "${options.id}"`,
    );

    if (data?.data.attributes == null) {
      throw new ApiError(`Track "${options.id}" was not found`, 404);
    }

    const index = createIncludedIndex(data.included ?? []);
    return mapTrack(data.data.id, data.data.attributes, data.data, index);
  }

  async getAlbum(options: ResolvedDetailOptions): Promise<Album> {
    const { data } = await this.request(
      () =>
        this.client.GET('/albums/{id}', {
          params: {
            path: { id: options.id },
            query: {
              countryCode: options.countryCode,
              include: ['artists'],
            },
          },
        }),
      `Failed to load album "${options.id}"`,
    );

    if (data?.data.attributes == null) {
      throw new ApiError(`Album "${options.id}" was not found`, 404);
    }

    const index = createIncludedIndex(data.included ?? []);
    return mapAlbum(data.data.id, data.data.attributes, data.data, index);
  }

  async getArtist(options: ResolvedDetailOptions): Promise<Artist> {
    const { data } = await this.request(
      () =>
        this.client.GET('/artists/{id}', {
          params: {
            path: { id: options.id },
            query: { countryCode: options.countryCode },
          },
        }),
      `Failed to load artist "${options.id}"`,
    );

    if (data?.data.attributes == null) {
      throw new ApiError(`Artist "${options.id}" was not found`, 404);
    }

    return mapArtist(data.data.id, data.data.attributes);
  }

  async getPlaylist(options: ResolvedDetailOptions): Promise<Playlist> {
    const { data } = await this.request(
      () =>
        this.client.GET('/playlists/{id}', {
          params: {
            path: { id: options.id },
            query: { countryCode: options.countryCode },
          },
        }),
      `Failed to load playlist "${options.id}"`,
    );

    if (data?.data.attributes == null) {
      throw new ApiError(`Playlist "${options.id}" was not found`, 404);
    }

    return mapPlaylist(data.data.id, data.data.attributes);
  }

  private async request<T>(
    action: () => Promise<{ data?: T; error?: unknown; response: Response }>,
    message: string,
  ): Promise<{ data?: T }> {
    try {
      const { data, error, response } = await action();

      if (error != null) {
        if (response.status === 429) {
          throw new RateLimitError(message, error);
        }
        throw new ApiError(message, response.status, error);
      }

      return { data };
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new NetworkError(message, err);
    }
  }
}
