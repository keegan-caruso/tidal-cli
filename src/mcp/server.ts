import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { SearchController } from '../controllers/search.ts';
import { detailToolSchema } from './inputs/detail.ts';
import { searchToolSchema } from './inputs/search.ts';
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
  albumOutputSchema,
  artistOutputSchema,
  playlistOutputSchema,
  trackOutputSchema,
} from './schema/detail.ts';
import { searchOutputSchema } from './schema/search.ts';

export function createMcpServer(searchController: SearchController): McpServer {
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

  return server;
}

export async function startMcpServer(server: McpServer): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[tidal-mcp] Server started on stdio');
}
