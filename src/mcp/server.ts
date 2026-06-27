import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { SearchController } from '../controllers/search.ts';
import type { UserController } from '../controllers/user.ts';
import type { QueueController } from '../controllers/queue.ts';
import type { ProfileController } from '../controllers/profile.ts';
import type { TidalApiService } from '../services/tidal-api.ts';
import { detailToolSchema } from './inputs/detail.ts';
import { searchToolSchema } from './inputs/search.ts';
import {
  mixesToolSchema,
  collectionToolSchema,
  loginStatusToolSchema,
} from './inputs/user.ts';
import {
  getQueueToolSchema,
  listQueuesToolSchema,
  addToQueueToolSchema,
  removeFromQueueToolSchema,
  clearQueueToolSchema,
  skipToTrackToolSchema,
  updateQueueToolSchema,
} from './inputs/queue.ts';
import {
  getListeningProfileToolSchema,
  getSimilarArtistsToolSchema,
  getSimilarTracksToolSchema,
  getSimilarAlbumsToolSchema,
  getArtistRadioToolSchema,
} from './inputs/profile.ts';
import {
  createGetAlbumToolHandler,
  createGetArtistToolHandler,
  createGetPlaylistToolHandler,
  createGetTrackToolHandler,
  getAlbumToolName,
  getArtistToolName,
  getPlaylistToolName,
  getTrackToolName,
} from './tools/detail.ts';
import {
  searchToolName,
  searchToolDescription,
  createSearchToolHandler,
} from './tools/search.ts';
import {
  getMixesToolName,
  getMixesToolDescription,
  getCollectionToolName,
  getCollectionToolDescription,
  loginStatusToolName,
  loginStatusToolDescription,
  createGetMixesToolHandler,
  createGetCollectionToolHandler,
  createLoginStatusToolHandler,
} from './tools/user.ts';
import {
  getQueueToolName,
  getQueueToolDescription,
  listQueuesToolName,
  listQueuesToolDescription,
  addToQueueToolName,
  addToQueueToolDescription,
  removeFromQueueToolName,
  removeFromQueueToolDescription,
  clearQueueToolName,
  clearQueueToolDescription,
  skipToTrackToolName,
  skipToTrackToolDescription,
  updateQueueToolName,
  updateQueueToolDescription,
  createGetQueueToolHandler,
  createListQueuesToolHandler,
  createAddToQueueToolHandler,
  createRemoveFromQueueToolHandler,
  createClearQueueToolHandler,
  createSkipToTrackToolHandler,
  createUpdateQueueToolHandler,
} from './tools/queue.ts';
import {
  getListeningProfileToolName,
  getListeningProfileToolDescription,
  getSimilarArtistsToolName,
  getSimilarArtistsToolDescription,
  getSimilarTracksToolName,
  getSimilarTracksToolDescription,
  getSimilarAlbumsToolName,
  getSimilarAlbumsToolDescription,
  getArtistRadioToolName,
  getArtistRadioToolDescription,
  createGetListeningProfileToolHandler,
  createGetSimilarArtistsToolHandler,
  createGetSimilarTracksToolHandler,
  createGetSimilarAlbumsToolHandler,
  createGetArtistRadioToolHandler,
} from './tools/profile.ts';
import {
  albumOutputSchema,
  artistOutputSchema,
  playlistOutputSchema,
  trackOutputSchema,
} from './schema/detail.ts';
import { searchOutputSchema } from './schema/search.ts';
import {
  mixesOutputSchema,
  collectionOutputSchema,
  loginStatusOutputSchema,
} from './schema/user.ts';

export interface McpServerOptions {
  searchController: SearchController;
  userController?: UserController;
  queueController?: QueueController;
  profileController?: ProfileController;
  apiService?: TidalApiService;
}

