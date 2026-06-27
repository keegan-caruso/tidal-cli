# tidal-cli

Tidal music search over two interfaces:

- CLI: `tidal search <query>`
- MCP server: `tidal_search` and detail lookup tools over stdio

## Requirements

- Node.js 26+
- pnpm 11+
- Tidal developer credentials from https://developer.tidal.com/

## Setup

```bash
pnpm install
cp .env.example .env
```

Add your Tidal credentials to `.env`:

```bash
TIDAL_CLIENT_ID=your_client_id_here
TIDAL_CLIENT_SECRET=your_client_secret_here
```

The CLI and MCP server automatically load `.env` from the project root. The file
is ignored by git.

## Project Defaults

Optional search defaults can be set in `.tidal-cli.json` in the project root:

```json
{
  "countryCode": "US",
  "explicitFilter": "INCLUDE",
  "searchType": "all",
  "limit": 10
}
```

`.tidal-cli.json` is also ignored by git. CLI flags and MCP tool inputs override
these defaults.

## CLI Usage

Run directly from TypeScript:

```bash
pnpm run dev:cli -- search "Radiohead" --type tracks --limit 1
pnpm run dev:cli -- search "Radiohead" --type tracks --limit 1 --json
pnpm run dev:cli -- search "Radiohead" --open
```

After building:

```bash
pnpm run build
node dist/bin/cli.js search "Radiohead" --limit 1
```

## MCP Usage

Run the MCP server over stdio:

```bash
pnpm run dev:mcp
```

Registered tools:

- `tidal_search`
- `tidal_get_track`
- `tidal_get_album`
- `tidal_get_artist`
- `tidal_get_playlist`

`tidal_search` returns JSON in both `structuredContent` and text `content`.

## Development

```bash
pnpm run typecheck
pnpm test
pnpm run build
pnpm audit --audit-level moderate
```
