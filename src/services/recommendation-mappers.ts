import type { components } from '@tidal-music/api';
import type { Artist, Track, Album } from '../domain/media.ts';
import { createIncludedIndex, mapArtist, mapTrack, mapAlbum } from './tidal-mappers.ts';

type ArtistsRelDoc = components['schemas']['Artists_Multi_Relationship_Data_Document'];
type TracksRelDoc = components['schemas']['Tracks_Multi_Relationship_Data_Document'];
type AlbumsRelDoc = components['schemas']['Albums_Multi_Relationship_Data_Document'];
type IncludedResource = components['schemas']['Included'][number];

export interface SimilarArtistsResult {
  artists: Artist[];
}

export interface SimilarTracksResult {
  tracks: Track[];
}

export interface SimilarAlbumsResult {
  albums: Album[];
}

export interface ArtistRadioResult {
  tracks: Track[];
}

export function mapSimilarArtistsResponse(doc: ArtistsRelDoc): SimilarArtistsResult {
  const included = doc.included ?? [];
  const index = createIncludedIndex(included);
  const artists: Artist[] = [];

  for (const resource of included) {
    if (resource.type === 'artists') {
      const r = resource as components['schemas']['Artists_Resource_Object'];
      if (r.attributes != null) {
        artists.push(mapArtist(r.id, r.attributes));
      }
    }
  }

  return { artists };
}

export function mapSimilarTracksResponse(doc: TracksRelDoc): SimilarTracksResult {
  const included = doc.included ?? [];
  const index = createIncludedIndex(included);
  const tracks: Track[] = [];

  for (const resource of included) {
    if (resource.type === 'tracks') {
      const r = resource as components['schemas']['Tracks_Resource_Object'];
      if (r.attributes != null) {
        tracks.push(mapTrack(r.id, r.attributes, r, index));
      }
    }
  }

  return { tracks };
}

export function mapSimilarAlbumsResponse(doc: AlbumsRelDoc): SimilarAlbumsResult {
  const included = doc.included ?? [];
  const index = createIncludedIndex(included);
  const albums: Album[] = [];

  for (const resource of included) {
    if (resource.type === 'albums') {
      const r = resource as components['schemas']['Albums_Resource_Object'];
      if (r.attributes != null) {
        albums.push(mapAlbum(r.id, r.attributes, r, index));
      }
    }
  }

  return { albums };
}

export function mapArtistRadioResponse(doc: TracksRelDoc): ArtistRadioResult {
  // Artist radio returns tracks, same structure as similar tracks
  const result = mapSimilarTracksResponse(doc);
  return { tracks: result.tracks };
}
