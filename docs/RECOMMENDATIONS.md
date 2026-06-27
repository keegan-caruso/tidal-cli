# Music Recommendations Flow

This document describes how an AI agent can use the Tidal CLI MCP tools to analyze a user's listening history and make personalized music recommendations.

## Available Tools

### Profile & History

| Tool                          | Purpose                                                      |
| ----------------------------- | ------------------------------------------------------------ |
| `tidal_get_listening_profile` | Get comprehensive summary of user's music taste (cached 24h) |
| `tidal_get_collection`        | Get saved tracks, albums, artists, or playlists              |
| `tidal_get_mixes`             | Get Tidal's AI-generated personalized playlists              |
| `tidal_get_queue`             | See recently played tracks (from queue history)              |

### Discovery

| Tool                        | Purpose                                  |
| --------------------------- | ---------------------------------------- |
| `tidal_get_similar_artists` | Find artists similar to a given artist   |
| `tidal_get_similar_tracks`  | Find tracks similar to a given track     |
| `tidal_get_similar_albums`  | Find albums similar to a given album     |
| `tidal_get_artist_radio`    | Get a radio-style mix based on an artist |
| `tidal_search`              | Search for any music by name             |

### Playback

| Tool                 | Purpose                                           |
| -------------------- | ------------------------------------------------- |
| `tidal_add_to_queue` | Add recommended tracks to play queue              |
| `tidal_get_queue`    | View current queue state                          |
| `tidal_clear_queue`  | Clear the queue before adding new recommendations |

---

## Recommended Flow

### Step 1: Understand the User's Taste

Start by fetching the user's listening profile. This is **cached for 24 hours** so it's efficient to call multiple times.

```
Tool: tidal_get_listening_profile
Input: {}
```

**Response includes:**

- `topArtists` — Artists ranked by how much content the user has saved (tracks + albums)
- `recentTracks` — Most recently saved tracks (last 10)
- `recentAlbums` — Most recently saved albums (last 10)
- `mixesAvailable` — Which Tidal mixes are available (daily, discovery, new-releases)
- `totalSavedTracks`, `totalSavedAlbums`, etc. — Collection size stats

**Use `forceRefresh: true`** if the user says their profile is outdated or you need fresh data.

### Step 2: Analyze Patterns

From the profile, identify:

1. **Top artists** — The `topArtists` array is sorted by `savedTrackCount + savedAlbumCount`
2. **Recent interests** — Look at `recentTracks` and `recentAlbums` for what they've been into lately
3. **Followed artists** — Artists with `followedAt` set are explicitly followed

### Step 3: Find Similar Content

Based on what you learned, use discovery tools:

#### Option A: Similar Artists

For each top artist, find similar artists:

```
Tool: tidal_get_similar_artists
Input: { "artistId": "3520813" }
```

This returns artists with similar sound/genre that the user might not know.

#### Option B: Similar Tracks

For a recently saved track, find similar tracks:

```
Tool: tidal_get_similar_tracks
Input: { "trackId": "75413016" }
```

Great for building "more like this" recommendations.

#### Option C: Artist Radio

Get a pre-built mix based on an artist:

```
Tool: tidal_get_artist_radio
Input: { "artistId": "3520813" }
```

Returns a mix of tracks by the artist and similar artists — good for immediate playback.

#### Option D: Tidal's Mixes

Use Tidal's own AI recommendations:

```
Tool: tidal_get_mixes
Input: { "type": "discovery" }
```

Types available:

- `daily` — Daily mixes based on listening history
- `discovery` — New music recommendations
- `new-releases` — New releases from followed artists

### Step 4: Present Recommendations

When presenting recommendations to the user, include:

- Track/artist/album name
- Why you're recommending it (e.g., "Similar to Radiohead, one of your top artists")
- The Tidal URL for easy access

### Step 5: Queue for Playback (Optional)

If the user wants to listen now, add tracks to their queue:

```
Tool: tidal_add_to_queue
Input: {
  "trackIds": ["12345", "67890", "11111"],
  "position": "last"
}
```

Use `position: "next"` to play immediately after the current track, or `position: "last"` to add to the end.

---

## Example Conversation Flow

**User:** "Recommend some new music based on what I've been listening to"

**Agent actions:**

1. Call `tidal_get_listening_profile` to understand their taste
2. Identify top 3 artists from `topArtists`
3. Call `tidal_get_similar_artists` for each top artist
4. Filter out artists already in their collection
5. Present 5-10 new artist recommendations with reasoning

**User:** "I want to hear something like that track I saved yesterday"

**Agent actions:**

1. Call `tidal_get_listening_profile` and check `recentTracks`
2. Find the track from yesterday
3. Call `tidal_get_similar_tracks` with that track ID
4. Present similar tracks
5. Offer to queue them with `tidal_add_to_queue`

**User:** "Just play me some music I'd like"

**Agent actions:**

1. Call `tidal_get_listening_profile` and pick a top artist
2. Call `tidal_get_artist_radio` for that artist
3. Call `tidal_add_to_queue` with the radio tracks
4. Confirm what's now queued

---

## Profile Cache Behavior

The listening profile is cached to `~/.tidal-cli/profile-cache.json` for 24 hours.

- **First call**: Fetches all collection data (tracks, albums, artists, playlists, mixes) and caches
- **Subsequent calls**: Returns cached data instantly
- **Force refresh**: Use `forceRefresh: true` to bypass cache

The response includes a `_meta` object:

