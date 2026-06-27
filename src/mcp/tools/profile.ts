import type { ProfileController } from '../../controllers/profile.ts';
import type { TidalApiService } from '../../services/tidal-api.ts';
import type {
  GetListeningProfileToolInput,
  GetSimilarArtistsToolInput,
  GetSimilarTracksToolInput,
  GetSimilarAlbumsToolInput,
  GetArtistRadioToolInput,
} from '../inputs/profile.ts';
import { jsonToolResult } from '../format.ts';

// Listening Profile Tool
export const getListeningProfileToolName =
  'tidal_get_listening_profile' as const;
export const getListeningProfileToolDescription = `Get a comprehensive summary of the user's music taste and listening profile (requires login).
Returns: top artists (by saved content), recent tracks/albums, available personalized mixes, and collection stats.
Results are cached for 24 hours. Use forceRefresh=true to generate a fresh profile.
This is the best starting point for making personalized recommendations.`;

export function createGetListeningProfileToolHandler(
  controller: ProfileController,
) {
  return async (input: GetListeningProfileToolInput) => {
    const result = await controller.getListeningProfile({
      forceRefresh: input.forceRefresh,
    });
    return jsonToolResult({
      ...result.profile,
      _meta: {
        fromCache: result.fromCache,
        cacheHint: result.fromCache
          ? 'This profile was loaded from cache. Use forceRefresh=true for fresh data.'
          : 'This profile was freshly generated and cached.',
      },
    });
  };
}

// Similar Artists Tool
export const getSimilarArtistsToolName = 'tidal_get_similar_artists' as const;
export const getSimilarArtistsToolDescription =
  'Find artists similar to a given artist. Useful for discovering new music based on artists the user likes.';

export function createGetSimilarArtistsToolHandler(
  apiService: TidalApiService,
) {
  return async (input: GetSimilarArtistsToolInput) => {
    const result = await apiService.getSimilarArtists(
      input.artistId,
      input.countryCode ?? 'US',
    );
    return jsonToolResult(result);
  };
}

// Similar Tracks Tool
export const getSimilarTracksToolName = 'tidal_get_similar_tracks' as const;
export const getSimilarTracksToolDescription =
  'Find tracks similar to a given track. Great for building playlists or discovering songs with similar vibes.';

export function createGetSimilarTracksToolHandler(apiService: TidalApiService) {
  return async (input: GetSimilarTracksToolInput) => {
    const result = await apiService.getSimilarTracks(
      input.trackId,
      input.countryCode ?? 'US',
    );
    return jsonToolResult(result);
  };
}

// Similar Albums Tool
export const getSimilarAlbumsToolName = 'tidal_get_similar_albums' as const;
export const getSimilarAlbumsToolDescription =
  'Find albums similar to a given album. Useful for discovering full albums in a similar style.';

export function createGetSimilarAlbumsToolHandler(apiService: TidalApiService) {
  return async (input: GetSimilarAlbumsToolInput) => {
    const result = await apiService.getSimilarAlbums(
      input.albumId,
      input.countryCode ?? 'US',
    );
    return jsonToolResult(result);
  };
}

// Artist Radio Tool
export const getArtistRadioToolName = 'tidal_get_artist_radio' as const;
export const getArtistRadioToolDescription =
  'Get a radio-style track list based on an artist. Returns a mix of tracks by the artist and similar artists.';

export function createGetArtistRadioToolHandler(apiService: TidalApiService) {
  return async (input: GetArtistRadioToolInput) => {
    const result = await apiService.getArtistRadio(
      input.artistId,
      input.countryCode ?? 'US',
    );
    return jsonToolResult(result);
  };
}
