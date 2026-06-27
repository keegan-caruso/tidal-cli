#!/usr/bin/env node
import { program } from 'commander';
import { initAuth, credentialsProvider } from '../src/services/auth.ts';
import { createApiClient, createTidalApiService } from '../src/services/tidal-api.ts';
import { loadProjectConfig } from '../src/services/config.ts';
import { loadProjectEnv } from '../src/services/env.ts';
import { SearchController } from '../src/controllers/search.ts';
import { createSearchCommand } from '../src/cli/commands/search.ts';

async function main(): Promise<void> {
  await loadProjectEnv();
  const config = await loadProjectConfig();
  await initAuth();

  const apiClient = createApiClient(credentialsProvider);
  const apiService = createTidalApiService(apiClient);
  const searchController = new SearchController(apiService, config);

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
