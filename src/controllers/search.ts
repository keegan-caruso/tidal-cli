import type { TidalApiService } from '../services/tidal-api.js';
import type { SearchOptions, SearchResult } from '../domain/types.js';

export class SearchController {
  constructor(private readonly apiService: TidalApiService) {}

  async search(options: SearchOptions): Promise<SearchResult> {
    if (!options.query.trim()) {
      throw new Error('Search query cannot be empty');
    }
    return this.apiService.search(options);
  }
}
