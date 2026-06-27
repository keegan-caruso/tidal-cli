#!/usr/bin/env node
import { program } from 'commander';
import { initUserAuth, credentialsProvider } from '../src/services/auth.ts';
import {
  createApiClient,
  createTidalApiService,
} from '../src/services/tidal-api.ts';
import { loadProjectConfig } from '../src/services/config.ts';
import { loadProjectEnv } from '../src/services/env.ts';
import { SearchController } from '../src/controllers/search.ts';
import { UserController } from '../src/controllers/user.ts';
import { QueueController } from '../src/controllers/queue.ts';
import { createSearchCommand } from '../src/cli/commands/search.ts';
import { createLoginCommand } from '../src/cli/commands/login.ts';
import { createLogoutCommand } from '../src/cli/commands/logout.ts';
import { createMixesCommand } from '../src/cli/commands/mixes.ts';
import { createCollectionCommand } from '../src/cli/commands/collection.ts';
import { createQueueCommand } from '../src/cli/commands/queue.ts';

async function main(): Promise<void> {
  await loadProjectEnv();
  const config = await loadProjectConfig();
  await initUserAuth();

  const apiClient = createApiClient(credentialsProvider);
  const apiService = createTidalApiService(apiClient);
  const searchController = new SearchController(apiService, config);
  const userController = new UserController(apiService, config);
  const queueController = new QueueController(apiService);

  program.name('tidal').description('Tidal music API CLI').version('0.1.0');

  program.addCommand(createSearchCommand(searchController));
  program.addCommand(createLoginCommand());
  program.addCommand(createLogoutCommand());
  program.addCommand(createMixesCommand(userController));
  program.addCommand(createCollectionCommand(userController));
  program.addCommand(createQueueCommand(queueController));

  await program.parseAsync(process.argv);
}

main().catch((err: unknown) => {
  process.stderr.write(
    `Fatal error: ${err instanceof Error ? err.message : String(err)}\n`,
  );
  process.exit(1);
});
