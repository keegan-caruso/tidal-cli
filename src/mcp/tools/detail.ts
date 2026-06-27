import type { SearchController } from '../../controllers/search.ts';
import type { DetailToolInput } from '../inputs/detail.ts';
import { jsonToolResult } from '../format.ts';

export const getTrackToolName = 'tidal_get_track' as const;
export const getAlbumToolName = 'tidal_get_album' as const;
export const getArtistToolName = 'tidal_get_artist' as const;
export const getPlaylistToolName = 'tidal_get_playlist' as const;

export function createGetTrackToolHandler(controller: SearchController) {
  return async (input: DetailToolInput) => {
    const track = await controller.getTrack(input);
    return jsonToolResult({ track });
  };
}

export function createGetAlbumToolHandler(controller: SearchController) {
  return async (input: DetailToolInput) => {
    const album = await controller.getAlbum(input);
    return jsonToolResult({ album });
  };
}

export function createGetArtistToolHandler(controller: SearchController) {
  return async (input: DetailToolInput) => {
    const artist = await controller.getArtist(input);
    return jsonToolResult({ artist });
  };
}

export function createGetPlaylistToolHandler(controller: SearchController) {
  return async (input: DetailToolInput) => {
    const playlist = await controller.getPlaylist(input);
    return jsonToolResult({ playlist });
  };
}
