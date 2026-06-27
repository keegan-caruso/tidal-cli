import type { Album, Artist, Playlist, Track } from './media.ts';

export interface CollectionItem<T> {
  item: T;
  addedAt: string; // ISO 8601 date
}

export interface UserCollection {
  tracks: CollectionItem<Track>[];
  albums: CollectionItem<Album>[];
  artists: CollectionItem<Artist>[];
  playlists: CollectionItem<Playlist>[];
}

export type MixType = 'daily' | 'discovery' | 'new-releases';

export interface MixOptions {
  type?: MixType;
  countryCode?: string;
}

export interface ResolvedMixOptions {
  type: MixType;
  countryCode: string;
}

export type CollectionType = 'tracks' | 'albums' | 'artists' | 'playlists';
export type CollectionSort = 'addedAt' | '-addedAt';

export interface CollectionOptions {
  type?: CollectionType;
  limit?: number;
  sort?: CollectionSort;
  countryCode?: string;
}

export interface ResolvedCollectionOptions {
  type: CollectionType;
  limit: number;
  sort: CollectionSort;
  countryCode: string;
}

export interface UserDefaults {
  countryCode?: string;
}

export const defaultCollectionLimit = 25;
export const maxCollectionLimit = 100;
