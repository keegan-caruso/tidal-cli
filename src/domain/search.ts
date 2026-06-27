import type { Album, Artist, Playlist, Track } from './media.ts';

export const defaultSearchLimit = 10;
export const maxSearchLimit = 50;

export type SearchType = 'tracks' | 'albums' | 'artists' | 'playlists' | 'all';

export interface SearchOptions {
  query: string;
  type?: SearchType;
  countryCode?: string; // ISO 3166-1 alpha-2, e.g. "US"
  explicitFilter?: 'INCLUDE' | 'EXCLUDE';
  limit?: number;
}

export interface ResolvedSearchOptions {
  query: string;
  type: SearchType;
  countryCode: string;
  explicitFilter?: 'INCLUDE' | 'EXCLUDE';
  limit: number;
}

export interface SearchResult {
  tracks: Track[];
  albums: Album[];
  artists: Artist[];
  playlists: Playlist[];
  didYouMean?: string;
  trackingId: string;
  query: string;
  type: SearchType;
  countryCode: string;
  explicitFilter?: 'INCLUDE' | 'EXCLUDE';
  limit: number;
}

export interface SearchDefaults {
  countryCode?: string;
  explicitFilter?: 'INCLUDE' | 'EXCLUDE';
  searchType?: SearchType;
  limit?: number;
}
