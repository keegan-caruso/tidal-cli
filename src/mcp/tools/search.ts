import type { SearchController } from '../../controllers/search.ts';
import type { SearchToolInput } from '../inputs/search.ts';
import { jsonToolResult } from '../format.ts';

export const searchToolName = 'tidal_search' as const;

export const searchToolDescription =
  'Search Tidal for tracks, albums, artists, or playlists. Returns JSON search results.';

export function createSearchToolHandler(controller: SearchController) {
  return async (input: SearchToolInput) => {
    const result = await controller.search(input);
    return jsonToolResult(result);
  };
}
