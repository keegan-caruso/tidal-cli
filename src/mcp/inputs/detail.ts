import { z } from 'zod';

export const detailToolSchema = {
  id: z.string().min(1).describe('The Tidal resource id'),
  countryCode: z
    .string()
    .length(2)
    .optional()
    .describe('ISO 3166-1 alpha-2 country code'),
};

export type DetailToolInput = {
  id: string;
  countryCode?: string;
};
