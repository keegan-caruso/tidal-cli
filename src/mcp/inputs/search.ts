import { z } from 'zod';

export const searchToolSchema = {
  query: z.string().min(1).describe('The search query string'),
  type: z
    .enum(['tracks', 'albums', 'artists', 'playlists', 'all'])
    .optional()
    .describe('Type of content to search for'),
  countryCode: z
    .string()
    .length(2)
    .optional()
    .describe('ISO 3166-1 alpha-2 country code'),
  explicitFilter: z
    .enum(['INCLUDE', 'EXCLUDE'])
    .optional()
    .describe('Whether to include or exclude explicit content'),
  limit: z
    .number()
    .int()
    .min(1)
    .max(50)
    .optional()
    .describe('Maximum results per category'),
};

export type SearchToolInput = {
  query: string;
  type?: 'tracks' | 'albums' | 'artists' | 'playlists' | 'all';
  countryCode?: string;
  explicitFilter?: 'INCLUDE' | 'EXCLUDE';
  limit?: number;
};
