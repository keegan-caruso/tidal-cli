import type { components } from '@tidal-music/api';
import type { Playlist, Track, Album, Artist } from '../domain/media.ts';
import type { CollectionItem } from '../domain/user.ts';
import {
  createIncludedIndex,
  mapTrack,
  mapAlbum,
  mapArtist,
  mapPlaylist,
} from './tidal-mappers.ts';

type IncludedResource = components['schemas']['Included'][number];

export interface MixesResult {
  playlists: Playlist[];
}

export interface CollectionTracksResult {
  items: CollectionItem<Track>[];
  cursor?: string;
}

export interface CollectionAlbumsResult {
  items: CollectionItem<Album>[];
  cursor?: string;
}

export interface CollectionArtistsResult {
  items: CollectionItem<Artist>[];
  cursor?: string;
}

export interface CollectionPlaylistsResult {
  items: CollectionItem<Playlist>[];
  cursor?: string;
}

function mapMixesResponse(doc: { included?: IncludedResource[] }): MixesResult {
  const included = doc.included ?? [];
  const playlists: Playlist[] = [];

  for (const resource of included) {
    if (resource.type === 'playlists') {
      const r = resource as components['schemas']['Playlists_Resource_Object'];
      if (r.attributes != null) {
        playlists.push(mapPlaylist(r.id, r.attributes));
      }
    }
  }

  return { playlists };
}

export function mapDailyMixesResponse(
  doc: components['schemas']['UserDailyMixes_Single_Resource_Data_Document'],
): MixesResult {
  return mapMixesResponse(doc);
}

export function mapDiscoveryMixesResponse(
  doc: components['schemas']['UserDiscoveryMixes_Single_Resource_Data_Document'],
): MixesResult {
  return mapMixesResponse(doc);
}

export function mapNewReleaseMixesResponse(
  doc: components['schemas']['UserNewReleaseMixes_Single_Resource_Data_Document'],
): MixesResult {
  return mapMixesResponse(doc);
}

export function mapCollectionTracksResponse(
  doc: components['schemas']['UserCollectionTracks_Items_Multi_Relationship_Data_Document'],
): CollectionTracksResult {
  const included = doc.included ?? [];
  const index = createIncludedIndex(included);
  const items: CollectionItem<Track>[] = [];

  const data = doc.data ?? [];
  for (const item of data) {
    if (item.type === 'tracks') {
      const resource = findResource(included, 'tracks', item.id);
      if (resource != null) {
        const r = resource as components['schemas']['Tracks_Resource_Object'];
        if (r.attributes != null) {
          items.push({
            item: mapTrack(r.id, r.attributes, r, index),
            addedAt: extractAddedAt(item),
          });
        }
      }
    }
  }

  return {
    items,
    cursor: doc.links?.next ? extractCursor(doc.links.next) : undefined,
  };
}

export function mapCollectionAlbumsResponse(
  doc: components['schemas']['UserCollectionAlbums_Items_Multi_Relationship_Data_Document'],
): CollectionAlbumsResult {
  const included = doc.included ?? [];
  const index = createIncludedIndex(included);
  const items: CollectionItem<Album>[] = [];

  const data = doc.data ?? [];
  for (const item of data) {
    if (item.type === 'albums') {
      const resource = findResource(included, 'albums', item.id);
      if (resource != null) {
        const r = resource as components['schemas']['Albums_Resource_Object'];
        if (r.attributes != null) {
          items.push({
            item: mapAlbum(r.id, r.attributes, r, index),
            addedAt: extractAddedAt(item),
          });
        }
      }
    }
  }

  return {
    items,
    cursor: doc.links?.next ? extractCursor(doc.links.next) : undefined,
  };
}

export function mapCollectionArtistsResponse(
  doc: components['schemas']['UserCollectionArtists_Items_Multi_Relationship_Data_Document'],
): CollectionArtistsResult {
  const included = doc.included ?? [];
  const items: CollectionItem<Artist>[] = [];

  const data = doc.data ?? [];
  for (const item of data) {
    if (item.type === 'artists') {
      const resource = findResource(included, 'artists', item.id);
      if (resource != null) {
        const r = resource as components['schemas']['Artists_Resource_Object'];
        if (r.attributes != null) {
          items.push({
            item: mapArtist(r.id, r.attributes),
            addedAt: extractAddedAt(item),
          });
        }
      }
    }
  }

  return {
    items,
    cursor: doc.links?.next ? extractCursor(doc.links.next) : undefined,
  };
}

export function mapCollectionPlaylistsResponse(
  doc: components['schemas']['UserCollectionPlaylists_Items_Multi_Relationship_Data_Document'],
): CollectionPlaylistsResult {
  const included = doc.included ?? [];
  const items: CollectionItem<Playlist>[] = [];

  const data = doc.data ?? [];
  for (const item of data) {
    if (item.type === 'playlists') {
      const resource = findResource(included, 'playlists', item.id);
      if (resource != null) {
        const r = resource as components['schemas']['Playlists_Resource_Object'];
        if (r.attributes != null) {
          items.push({
            item: mapPlaylist(r.id, r.attributes),
            addedAt: extractAddedAt(item),
          });
        }
      }
    }
  }

  return {
    items,
    cursor: doc.links?.next ? extractCursor(doc.links.next) : undefined,
  };
}

function findResource(
  included: IncludedResource[],
  type: string,
  id: string,
): IncludedResource | undefined {
  return included.find((r) => r.type === type && r.id === id);
}

function extractAddedAt(item: { meta?: { addedAt?: string } }): string {
  return item.meta?.addedAt ?? new Date().toISOString();
}

function extractCursor(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    return parsed.searchParams.get('page[cursor]') ?? undefined;
  } catch {
    return undefined;
  }
}
