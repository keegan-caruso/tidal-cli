#!/usr/bin/env node
import { initAuth, credentialsProvider } from '../src/services/auth.js';
import { createApiClient, createTidalApiService } from '../src/services/tidal-api.js';
import { SearchController } from '../src/controllers/search.js';
import { createMcpServer, startMcpServer } from '../src/mcp/server.js';

async function main(): Promise<void> {
  await initAuth();

  const apiClient = createApiClient(credentialsProvider);
  const apiService = createTidalApiService(apiClient);
  const searchController = new SearchController(apiService);

  const server = createMcpServer(searchController);
  await startMcpServer(server);
}

main().catch((err: unknown) => {
  console.error(
    `[tidal-mcp] Fatal error: ${err instanceof Error ? err.message : String(err)}`,
  );
  process.exit(1);
});
