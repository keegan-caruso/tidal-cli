# tidal-cli — AI Assistant Guide

## Project Overview

A TypeScript 6 project exposing Tidal music search over two interfaces:
- **CLI**: `tidal search <query>` via Commander.js
- **MCP server**: `tidal_search` tool over stdio, for use with AI assistants

Auth uses Tidal's OAuth2 Client Credentials flow via `@tidal-music/auth`. Search uses `@tidal-music/api`.

## Architecture (inner → outer)

```
src/domain/       Pure types (Track, Album, Artist, Playlist, SearchResult) and error classes.
                  Zero external dependencies.

src/services/     Tidal auth initialization and API client. Wraps @tidal-music/auth and
                  @tidal-music/api. auth.ts provides initAuth() and credentialsProvider.
                  tidal-api.ts provides TidalApiService.

src/controllers/  Interface-agnostic business logic. SearchController sits here.
                  Depends only on services and domain. No knowledge of CLI or MCP.

src/mcp/          MCP tool definitions (zod schemas + handlers) and server setup.
                  Depends on controllers. Entry point: mcp/server.ts.

src/cli/          Commander.js commands. Depends on controllers.
                  Entry point: cli/commands/search.ts.

bin/              Entry points that wire the dependency chain together.
                  bin/cli.ts for CLI, bin/mcp-server.ts for MCP.
```

## Critical Rules

### NEVER use `console.log()`
The MCP server communicates over stdout using JSON-RPC. Any stray `console.log()` call
**will corrupt the protocol** and break MCP clients. This rule applies everywhere in the
codebase for consistency, not just in MCP files.

- **Diagnostics/logging**: use `console.error()` (writes to stderr)
- **CLI output**: use `process.stdout.write()`
- **MCP tool results**: return `{ content: [{ type: 'text', text: '...' }] }`

### Always use `.ts` import extensions
Source files use `.ts` extensions in all relative imports:

```typescript
// Correct
import { SearchController } from '../controllers/search.ts';

// Wrong
import { SearchController } from '../controllers/search.js';
import { SearchController } from '../controllers/search';
```

The `tsconfig.json` option `rewriteRelativeImportExtensions: true` rewrites these to `.js`
in the compiled `dist/` output automatically. At dev/test time, Node 24's `--strip-types`
resolves `.ts` imports directly.

## Environment Variables

Both entry points require these at startup and will throw `AuthConfigError` immediately if
either is missing:

```
TIDAL_CLIENT_ID=...
TIDAL_CLIENT_SECRET=...
```

Copy `.env.example` to `.env` and fill in your values. Get credentials at
https://developer.tidal.com/.

## Package Notes

`@tidal-music/search` does **not** exist on npm. Search is performed via `@tidal-music/api`
using `GET /searchResults/{query}?include=tracks,albums,artists,playlists`.

## Commands

```bash
npm install             # Install dependencies
npm run typecheck       # Type-check with tsc (no output files)
npm test                # Run tests with Node.js built-in test runner
npm run build           # Compile to dist/ with tsc
npm run dev:cli         # Run CLI directly from TypeScript (no build needed)
npm run dev:mcp         # Run MCP server directly from TypeScript
```

## Node.js TypeScript Execution

The `dev:*` and `test` scripts use Node 24's built-in `--strip-types` flag, which strips
TypeScript type annotations at runtime with no extra tooling. No loader or bundler needed.
Requires Node 24+.

## Dependency Wiring Pattern

Both entry points follow the same factory chain — no DI container:

```typescript
await initAuth();                                  // reads env vars, throws on missing
const apiClient = createAPIClient(credentialsProvider);
const apiService = createTidalApiService(apiClient);
const searchController = new SearchController(apiService);
// → pass searchController to CLI commands or MCP server
```

## Testing

Tests live next to source files as `*.test.ts`. Use Node's built-in `node:test` and
`node:assert/strict` — no vitest or jest:

```typescript
import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
```
