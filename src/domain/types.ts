export interface Track {
  id: string;
  title: string;
  duration: string; // ISO 8601, e.g. "PT2M58S"
  explicit: boolean;
  isrc: string;
  popularity: number; // 0.0 – 1.0
  bpm?: number;
}

export interface Album {
  id: string;
  title: string;
  albumType: string; // e.g. "ALBUM" | "EP" | "SINGLE"
  duration: string;
  explicit: boolean;
  numberOfItems: number;
  releaseDate?: string; // ISO 8601 date
  popularity: number;
}

export interface Artist {
  id: string;
  name: string;
  popularity: number;
  handle?: string;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  playlistType: string; // e.g. "EDITORIAL" | "USER" | "MIX" | "ARTIST"
  numberOfItems?: number;
  duration?: string;
}

export type SearchType = 'tracks' | 'albums' | 'artists' | 'playlists' | 'all';

export interface SearchOptions {
  query: string;
  type: SearchType;
  countryCode?: string; // ISO 3166-1 alpha-2, e.g. "US"
  explicitFilter?: 'INCLUDE' | 'EXCLUDE';
}

export interface SearchResult {
  tracks: Track[];
  albums: Album[];
  artists: Artist[];
  playlists: Playlist[];
  didYouMean?: string;
  trackingId: string;
}
