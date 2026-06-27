#!/usr/bin/env node
import { initAuth, credentialsProvider } from '../src/services/auth.ts';
import { createApiClient, createTidalApiService } from '../src/services/tidal-api.ts';
import { loadProjectConfig } from '../src/services/config.ts';
import { loadProjectEnv } from '../src/services/env.ts';
import { SearchController } from '../src/controllers/search.ts';
import { createMcpServer, startMcpServer } from '../src/mcp/server.ts';

async function main(): Promise<void> {
  await loadProjectEnv();
  const config = await loadProjectConfig();
  await initAuth();

  const apiClient = createApiClient(credentialsProvider);
  const apiService = createTidalApiService(apiClient);
  const searchController = new SearchController(apiService, config);

  const server = createMcpServer(searchController);
  await startMcpServer(server);
}

main().catch((err: unknown) => {
  console.error(
    `[tidal-mcp] Fatal error: ${err instanceof Error ? err.message : String(err)}`,
  );
  process.exit(1);
});
