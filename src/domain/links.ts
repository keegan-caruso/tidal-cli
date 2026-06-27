import type { ExternalLink } from './types.ts';

type LinkableResourceType = 'track' | 'album' | 'artist' | 'playlist';

const tidalPathByType: Record<LinkableResourceType, string> = {
  track: 'track',
  album: 'album',
  artist: 'artist',
  playlist: 'playlist',
};

export function mapExternalLinks(
  links?: { href: string; meta: { type: string } }[],
): ExternalLink[] {
  return (links ?? []).map((link) => ({
    href: link.href,
    type: link.meta.type,
  }));
}

export function getCanonicalTidalUrl(
  resourceType: LinkableResourceType,
  id: string,
  externalLinks: ExternalLink[],
): string {
  const sharingLink =
    externalLinks.find((link) => link.type === 'TIDAL_SHARING') ??
    externalLinks.find((link) => link.href.includes('tidal.com'));

  return (
    sharingLink?.href ??
    `https://tidal.com/${tidalPathByType[resourceType]}/${encodeURIComponent(id)}`
  );
}
