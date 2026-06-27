import type { TidalApiService } from '../services/tidal-api.ts';
import type {
  ListeningProfile,
  ArtistSummary,
  TrackSummary,
  AlbumSummary,
  MixSummary,
} from '../services/profile-cache.ts';
import {
  getCachedProfile,
  setCachedProfile,
  clearProfileCache,
} from '../services/profile-cache.ts';
import { UserAuthRequiredError } from '../domain/errors.ts';
import { isUserLoggedIn } from '../services/auth.ts';

// Cache TTL: 24 hours
const PROFILE_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export interface GetProfileOptions {
  forceRefresh?: boolean;
}

export interface GetProfileResult {
  profile: ListeningProfile;
  fromCache: boolean;
}

export class ProfileController {
  private readonly apiService: TidalApiService;

  constructor(apiService: TidalApiService) {
    this.apiService = apiService;
  }

  async getListeningProfile(
    options: GetProfileOptions = {},
  ): Promise<GetProfileResult> {
    await this.requireUserAuth();

    // Check cache first (unless force refresh)
    if (!options.forceRefresh) {
      const cached = await getCachedProfile();
      if (cached != null) {
        return { profile: cached, fromCache: true };
      }
    }

    // Generate fresh profile
    const profile = await this.generateProfile();

    // Cache the result
    await setCachedProfile(profile, PROFILE_CACHE_TTL_MS);

    return { profile, fromCache: false };
  }

  async clearCache(): Promise<void> {
    await clearProfileCache();
  }

  private async generateProfile(): Promise<ListeningProfile> {
    // Fetch all data in parallel
    const [
      tracksResult,
      albumsResult,
      artistsResult,
      playlistsResult,
      dailyMixes,
      discoveryMixes,
      newReleaseMixes,
    ] = await Promise.all([
      this.apiService.getCollectionTracks('-addedAt'),
      this.apiService.getCollectionAlbums('-addedAt'),
      this.apiService.getCollectionArtists('-addedAt'),
      this.apiService.getCollectionPlaylists('-addedAt'),
      this.apiService.getDailyMixes().catch(() => ({ playlists: [] })),
      this.apiService.getDiscoveryMixes().catch(() => ({ playlists: [] })),
      this.apiService.getNewReleaseMixes().catch(() => ({ playlists: [] })),
    ]);

    // Build artist summary (count tracks and albums per artist)
    const artistStats = new Map<string, {
      id: string;
      name: string;
      trackCount: number;
      albumCount: number;
      followedAt?: string;
    }>();

    // Count tracks per artist
    for (const { item: track } of tracksResult.items) {
      for (const artist of track.artists) {
        const existing = artistStats.get(artist.id);
        if (existing) {
          existing.trackCount++;
        } else {
          artistStats.set(artist.id, {
            id: artist.id,
            name: artist.name,
            trackCount: 1,
            albumCount: 0,
          });
        }
      }
    }

    // Count albums per artist
    for (const { item: album } of albumsResult.items) {
      for (const artist of album.artists) {
        const existing = artistStats.get(artist.id);
        if (existing) {
          existing.albumCount++;
        } else {
          artistStats.set(artist.id, {
            id: artist.id,
            name: artist.name,
            trackCount: 0,
            albumCount: 1,
          });
        }
      }
    }

    // Add followed artists
    for (const { item: artist, addedAt } of artistsResult.items) {
      const existing = artistStats.get(artist.id);
      if (existing) {
        existing.followedAt = addedAt;
      } else {
        artistStats.set(artist.id, {
          id: artist.id,
          name: artist.name,
          trackCount: 0,
          albumCount: 0,
          followedAt: addedAt,
        });
      }
    }

    // Sort artists by total saved content
    const topArtists: ArtistSummary[] = Array.from(artistStats.values())
      .sort((a, b) => (b.trackCount + b.albumCount) - (a.trackCount + a.albumCount))
      .slice(0, 20)
      .map((a) => ({
        id: a.id,
        name: a.name,
        savedTrackCount: a.trackCount,
        savedAlbumCount: a.albumCount,
        followedAt: a.followedAt,
      }));

    // Recent tracks (top 10)
    const recentTracks: TrackSummary[] = tracksResult.items.slice(0, 10).map(({ item, addedAt }) => ({
      id: item.id,
      title: item.title,
      artistNames: item.artists.map((a) => a.name).join(', '),
      addedAt,
    }));

    // Recent albums (top 10)
    const recentAlbums: AlbumSummary[] = albumsResult.items.slice(0, 10).map(({ item, addedAt }) => ({
      id: item.id,
      title: item.title,
      artistNames: item.artists.map((a) => a.name).join(', '),
      releaseDate: item.releaseDate,
      addedAt,
    }));

    // Mixes summary
    const mixesAvailable: MixSummary[] = [];

    if (dailyMixes.playlists.length > 0) {
      mixesAvailable.push({
        type: 'daily',
        count: dailyMixes.playlists.length,
        names: dailyMixes.playlists.map((p) => p.name),
      });
    }

    if (discoveryMixes.playlists.length > 0) {
      mixesAvailable.push({
        type: 'discovery',
        count: discoveryMixes.playlists.length,
        names: discoveryMixes.playlists.map((p) => p.name),
      });
    }

    if (newReleaseMixes.playlists.length > 0) {
      mixesAvailable.push({
        type: 'new-releases',
        count: newReleaseMixes.playlists.length,
        names: newReleaseMixes.playlists.map((p) => p.name),
      });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + PROFILE_CACHE_TTL_MS);

    return {
      totalSavedTracks: tracksResult.items.length,
      totalSavedAlbums: albumsResult.items.length,
      totalFollowedArtists: artistsResult.items.length,
      totalSavedPlaylists: playlistsResult.items.length,
      topArtists,
      recentTracks,
      recentAlbums,
      mixesAvailable,
      generatedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };
  }

  private async requireUserAuth(): Promise<void> {
    const loggedIn = await isUserLoggedIn();
    if (!loggedIn) {
      throw new UserAuthRequiredError();
    }
  }
}