```json
{
  "_meta": {
    "fromCache": true,
    "cacheHint": "This profile was loaded from cache. Use forceRefresh=true for fresh data."
  }
}
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER REQUEST                              │
│                "Recommend music based on my taste"               │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                  1. GET LISTENING PROFILE                        │
│                                                                  │
│  tidal_get_listening_profile {}                                  │
│                                                                  │
│  Returns:                                                        │
│  ├── topArtists: [{id, name, savedTrackCount, savedAlbumCount}] │
│  ├── recentTracks: [{id, title, artistNames, addedAt}]          │
│  ├── recentAlbums: [{id, title, artistNames, addedAt}]          │
│  └── mixesAvailable: [{type, count, names}]                     │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                   2. ANALYZE TOP ARTISTS                         │
│                                                                  │
│  Identify patterns:                                              │
│  • Which artists have most saved content?                        │
│  • Which artists were recently followed?                         │
│  • What do recent saves tell us about current mood?              │
└─────────────────────────────────────────────────────────────────┘
                                 │
                    ┌────────────┼────────────┐
                    ▼            ▼            ▼
┌─────────────────────┐ ┌─────────────────┐ ┌─────────────────────┐
│ 3A. SIMILAR ARTISTS │ │ 3B. ARTIST RADIO│ │ 3C. TIDAL MIXES     │
│                     │ │                 │ │                     │
│ tidal_get_similar_  │ │ tidal_get_      │ │ tidal_get_mixes     │
│ artists             │ │ artist_radio    │ │ {type: "discovery"} │
│ {artistId: "123"}   │ │ {artistId:"123"}│ │                     │
│                     │ │                 │ │                     │
│ → New artists to    │ │ → Ready-to-play │ │ → Curated playlists │
│   explore           │ │   track mix     │ │   from Tidal AI     │
└─────────────────────┘ └─────────────────┘ └─────────────────────┘
                    │            │            │
                    └────────────┼────────────┘
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                  4. FILTER & DEDUPLICATE                         │
│                                                                  │
│  • Remove artists/tracks already in user's collection            │
│  • Remove duplicates from multiple similar-artist calls          │
│  • Rank by relevance to user's taste                             │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                  5. PRESENT RECOMMENDATIONS                      │
│                                                                  │
│  "Based on your love for Radiohead and Thom Yorke, you might    │
│   enjoy these artists you haven't saved yet:                     │
│                                                                  │
│   1. Portishead - Similar experimental sound                     │
│   2. Massive Attack - Trip-hop like Radiohead's electronic work  │
│   3. ..."                                                        │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│              6. QUEUE FOR PLAYBACK (Optional)                    │
│                                                                  │
│  tidal_add_to_queue {                                            │
│    trackIds: ["track1", "track2", "track3"],                     │
│    position: "next"                                              │
│  }                                                               │
│                                                                  │
│  → Tracks are now queued for playback on user's device           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tool Reference

### tidal_get_listening_profile

Get a comprehensive summary of the user's music taste.

**Input:**

```json
{
  "forceRefresh": false // Set true to bypass 24-hour cache
}
```

**Output:**

```json
{
  "totalSavedTracks": 342,
  "totalSavedAlbums": 45,
  "totalFollowedArtists": 28,
  "totalSavedPlaylists": 12,
  "topArtists": [
    {
      "id": "3520813",
      "name": "Radiohead",
      "savedTrackCount": 47,
      "savedAlbumCount": 8,
      "followedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "recentTracks": [
    {
      "id": "75413016",
      "title": "Karma Police",
      "artistNames": "Radiohead",
      "addedAt": "2024-03-20T14:22:00Z"
    }
  ],
  "recentAlbums": [
    {
      "id": "12345678",
      "title": "OK Computer",
      "artistNames": "Radiohead",
      "releaseDate": "1997-05-21",
      "addedAt": "2024-03-18T09:15:00Z"
    }
  ],
  "mixesAvailable": [
    { "type": "daily", "count": 6, "names": ["My Mix 1", "My Mix 2", ...] },
    { "type": "discovery", "count": 3, "names": ["Discovery Mix", ...] }
  ],
  "generatedAt": "2024-03-21T00:00:00Z",
  "expiresAt": "2024-03-22T00:00:00Z",
  "_meta": {
    "fromCache": false,
    "cacheHint": "This profile was freshly generated and cached."
  }
}
```

### tidal_get_similar_artists

**Input:**

```json
{
  "artistId": "3520813",
  "countryCode": "US" // Optional, defaults to US
}
```

**Output:**

```json
{
  "artists": [
    {
      "id": "123456",
      "name": "Portishead",
      "popularity": 72,
      "url": "https://tidal.com/artist/123456"
    }
  ]
}
```

### tidal_get_similar_tracks

**Input:**

```json
{
  "trackId": "75413016",
  "countryCode": "US"
}
```

**Output:**

```json
{
  "tracks": [
    {
      "id": "987654",
      "title": "Unfinished Sympathy",
      "duration": "PT5M11S",
      "durationText": "5:11",
      "explicit": false,
      "artists": [{ "id": "123", "name": "Massive Attack" }],
      "url": "https://tidal.com/track/987654"
    }
  ]
}
```

### tidal_get_artist_radio

**Input:**

```json
{
  "artistId": "3520813",
  "countryCode": "US"
}
```

**Output:** Same structure as `tidal_get_similar_tracks`

### tidal_add_to_queue

**Input:**

```json
{
  "trackIds": ["12345", "67890"],
  "position": "next", // "next" or "last"
  "queueId": null // Optional, uses active queue if not specified
}
```

**Output:**

```json
{
  "success": true,
  "queueId": "550e8400-e29b-41d4-a716-446655440000",
  "tracksAdded": 2,
  "position": "next"
}
```
