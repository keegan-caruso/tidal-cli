import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { SearchController } from '../controllers/search.ts';
import {
  searchToolName,
  searchToolDescription,
  searchToolSchema,
  createSearchToolHandler,
} from './tools/search.ts';

export function createMcpServer(searchController: SearchController): McpServer {
  const server = new McpServer({
    name: 'tidal-cli',
    version: '0.1.0',
  });

  server.tool(
    searchToolName,
    searchToolDescription,
    searchToolSchema,
    createSearchToolHandler(searchController),
  );

  return server;
}

export async function startMcpServer(server: McpServer): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[tidal-mcp] Server started on stdio');
}
