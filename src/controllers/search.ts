import type { TidalApiService } from '../services/tidal-api.ts';
import {
  type Album,
  type Artist,
  type Playlist,
  type Track,
} from '../domain/media.ts';
import {
  type DetailOptions,
  type ResolvedDetailOptions,
} from '../domain/detail.ts';
import {
  defaultSearchLimit,
  maxSearchLimit,
  type ResolvedSearchOptions,
  type SearchDefaults,
  type SearchOptions,
  type SearchResult,
  type SearchType,
} from '../domain/search.ts';
import { ValidationError } from '../domain/errors.ts';
import { normalizeCountryCode } from './utils.ts';

const searchTypes = new Set<SearchType>([
  'tracks',
  'albums',
  'artists',
  'playlists',
  'all',
]);

export class SearchController {
  private readonly apiService: TidalApiService;
  private readonly defaults: SearchDefaults;

  constructor(apiService: TidalApiService, defaults: SearchDefaults = {}) {
    this.apiService = apiService;
    this.defaults = defaults;
  }

  async search(options: SearchOptions): Promise<SearchResult> {
    return this.apiService.search(this.resolveSearchOptions(options));
  }

  async getTrack(options: DetailOptions): Promise<Track> {
    return this.apiService.getTrack(
      this.resolveDetailOptions(options, 'track'),
    );
  }

  async getAlbum(options: DetailOptions): Promise<Album> {
    return this.apiService.getAlbum(
      this.resolveDetailOptions(options, 'album'),
    );
  }

  async getArtist(options: DetailOptions): Promise<Artist> {
    return this.apiService.getArtist(
      this.resolveDetailOptions(options, 'artist'),
    );
  }

  async getPlaylist(options: DetailOptions): Promise<Playlist> {
    return this.apiService.getPlaylist(
      this.resolveDetailOptions(options, 'playlist'),
    );
  }

  private resolveSearchOptions(options: SearchOptions): ResolvedSearchOptions {
    const query = options.query.trim();
    if (!query) {
      throw new ValidationError('Search query cannot be empty');
    }

    const type = options.type ?? this.defaults.searchType ?? 'all';
    validateSearchType(type);

    const countryCode = normalizeCountryCode(
      options.countryCode ?? this.defaults.countryCode ?? 'US',
    );
    const explicitFilter =
      options.explicitFilter ?? this.defaults.explicitFilter;

    const limit = normalizeLimit(options.limit ?? this.defaults.limit);

    return {
      query,
      type,
      countryCode,
      explicitFilter,
      limit,
    };
  }

  private resolveDetailOptions(
    options: DetailOptions,
    label: string,
  ): ResolvedDetailOptions {
    const id = options.id.trim();
    if (!id) {
      throw new ValidationError(`${label} id cannot be empty`);
    }

    return {
      id,
      countryCode: normalizeCountryCode(
        options.countryCode ?? this.defaults.countryCode ?? 'US',
      ),
    };
  }
}

function validateSearchType(type: SearchType): void {
  if (!searchTypes.has(type)) {
    throw new ValidationError(
      'Search type must be tracks, albums, artists, playlists, or all',
    );
  }
}

function normalizeLimit(limit = defaultSearchLimit): number {
  if (!Number.isInteger(limit) || limit < 1 || limit > maxSearchLimit) {
    throw new ValidationError(
      `Limit must be an integer between 1 and ${maxSearchLimit}`,
    );
  }
  return limit;
}
