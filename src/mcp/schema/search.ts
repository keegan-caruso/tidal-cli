import { z } from 'zod';
import {
  albumSchema,
  artistSchema,
  playlistSchema,
  trackSchema,
} from './resources.ts';

export const searchOutputSchema = {
  tracks: z.array(trackSchema),
  albums: z.array(albumSchema),
  artists: z.array(artistSchema),
  playlists: z.array(playlistSchema),
  didYouMean: z.string().optional(),
  trackingId: z.string(),
  query: z.string(),
  type: z.enum(['tracks', 'albums', 'artists', 'playlists', 'all']),
  countryCode: z.string(),
  explicitFilter: z.enum(['INCLUDE', 'EXCLUDE']).optional(),
  limit: z.number(),
};
