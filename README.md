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

### Available Commands

```bash
tidal search <query>              # Search for music
tidal login                       # Log in with your Tidal account
tidal logout                      # Log out and clear tokens
tidal collection [--type tracks]  # View saved tracks/albums/artists/playlists
tidal mixes [--type daily]        # View personalized mixes
tidal queue show                  # View current play queue
tidal queue add <trackId...>      # Add tracks to queue
tidal queue clear                 # Clear the queue
```

## MCP Usage

Run the MCP server over stdio:

```bash
pnpm run dev:mcp
```

### Registered Tools

**Search & Detail:**

- `tidal_search` — Search for tracks, albums, artists, playlists
- `tidal_get_track`, `tidal_get_album`, `tidal_get_artist`, `tidal_get_playlist`

**User (requires login):**

- `tidal_login_status` — Check if user is logged in
- `tidal_get_collection` — Get saved tracks/albums/artists/playlists
- `tidal_get_mixes` — Get personalized daily/discovery/new-release mixes

**Recommendations (requires login):**

- `tidal_get_listening_profile` — Comprehensive music taste summary (cached 24h)
- `tidal_get_similar_artists`, `tidal_get_similar_tracks`, `tidal_get_similar_albums`
- `tidal_get_artist_radio` — Radio-style mix based on an artist

**Queue Management (requires login):**

- `tidal_get_queue`, `tidal_list_queues` — View play queues
- `tidal_add_to_queue`, `tidal_remove_from_queue`, `tidal_clear_queue`
- `tidal_skip_to_track`, `tidal_update_queue`

See [docs/RECOMMENDATIONS.md](docs/RECOMMENDATIONS.md) for how to use these tools to make personalized music recommendations.

## Development

```bash
pnpm run typecheck
pnpm test
pnpm run build
pnpm audit --audit-level moderate
```
