import {
  albumSchema,
  artistSchema,
  playlistSchema,
  trackSchema,
} from './resources.ts';

export const trackOutputSchema = { track: trackSchema };
export const albumOutputSchema = { album: albumSchema };
export const artistOutputSchema = { artist: artistSchema };
export const playlistOutputSchema = { playlist: playlistSchema };
