import { z } from 'zod';

export const getListeningProfileToolSchema = {
  forceRefresh: z
    .boolean()
    .optional()
    .describe(
      'Set to true to bypass cache and generate a fresh profile. Default: false (uses cached profile if available)',
    ),
};

export type GetListeningProfileToolInput = {
  forceRefresh?: boolean;
};

export const getSimilarArtistsToolSchema = {
  artistId: z
    .string()
    .describe('The Tidal artist ID to find similar artists for'),
  countryCode: z
    .string()
    .length(2)
    .optional()
    .describe('ISO 3166-1 alpha-2 country code (e.g., US, GB). Default: US'),
};

export type GetSimilarArtistsToolInput = {
  artistId: string;
  countryCode?: string;
};

export const getSimilarTracksToolSchema = {
  trackId: z.string().describe('The Tidal track ID to find similar tracks for'),
  countryCode: z
    .string()
    .length(2)
    .optional()
    .describe('ISO 3166-1 alpha-2 country code (e.g., US, GB). Default: US'),
};

export type GetSimilarTracksToolInput = {
  trackId: string;
  countryCode?: string;
};

export const getSimilarAlbumsToolSchema = {
  albumId: z.string().describe('The Tidal album ID to find similar albums for'),
  countryCode: z
    .string()
    .length(2)
    .optional()
    .describe('ISO 3166-1 alpha-2 country code (e.g., US, GB). Default: US'),
};

export type GetSimilarAlbumsToolInput = {
  albumId: string;
  countryCode?: string;
};

export const getArtistRadioToolSchema = {
  artistId: z.string().describe('The Tidal artist ID to get radio tracks for'),
  countryCode: z
    .string()
    .length(2)
    .optional()
    .describe('ISO 3166-1 alpha-2 country code (e.g., US, GB). Default: US'),
};

export type GetArtistRadioToolInput = {
  artistId: string;
  countryCode?: string;
};
