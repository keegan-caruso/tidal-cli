import { mkdir, readFile, writeFile, unlink } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';

const CONFIG_DIR = join(homedir(), '.tidal-cli');
const PROFILE_CACHE_FILE = join(CONFIG_DIR, 'profile-cache.json');

// Cache expires after 24 hours by default
const DEFAULT_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export interface ListeningProfile {
  // Summary stats
  totalSavedTracks: number;
  totalSavedAlbums: number;
  totalFollowedArtists: number;
  totalSavedPlaylists: number;

  // Top artists (by number of saved tracks/albums)
  topArtists: ArtistSummary[];

  // Recent additions (most recently saved)
  recentTracks: TrackSummary[];
  recentAlbums: AlbumSummary[];

  // Favorite genres/styles (inferred from artists)
  // Note: API doesn't directly provide genre info, so this may be empty

  // Personalized mixes available
  mixesAvailable: MixSummary[];

  // Metadata
  generatedAt: string;
  expiresAt: string;
}

export interface ArtistSummary {
  id: string;
  name: string;
  savedTrackCount: number;
  savedAlbumCount: number;
  followedAt?: string;
}

export interface TrackSummary {
  id: string;
  title: string;
  artistNames: string;
  addedAt: string;
}

export interface AlbumSummary {
  id: string;
  title: string;
  artistNames: string;
  releaseDate?: string;
  addedAt: string;
}

export interface MixSummary {
  type: 'daily' | 'discovery' | 'new-releases';
  count: number;
  names: string[];
}

interface CachedProfile {
  profile: ListeningProfile;
  cachedAt: string;
  expiresAt: string;
}

export async function getCachedProfile(): Promise<ListeningProfile | null> {
  try {
    const content = await readFile(PROFILE_CACHE_FILE, 'utf-8');
    const cached = JSON.parse(content) as CachedProfile;

    // Check if cache has expired
    if (new Date(cached.expiresAt) < new Date()) {
      return null;
    }

    return cached.profile;
  } catch {
    return null;
  }
}

export async function setCachedProfile(
  profile: ListeningProfile,
  ttlMs: number = DEFAULT_CACHE_TTL_MS,
): Promise<void> {
  await mkdir(dirname(PROFILE_CACHE_FILE), { recursive: true });

  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlMs);

  const cached: CachedProfile = {
    profile,
    cachedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  await writeFile(PROFILE_CACHE_FILE, JSON.stringify(cached, null, 2), 'utf-8');
}

export async function clearProfileCache(): Promise<void> {
  try {
    await unlink(PROFILE_CACHE_FILE);
  } catch {
    // File doesn't exist, nothing to clear
  }
}

export function isCacheExpired(profile: ListeningProfile): boolean {
  return new Date(profile.expiresAt) < new Date();
}
