import type { components } from '@tidal-music/api';
import type {
  Album,
  Artist,
  Playlist,
  ResourceSummary,
  Track,
} from '../domain/media.ts';
import type { ResolvedSearchOptions, SearchResult } from '../domain/search.ts';
import { formatIsoDuration } from '../domain/format.ts';
import { getCanonicalTidalUrl, mapExternalLinks } from '../domain/links.ts';

type IncludedResource = components['schemas']['Included'][number];
type SearchDocument =
  components['schemas']['SearchResults_Single_Resource_Data_Document'];

export function buildSearchIncludeList(
  type: ResolvedSearchOptions['type'],
): string[] {
  if (type === 'all') return ['tracks', 'albums', 'artists', 'playlists'];
  return [type];
}

export function mapSearchResponse(
  doc: SearchDocument,
  options: ResolvedSearchOptions,
): SearchResult {
  const included = doc.included ?? [];
  const attrs = doc.data.attributes;
  const index = createIncludedIndex(included);

  const tracks: Track[] = [];
  const albums: Album[] = [];
  const artists: Artist[] = [];
  const playlists: Playlist[] = [];

  for (const resource of included) {
    if (resource.type === 'tracks') {
      const r = resource as components['schemas']['Tracks_Resource_Object'];
      if (r.attributes != null) tracks.push(mapTrack(r.id, r.attributes, r, index));
    } else if (resource.type === 'albums') {
      const r = resource as components['schemas']['Albums_Resource_Object'];
      if (r.attributes != null) albums.push(mapAlbum(r.id, r.attributes, r, index));
    } else if (resource.type === 'artists') {
      const r = resource as components['schemas']['Artists_Resource_Object'];
      if (r.attributes != null) artists.push(mapArtist(r.id, r.attributes));
    } else if (resource.type === 'playlists') {
      const r = resource as components['schemas']['Playlists_Resource_Object'];
      if (r.attributes != null) playlists.push(mapPlaylist(r.id, r.attributes));
    }
  }

  return {
    tracks,
    albums,
    artists,
    playlists,
    didYouMean: attrs?.didYouMean,
    trackingId: attrs?.trackingId ?? '',
    query: options.query,
    type: options.type,
    countryCode: options.countryCode,
    explicitFilter: options.explicitFilter,
    limit: options.limit,
  };
}

export function limitSearchResult(
  result: SearchResult,
  limit: number,
): SearchResult {
  return {
    ...result,
    tracks: result.tracks.slice(0, limit),
    albums: result.albums.slice(0, limit),
    artists: result.artists.slice(0, limit),
    playlists: result.playlists.slice(0, limit),
  };
}

export function createIncludedIndex(
  resources: IncludedResource[],
): Map<string, IncludedResource> {
  const index = new Map<string, IncludedResource>();
  for (const resource of resources) {
    index.set(resourceKey(resource.type, resource.id), resource);
  }
  return index;
}

export function mapTrack(
  id: string,
  a: components['schemas']['Tracks_Attributes'],
  r: components['schemas']['Tracks_Resource_Object'],
  index: Map<string, IncludedResource>,
): Track {
  const externalLinks = mapExternalLinks(a.externalLinks);
  return {
    id,
    title: a.title,
    duration: a.duration,
    durationText: formatIsoDuration(a.duration) ?? a.duration,
    explicit: a.explicit,
    isrc: a.isrc,
    popularity: a.popularity,
    bpm: a.bpm,
    url: getCanonicalTidalUrl('track', id, externalLinks),
    externalLinks,
    artists: mapRelationshipSummaries(r.relationships?.artists?.data, index),
    albums: mapRelationshipSummaries(r.relationships?.albums?.data, index),
  };
}

export function mapAlbum(
  id: string,
  a: components['schemas']['Albums_Attributes'],
  r: components['schemas']['Albums_Resource_Object'],
  index: Map<string, IncludedResource>,
): Album {
  const externalLinks = mapExternalLinks(a.externalLinks);
  return {
    id,
    title: a.title,
    albumType: a.albumType,
    duration: a.duration,
    durationText: formatIsoDuration(a.duration) ?? a.duration,
    explicit: a.explicit,
    numberOfItems: a.numberOfItems,
    releaseDate: a.releaseDate,
    popularity: a.popularity,
    url: getCanonicalTidalUrl('album', id, externalLinks),
    externalLinks,
    artists: mapRelationshipSummaries(r.relationships?.artists?.data, index),
  };
}

export function mapArtist(
  id: string,
  a: components['schemas']['Artists_Attributes'],
): Artist {
  const externalLinks = mapExternalLinks(a.externalLinks);
  return {
    id,
    name: a.name,
    popularity: a.popularity,
    handle: a.handle,
    url: getCanonicalTidalUrl('artist', id, externalLinks),
    externalLinks,
  };
}

export function mapPlaylist(
  id: string,
  a: components['schemas']['Playlists_Attributes'],
): Playlist {
  const externalLinks = mapExternalLinks(a.externalLinks);
  return {
    id,
    name: a.name,
    description: a.description,
    playlistType: a.playlistType,
    numberOfItems: a.numberOfItems,
    duration: a.duration,
    durationText: formatIsoDuration(a.duration),
    url: getCanonicalTidalUrl('playlist', id, externalLinks),
    externalLinks,
  };
}

function mapRelationshipSummaries(
  data:
    | components['schemas']['Resource_Identifier'][]
    | components['schemas']['Albums_Items_Resource_Identifier'][]
    | undefined,
  index: Map<string, IncludedResource>,
): ResourceSummary[] {
  return (data ?? []).map((item) => {
    const resource = index.get(resourceKey(item.type, item.id));
    return {
      id: item.id,
      type: item.type,
      name: getResourceDisplayName(resource) ?? item.id,
      url: getResourceUrl(item.type, item.id, resource),
    };
  });
}

function getResourceDisplayName(resource?: IncludedResource): string | undefined {
  if (resource == null || resource.attributes == null) return undefined;

  if (
    'title' in resource.attributes &&
    typeof resource.attributes.title === 'string'
  ) {
    return resource.attributes.title;
  }
  if (
    'name' in resource.attributes &&
    typeof resource.attributes.name === 'string'
  ) {
    return resource.attributes.name;
  }

  return undefined;
}

function getResourceUrl(
  type: string,
  id: string,
  resource?: IncludedResource,
): string | undefined {
  const attributes = resource?.attributes;
  const externalLinks =
    attributes != null && 'externalLinks' in attributes
      ? mapExternalLinks(attributes.externalLinks)
      : [];

  if (type === 'tracks') return getCanonicalTidalUrl('track', id, externalLinks);
  if (type === 'albums') return getCanonicalTidalUrl('album', id, externalLinks);
  if (type === 'artists') return getCanonicalTidalUrl('artist', id, externalLinks);
  if (type === 'playlists') {
    return getCanonicalTidalUrl('playlist', id, externalLinks);
  }
  return undefined;
}

function resourceKey(type: string, id: string): string {
  return `${type}:${id}`;
}
