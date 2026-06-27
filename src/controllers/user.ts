import type { TidalApiService } from '../services/tidal-api.ts';
import type { Playlist, Track, Album, Artist } from '../domain/media.ts';
import {
  type MixOptions,
  type MixType,
  type ResolvedMixOptions,
  type CollectionOptions,
  type CollectionType,
  type CollectionSort,
  type ResolvedCollectionOptions,
  type UserDefaults,
  type CollectionItem,
  defaultCollectionLimit,
  maxCollectionLimit,
} from '../domain/user.ts';
import { UserAuthRequiredError, ValidationError } from '../domain/errors.ts';
import { isUserLoggedIn } from '../services/auth.ts';

const mixTypes = new Set<MixType>(['daily', 'discovery', 'new-releases']);
const collectionTypes = new Set<CollectionType>([
  'tracks',
  'albums',
  'artists',
  'playlists',
]);
const collectionSorts = new Set<CollectionSort>(['addedAt', '-addedAt']);

export interface MixesResult {
  playlists: Playlist[];
  type: MixType;
}

export interface CollectionResult {
  tracks: CollectionItem<Track>[];
  albums: CollectionItem<Album>[];
  artists: CollectionItem<Artist>[];
  playlists: CollectionItem<Playlist>[];
  type: CollectionType;
  sort: CollectionSort;
  limit: number;
}

export class UserController {
  private readonly apiService: TidalApiService;
  private readonly defaults: UserDefaults;

  constructor(apiService: TidalApiService, defaults: UserDefaults = {}) {
    this.apiService = apiService;
    this.defaults = defaults;
  }

  async getMixes(options: MixOptions = {}): Promise<MixesResult> {
    await this.requireUserAuth();

    const resolved = this.resolveMixOptions(options);

    let result: { playlists: Playlist[] };
    switch (resolved.type) {
      case 'daily':
        result = await this.apiService.getDailyMixes();
        break;
      case 'discovery':
        result = await this.apiService.getDiscoveryMixes();
        break;
      case 'new-releases':
        result = await this.apiService.getNewReleaseMixes();
        break;
    }

    return {
      playlists: result.playlists,
      type: resolved.type,
    };
  }

  async getCollection(options: CollectionOptions = {}): Promise<CollectionResult> {
    await this.requireUserAuth();

    const resolved = this.resolveCollectionOptions(options);

    const result: CollectionResult = {
      tracks: [],
      albums: [],
      artists: [],
      playlists: [],
      type: resolved.type,
      sort: resolved.sort,
      limit: resolved.limit,
    };

    switch (resolved.type) {
      case 'tracks': {
        const response = await this.apiService.getCollectionTracks(resolved.sort);
        result.tracks = response.items.slice(0, resolved.limit);
        break;
      }
      case 'albums': {
        const response = await this.apiService.getCollectionAlbums(resolved.sort);
        result.albums = response.items.slice(0, resolved.limit);
        break;
      }
      case 'artists': {
        const response = await this.apiService.getCollectionArtists(resolved.sort);
        result.artists = response.items.slice(0, resolved.limit);
        break;
      }
      case 'playlists': {
        const response = await this.apiService.getCollectionPlaylists(resolved.sort);
        result.playlists = response.items.slice(0, resolved.limit);
        break;
      }
    }

    return result;
  }

  private async requireUserAuth(): Promise<void> {
    const loggedIn = await isUserLoggedIn();
    if (!loggedIn) {
      throw new UserAuthRequiredError();
    }
  }

  private resolveMixOptions(options: MixOptions): ResolvedMixOptions {
    const type = options.type ?? 'daily';
    validateMixType(type);

    return {
      type,
      countryCode: normalizeCountryCode(
        options.countryCode ?? this.defaults.countryCode ?? 'US',
      ),
    };
  }

  private resolveCollectionOptions(
    options: CollectionOptions,
  ): ResolvedCollectionOptions {
    const type = options.type ?? 'tracks';
    validateCollectionType(type);

    const sort = options.sort ?? '-addedAt';
    validateCollectionSort(sort);

    const limit = normalizeLimit(options.limit ?? defaultCollectionLimit);

    return {
      type,
      sort,
      limit,
      countryCode: normalizeCountryCode(
        options.countryCode ?? this.defaults.countryCode ?? 'US',
      ),
    };
  }
}

function validateMixType(type: MixType): void {
  if (!mixTypes.has(type)) {
    throw new ValidationError('Mix type must be daily, discovery, or new-releases');
  }
}

function validateCollectionType(type: CollectionType): void {
  if (!collectionTypes.has(type)) {
    throw new ValidationError(
      'Collection type must be tracks, albums, artists, or playlists',
    );
  }
}

function validateCollectionSort(sort: CollectionSort): void {
  if (!collectionSorts.has(sort)) {
    throw new ValidationError('Sort must be addedAt or -addedAt');
  }
}

function normalizeCountryCode(countryCode: string): string {
  const normalized = countryCode.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) {
    throw new ValidationError('Country code must be a 2-letter ISO code');
  }
  return normalized;
}

function normalizeLimit(limit = defaultCollectionLimit): number {
  if (!Number.isInteger(limit) || limit < 1 || limit > maxCollectionLimit) {
    throw new ValidationError(
      `Limit must be an integer between 1 and ${maxCollectionLimit}`,
    );
  }
  return limit;
}
