import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCanonicalTidalUrl, mapExternalLinks } from './links.ts';

describe('links', () => {
  it('maps external links', () => {
    assert.deepEqual(
      mapExternalLinks([
        {
          href: 'https://tidal.com/track/1',
          meta: { type: 'TIDAL_SHARING' },
        },
      ]),
      [{ href: 'https://tidal.com/track/1', type: 'TIDAL_SHARING' }],
    );
  });

  it('prefers TIDAL_SHARING links', () => {
    assert.equal(
      getCanonicalTidalUrl('track', '1', [
        { href: 'https://example.com/1', type: 'OFFICIAL_HOMEPAGE' },
        { href: 'https://tidal.com/browse/track/1', type: 'TIDAL_SHARING' },
      ]),
      'https://tidal.com/browse/track/1',
    );
  });

  it('falls back to deterministic tidal URLs', () => {
    assert.equal(
      getCanonicalTidalUrl('album', '2', []),
      'https://tidal.com/album/2',
    );
  });
});
