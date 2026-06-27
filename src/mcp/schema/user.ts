import { z } from 'zod';
import {
  playlistSchema,
  trackSchema,
  albumSchema,
  artistSchema,
} from './resources.ts';

const collectionItemTrackSchema = z.object({
  item: trackSchema,
  addedAt: z.string(),
});

const collectionItemAlbumSchema = z.object({
  item: albumSchema,
  addedAt: z.string(),
});

const collectionItemArtistSchema = z.object({
  item: artistSchema,
  addedAt: z.string(),
});

const collectionItemPlaylistSchema = z.object({
  item: playlistSchema,
  addedAt: z.string(),
});

export const mixesOutputSchema = {
  playlists: z.array(playlistSchema),
  type: z.enum(['daily', 'discovery', 'new-releases']),
};

export const collectionOutputSchema = {
  tracks: z.array(collectionItemTrackSchema),
  albums: z.array(collectionItemAlbumSchema),
  artists: z.array(collectionItemArtistSchema),
  playlists: z.array(collectionItemPlaylistSchema),
  type: z.enum(['tracks', 'albums', 'artists', 'playlists']),
  sort: z.enum(['addedAt', '-addedAt']),
  limit: z.number(),
};

export const loginStatusOutputSchema = {
  loggedIn: z.boolean(),
  message: z.string(),
};
