#!/usr/bin/env node
import { program } from 'commander';
import { initAuth, credentialsProvider } from '../src/services/auth.js';
import { createApiClient, createTidalApiService } from '../src/services/tidal-api.js';
import { SearchController } from '../src/controllers/search.js';
import { createSearchCommand } from '../src/cli/commands/search.js';

async function main(): Promise<void> {
  await initAuth();

  const apiClient = createApiClient(credentialsProvider);
  const apiService = createTidalApiService(apiClient);
  const searchController = new SearchController(apiService);

  program
    .name('tidal')
    .description('Tidal music API CLI')
    .version('0.1.0');

  program.addCommand(createSearchCommand(searchController));

  await program.parseAsync(process.argv);
}

main().catch((err: unknown) => {
  process.stderr.write(
    `Fatal error: ${err instanceof Error ? err.message : String(err)}\n`,
  );
  process.exit(1);
});