export function createMcpServer(
  optionsOrController: McpServerOptions | SearchController,
): McpServer {
  const options: McpServerOptions =
    'searchController' in optionsOrController
      ? optionsOrController
      : { searchController: optionsOrController };

  const {
    searchController,
    userController,
    queueController,
    profileController,
    apiService,
  } = options;

  const server = new McpServer({
    name: 'tidal-cli',
    version: '0.1.0',
  });

  server.registerTool(
    searchToolName,
    {
      description: searchToolDescription,
      inputSchema: searchToolSchema,
      outputSchema: searchOutputSchema,
    },
    createSearchToolHandler(searchController),
  );

  server.registerTool(
    getTrackToolName,
    {
      description: 'Get a Tidal track by id. Returns JSON track details.',
      inputSchema: detailToolSchema,
      outputSchema: trackOutputSchema,
    },
    createGetTrackToolHandler(searchController),
  );

  server.registerTool(
    getAlbumToolName,
    {
      description: 'Get a Tidal album by id. Returns JSON album details.',
      inputSchema: detailToolSchema,
      outputSchema: albumOutputSchema,
    },
    createGetAlbumToolHandler(searchController),
  );

  server.registerTool(
    getArtistToolName,
    {
      description: 'Get a Tidal artist by id. Returns JSON artist details.',
      inputSchema: detailToolSchema,
      outputSchema: artistOutputSchema,
    },
    createGetArtistToolHandler(searchController),
  );

  server.registerTool(
    getPlaylistToolName,
    {
      description: 'Get a Tidal playlist by id. Returns JSON playlist details.',
      inputSchema: detailToolSchema,
      outputSchema: playlistOutputSchema,
    },
    createGetPlaylistToolHandler(searchController),
  );

  // User tools (always register login status, only register others if userController is provided)
  server.registerTool(
    loginStatusToolName,
    {
      description: loginStatusToolDescription,
      inputSchema: loginStatusToolSchema,
      outputSchema: loginStatusOutputSchema,
    },
    createLoginStatusToolHandler(),
  );

  if (userController != null) {
    server.registerTool(
      getMixesToolName,
      {
        description: getMixesToolDescription,
        inputSchema: mixesToolSchema,
        outputSchema: mixesOutputSchema,
      },
      createGetMixesToolHandler(userController),
    );

    server.registerTool(
      getCollectionToolName,
      {
        description: getCollectionToolDescription,
        inputSchema: collectionToolSchema,
        outputSchema: collectionOutputSchema,
      },
      createGetCollectionToolHandler(userController),
    );
  }

  // Queue tools
  if (queueController != null) {
    server.registerTool(
      getQueueToolName,
      {
        description: getQueueToolDescription,
        inputSchema: getQueueToolSchema,
      },
      createGetQueueToolHandler(queueController),
    );

    server.registerTool(
      listQueuesToolName,
      {
        description: listQueuesToolDescription,
        inputSchema: listQueuesToolSchema,
      },
      createListQueuesToolHandler(queueController),
    );

    server.registerTool(
      addToQueueToolName,
      {
        description: addToQueueToolDescription,
        inputSchema: addToQueueToolSchema,
      },
      createAddToQueueToolHandler(queueController),
    );

    server.registerTool(
      removeFromQueueToolName,
      {
        description: removeFromQueueToolDescription,
        inputSchema: removeFromQueueToolSchema,
      },
      createRemoveFromQueueToolHandler(queueController),
    );

    server.registerTool(
      clearQueueToolName,
      {
        description: clearQueueToolDescription,
        inputSchema: clearQueueToolSchema,
      },
      createClearQueueToolHandler(queueController),
    );

    server.registerTool(
      skipToTrackToolName,
      {
        description: skipToTrackToolDescription,
        inputSchema: skipToTrackToolSchema,
      },
      createSkipToTrackToolHandler(queueController),
    );

    server.registerTool(
      updateQueueToolName,
      {
        description: updateQueueToolDescription,
        inputSchema: updateQueueToolSchema,
      },
      createUpdateQueueToolHandler(queueController),
    );
  }

  // Profile and recommendation tools
  if (profileController != null) {
    server.registerTool(
      getListeningProfileToolName,
      {
        description: getListeningProfileToolDescription,
        inputSchema: getListeningProfileToolSchema,
      },
      createGetListeningProfileToolHandler(profileController),
    );
  }

  if (apiService != null) {
    server.registerTool(
      getSimilarArtistsToolName,
      {
        description: getSimilarArtistsToolDescription,
        inputSchema: getSimilarArtistsToolSchema,
      },
      createGetSimilarArtistsToolHandler(apiService),
    );

    server.registerTool(
      getSimilarTracksToolName,
      {
        description: getSimilarTracksToolDescription,
        inputSchema: getSimilarTracksToolSchema,
      },
      createGetSimilarTracksToolHandler(apiService),
    );

    server.registerTool(
      getSimilarAlbumsToolName,
      {
        description: getSimilarAlbumsToolDescription,
        inputSchema: getSimilarAlbumsToolSchema,
      },
      createGetSimilarAlbumsToolHandler(apiService),
    );

    server.registerTool(
      getArtistRadioToolName,
      {
        description: getArtistRadioToolDescription,
        inputSchema: getArtistRadioToolSchema,
      },
      createGetArtistRadioToolHandler(apiService),
    );
  }

  return server;
}

export async function startMcpServer(server: McpServer): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[tidal-mcp] Server started on stdio');
}
