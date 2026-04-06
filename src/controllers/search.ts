import type { TidalApiService } from '../services/tidal-api.ts';
import type { SearchOptions, SearchResult } from '../domain/types.ts';

export class SearchController {
  private readonly apiService: TidalApiService;

  constructor(apiService: TidalApiService) {
    this.apiService = apiService;
  }

  async search(options: SearchOptions): Promise<SearchResult> {
    if (!options.query.trim()) {
      throw new Error('Search query cannot be empty');
    }
    return this.apiService.search(options);
  }
}
