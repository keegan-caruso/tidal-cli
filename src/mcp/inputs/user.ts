import { z } from 'zod';

export const mixesToolSchema = {
  type: z
    .enum(['daily', 'discovery', 'new-releases'])
    .optional()
    .describe('Type of personalized mix to retrieve'),
};

export type MixesToolInput = {
  type?: 'daily' | 'discovery' | 'new-releases';
};

export const collectionToolSchema = {
  type: z
    .enum(['tracks', 'albums', 'artists', 'playlists'])
    .optional()
    .describe('Type of collection items to retrieve'),
  sort: z
    .enum(['addedAt', '-addedAt'])
    .optional()
    .describe('Sort order: addedAt (oldest first) or -addedAt (newest first)'),
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .describe('Maximum number of items to return'),
};

export type CollectionToolInput = {
  type?: 'tracks' | 'albums' | 'artists' | 'playlists';
  sort?: 'addedAt' | '-addedAt';
  limit?: number;
};

export const loginStatusToolSchema = {};

export type LoginStatusToolInput = Record<string, never>;
