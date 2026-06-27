export interface ExternalLink {
  href: string;
  type: string;
}

export interface ResourceSummary {
  id: string;
  type: string;
  name: string;
  url?: string;
}

export interface Track {
  id: string;
  title: string;
  duration: string; // ISO 8601, e.g. "PT2M58S"
  durationText: string;
  explicit: boolean;
  isrc: string;
  popularity: number; // 0.0 - 1.0
  bpm?: number;
  url: string;
  externalLinks: ExternalLink[];
  artists: ResourceSummary[];
  albums: ResourceSummary[];
}

export interface Album {
  id: string;
  title: string;
  albumType: string; // e.g. "ALBUM" | "EP" | "SINGLE"
  duration: string;
  durationText: string;
  explicit: boolean;
  numberOfItems: number;
  releaseDate?: string; // ISO 8601 date
  popularity: number;
  url: string;
  externalLinks: ExternalLink[];
  artists: ResourceSummary[];
}

export interface Artist {
  id: string;
  name: string;
  popularity: number;
  handle?: string;
  url: string;
  externalLinks: ExternalLink[];
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  playlistType: string; // e.g. "EDITORIAL" | "USER" | "MIX" | "ARTIST"
  numberOfItems?: number;
  duration?: string;
  durationText?: string;
  url: string;
  externalLinks: ExternalLink[];
}
