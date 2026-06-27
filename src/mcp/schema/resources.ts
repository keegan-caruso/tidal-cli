import { z } from 'zod';

export const externalLinkSchema = z.object({
  href: z.string(),
  type: z.string(),
});

export const resourceSummarySchema = z.object({
  id: z.string(),
  type: z.string(),
  name: z.string(),
  url: z.string().optional(),
});

export const trackSchema = z.object({
  id: z.string(),
  title: z.string(),
  duration: z.string(),
  durationText: z.string(),
  explicit: z.boolean(),
  isrc: z.string(),
  popularity: z.number(),
  bpm: z.number().optional(),
  url: z.string(),
  externalLinks: z.array(externalLinkSchema),
  artists: z.array(resourceSummarySchema),
  albums: z.array(resourceSummarySchema),
});

export const albumSchema = z.object({
  id: z.string(),
  title: z.string(),
  albumType: z.string(),
  duration: z.string(),
  durationText: z.string(),
  explicit: z.boolean(),
  numberOfItems: z.number(),
  releaseDate: z.string().optional(),
  popularity: z.number(),
  url: z.string(),
  externalLinks: z.array(externalLinkSchema),
  artists: z.array(resourceSummarySchema),
});

export const artistSchema = z.object({
  id: z.string(),
  name: z.string(),
  popularity: z.number(),
  handle: z.string().optional(),
  url: z.string(),
  externalLinks: z.array(externalLinkSchema),
});

export const playlistSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  playlistType: z.string(),
  numberOfItems: z.number().optional(),
  duration: z.string().optional(),
  durationText: z.string().optional(),
  url: z.string(),
  externalLinks: z.array(externalLinkSchema),
});
