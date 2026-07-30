export type MediaType = 'anime' | 'manga';

export type WatchStatus = 'watching' | 'reading' | 'completed' | 'plan_to_watch' | 'on_hold' | 'dropped';

export type Rating = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface TimestampData {
  hours: number;
  minutes: number;
  seconds: number;
}

export interface EpisodeProgress {
  currentEpisode: number; // Episode (Anime) / Chapter (Manga) saat ini
  totalEpisodes: number;   // Total Episode / Total Chapter
  season?: number;        // Season (Anime)
  volumes?: number;       // Total Volume (Manga)
  lastTimestamp?: string; // Formatted string (contoh: "24:00" atau "1:15:30")
  lastTimeObj?: TimestampData; // Jam, Menit, Detik untuk Anime
  lastPage?: number;      // Nomor Halaman untuk Manga (integer)
}

export interface WatchlistItem {
  id: string;
  title: string;
  originalTitle?: string;
  type: MediaType;
  status: WatchStatus;
  rating: Rating | null;
  progress: EpisodeProgress;
  posterUrl: string;
  bannerUrl?: string;
  genres: string[];
  releaseYear: number;
  runtimeMinutes: number;
  notes?: string;
  linkUrl?: string;       // Link streaming anime atau link baca manga
  favorite: boolean;
  tags: string[];
  customOrder?: number;   // Urutan prioritas kustom manual (1, 2, 3...)
  bannerPositionY?: number; // Posisi vertikal background image (0–100, default 45)
  createdAt: string;
  updatedAt: string;
}

export interface FilterOptions {
  searchQuery: string;
  category: MediaType | 'all';
  status: WatchStatus | 'all';
  genre: string | 'all';
  sortBy: 'customOrder' | 'updatedAt' | 'rating' | 'title' | 'releaseYear' | 'progress';
  sortOrder: 'asc' | 'desc';
  favoritesOnly: boolean;
}

export interface StatsSummary {
  totalItems: number;
  watchingCount: number;
  completedCount: number;
  planToWatchCount: number;
  onHoldCount: number;
  droppedCount: number;
  favoriteCount: number;
  totalHoursWatched: number;
  averageRating: number;
  remainingMinutes: number;    // Sisa menit menonton untuk semua anime (total - sudah ditonton)
  remainingChapters: number;  // Sisa chapter untuk semua manga
}
