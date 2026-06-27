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
import {
  type MixesResult,
  type CollectionTracksResult,
  type CollectionAlbumsResult,
  type CollectionArtistsResult,
  type CollectionPlaylistsResult,
  mapDailyMixesResponse,
  mapDiscoveryMixesResponse,
  mapNewReleaseMixesResponse,
  mapCollectionTracksResponse,
  mapCollectionAlbumsResponse,
  mapCollectionArtistsResponse,
  mapCollectionPlaylistsResponse,
} from './user-mappers.ts';
import type { CollectionSort } from '../domain/user.ts';
import type { RepeatMode } from '../domain/queue.ts';
import {
  type PlayQueueResult,
  type PlayQueuesResult,
  mapPlayQueueResponse,
  mapPlayQueuesResponse,
} from './queue-mappers.ts';
import {
  type SimilarArtistsResult,
  type SimilarTracksResult,
  type SimilarAlbumsResult,
  type ArtistRadioResult,
  mapSimilarArtistsResponse,
  mapSimilarTracksResponse,
  mapSimilarAlbumsResponse,
  mapArtistRadioResponse,
} from './recommendation-mappers.ts';

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

  async getDailyMixes(locale?: string): Promise<MixesResult> {
    const { data } = await this.request(
      () =>
        this.client.GET('/userDailyMixes/{id}', {
          params: {
            path: { id: 'me' },
            query: {
              include: ['items'],
              locale,
            },
          },
        }),
      'Failed to load daily mixes',
    );

    if (data == null) {
      return { playlists: [] };
    }

    return mapDailyMixesResponse(data);
  }

  async getDiscoveryMixes(locale?: string): Promise<MixesResult> {
    const { data } = await this.request(
      () =>
        this.client.GET('/userDiscoveryMixes/{id}', {
          params: {
            path: { id: 'me' },
            query: {
              include: ['items'],
              locale,
            },
          },
        }),
      'Failed to load discovery mixes',
    );

    if (data == null) {
      return { playlists: [] };
    }

    return mapDiscoveryMixesResponse(data);
  }

  async getNewReleaseMixes(locale?: string): Promise<MixesResult> {
    const { data } = await this.request(
      () =>
        this.client.GET('/userNewReleaseMixes/{id}', {
          params: {
            path: { id: 'me' },
            query: {
              include: ['items'],
              locale,
            },
          },
        }),
      'Failed to load new release mixes',
    );

    if (data == null) {
      return { playlists: [] };
    }

    return mapNewReleaseMixesResponse(data);
  }

  async getCollectionTracks(
    sort: CollectionSort = '-addedAt',
    locale?: string,
  ): Promise<CollectionTracksResult> {
    const { data } = await this.request(
      () =>
        this.client.GET('/userCollectionTracks/{id}/relationships/items', {
          params: {
            path: { id: 'me' },
            query: {
              include: ['items'],
              sort: [sort],
              locale,
            },
          },
        }),
      'Failed to load collection tracks',
    );

    if (data == null) {
      return { items: [] };
    }

    return mapCollectionTracksResponse(data);
  }

  async getCollectionAlbums(
    sort: CollectionSort = '-addedAt',
    locale?: string,
  ): Promise<CollectionAlbumsResult> {
    const { data } = await this.request(
      () =>
        this.client.GET('/userCollectionAlbums/{id}/relationships/items', {
          params: {
            path: { id: 'me' },
            query: {
              include: ['items'],
              sort: [sort],
              locale,
            },
          },
        }),
      'Failed to load collection albums',
    );

    if (data == null) {
      return { items: [] };
    }

    return mapCollectionAlbumsResponse(data);
  }

  async getCollectionArtists(
    sort: CollectionSort = '-addedAt',
    locale?: string,
  ): Promise<CollectionArtistsResult> {
    const { data } = await this.request(
      () =>
        this.client.GET('/userCollectionArtists/{id}/relationships/items', {
          params: {
            path: { id: 'me' },
            query: {
              include: ['items'],
              sort: [sort],
              locale,
            },
          },
        }),
      'Failed to load collection artists',
    );

    if (data == null) {
      return { items: [] };
    }

    return mapCollectionArtistsResponse(data);
  }

  async getCollectionPlaylists(
    sort: CollectionSort = '-addedAt',
    locale?: string,
  ): Promise<CollectionPlaylistsResult> {
    const { data } = await this.request(
      () =>
        this.client.GET('/userCollectionPlaylists/{id}/relationships/items', {
          params: {
            path: { id: 'me' },
            query: {
              include: ['items'],
              sort: [sort],
              locale,
            },
          },
        }),
      'Failed to load collection playlists',
    );

    if (data == null) {
      return { items: [] };
    }

    return mapCollectionPlaylistsResponse(data);
  }

  // ==================== Play Queue Methods ====================

  async getPlayQueues(): Promise<PlayQueuesResult> {
    const { data } = await this.request(
      () =>
        this.client.GET('/playQueues', {
          params: {
            query: {
              'filter[owners.id]': ['me'],
              include: ['current', 'future', 'past'],
            },
          },
        }),
      'Failed to load play queues',
    );

    if (data == null) {
      return { queues: [] };
    }

    return mapPlayQueuesResponse(data);
  }

  async getPlayQueue(
    queueId: string,
    include: ('current' | 'future' | 'past')[] = ['current', 'future', 'past'],
  ): Promise<PlayQueueResult> {
    const { data } = await this.request(
      () =>
        this.client.GET('/playQueues/{id}', {
          params: {
            path: { id: queueId },
            query: { include },
          },
        }),
      `Failed to load play queue "${queueId}"`,
    );

    if (data == null) {
      throw new ApiError(`Play queue "${queueId}" was not found`, 404);
    }

    return mapPlayQueueResponse(data);
  }

  async createPlayQueue(): Promise<PlayQueueResult> {
    const { data } = await this.request(
      () =>
        this.client.POST('/playQueues', {
          body: {
            data: { type: 'playQueues' },
          },
        }),
      'Failed to create play queue',
    );

    if (data == null) {
      throw new ApiError('Failed to create play queue', 500);
    }

    return mapPlayQueueResponse(data);
  }

  async deletePlayQueue(queueId: string): Promise<void> {
    await this.request(
      () =>
        this.client.DELETE('/playQueues/{id}', {
          params: {
            path: { id: queueId },
          },
        }),
      `Failed to delete play queue "${queueId}"`,
    );
  }

  async updatePlayQueue(
    queueId: string,
    options: { repeat?: RepeatMode; shuffled?: boolean },
  ): Promise<void> {
    const repeatMap: Record<RepeatMode, 'NONE' | 'ONE' | 'BATCH'> = {
      none: 'NONE',
      one: 'ONE',
      all: 'BATCH',
    };

    await this.request(
      () =>
        this.client.PATCH('/playQueues/{id}', {
          params: {
            path: { id: queueId },
          },
          body: {
            data: {
              type: 'playQueues',
              id: queueId,
              attributes: {
                repeat: options.repeat != null ? repeatMap[options.repeat] : undefined,
                shuffled: options.shuffled,
              },
            },
          },
        }),
      `Failed to update play queue "${queueId}"`,
    );
  }

  async addToQueue(
    queueId: string,
    trackIds: string[],
    mode: 'next' | 'last' = 'last',
  ): Promise<void> {
    const modeMap = {
      next: 'ADD_TO_FRONT' as const,
      last: 'ADD_TO_BACK' as const,
    };

    await this.request(
      () =>
        this.client.POST('/playQueues/{id}/relationships/future', {
          params: {
            path: { id: queueId },
          },
          body: {
            data: trackIds.map((id) => ({
              type: 'tracks' as const,
              id,
            })),
            meta: {
              mode: modeMap[mode],
            },
          },
        }),
      `Failed to add tracks to queue "${queueId}"`,
    );
  }

  async removeFromQueue(
    queueId: string,
    items: { trackId: string; itemId: string }[],
  ): Promise<void> {
    await this.request(
      () =>
        this.client.DELETE('/playQueues/{id}/relationships/future', {
          params: {
            path: { id: queueId },
          },
          body: {
            data: items.map(({ trackId, itemId }) => ({
              type: 'tracks' as const,
              id: trackId,
              meta: { itemId },
            })),
          },
        }),
      `Failed to remove tracks from queue "${queueId}"`,
    );
  }

  async setCurrentTrack(
    queueId: string,
    trackId: string,
    itemId: string,
  ): Promise<void> {
    await this.request(
      () =>
        this.client.PATCH('/playQueues/{id}/relationships/current', {
          params: {
            path: { id: queueId },
          },
          body: {
            data: {
              type: 'tracks' as const,
              id: trackId,
              meta: { itemId },
            },
          },
        }),
      `Failed to set current track in queue "${queueId}"`,
    );
  }

  async clearQueue(queueId: string): Promise<void> {
    // Get the queue first to know what items to remove
    const queue = await this.getPlayQueue(queueId, ['future']);

    if (queue.queue.future.length === 0) {
      return; // Nothing to clear
    }

    await this.removeFromQueue(
      queueId,
      queue.queue.future.map((item) => ({
        trackId: item.track.id,
        itemId: item.itemId,
      })),
    );
  }

  // ==================== Recommendation Methods ====================

  async getSimilarArtists(
    artistId: string,
    countryCode?: string,
  ): Promise<SimilarArtistsResult> {
    const { data } = await this.request(
      () =>
        this.client.GET('/artists/{id}/relationships/similarArtists', {
          params: {
            path: { id: artistId },
            query: {
              countryCode,
              include: ['similarArtists'],
            },
          },
        }),
      `Failed to load similar artists for "${artistId}"`,
    );

    if (data == null) {
      return { artists: [] };
    }

    return mapSimilarArtistsResponse(data);
  }

  async getSimilarTracks(
    trackId: string,
    countryCode?: string,
  ): Promise<SimilarTracksResult> {
    const { data } = await this.request(
      () =>
        this.client.GET('/tracks/{id}/relationships/similarTracks', {
          params: {
            path: { id: trackId },
            query: {
              countryCode,
              include: ['similarTracks'],
            },
          },
        }),
      `Failed to load similar tracks for "${trackId}"`,
    );

    if (data == null) {
      return { tracks: [] };
    }

    return mapSimilarTracksResponse(data);
  }

  async getSimilarAlbums(
    albumId: string,
    countryCode?: string,
  ): Promise<SimilarAlbumsResult> {
    const { data } = await this.request(
      () =>
        this.client.GET('/albums/{id}/relationships/similarAlbums', {
          params: {
            path: { id: albumId },
            query: {
              countryCode,
              include: ['similarAlbums'],
            },
          },
        }),
      `Failed to load similar albums for "${albumId}"`,
    );

    if (data == null) {
      return { albums: [] };
    }

    return mapSimilarAlbumsResponse(data);
  }

  async getArtistRadio(
    artistId: string,
    countryCode?: string,
  ): Promise<ArtistRadioResult> {
    const { data } = await this.request(
      () =>
        this.client.GET('/artists/{id}/relationships/radio', {
          params: {
            path: { id: artistId },
            query: {
              countryCode,
              include: ['radio'],
            },
          },
        }),
      `Failed to load artist radio for "${artistId}"`,
    );

    if (data == null) {
      return { tracks: [] };
    }

    return mapArtistRadioResponse(data);
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
