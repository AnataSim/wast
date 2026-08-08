import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Check, Filter, Compass, Film, BookOpen, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';

// ── Extended DiscoveryItem with availability metadata ─────────────────────────
interface DiscoveryItem {
  id: string;
  anilistId: number;
  title: string;
  originalTitle: string | null;  // native Japanese / romaji title
  posterUrl: string;
  genre: string;
  genres: string[];
  type: 'anime' | 'manga';
  rating: number;
  hasAnime: boolean;
  hasManga: boolean;
  animeEpisodes: number | null;
  mangaChapters: number | null;
}

const GENRES = ['Semua', 'Action', 'Romance', 'Fantasy', 'Sci-Fi', 'Comedy', 'Isekai', 'Slice of Life'];

const GENRE_MAP: Record<string, string | undefined> = {
  'Semua': undefined,
  'Action': 'Action',
  'Romance': 'Romance',
  'Fantasy': 'Fantasy',
  'Sci-Fi': 'Sci-Fi',
  'Comedy': 'Comedy',
  'Isekai': 'Fantasy',
  'Slice of Life': 'Slice of Life',
};

const CARD_WIDTH = 180;
const CARD_GAP = 12;
const TOTAL_CARDS_TARGET = 50;

// ── Storage keys ──────────────────────────────────────────────────────────────
const LS_GENRE_KEY = 'wast_discovery_genre';
const LS_SCROLL_KEY = 'wast_discovery_scroll';
const LS_SEED_KEY = 'wast_discovery_seed_date';
const LS_CARDS_KEY = 'wast_discovery_cards_v2';

function getTodaySeed(): string {
  return new Date().toISOString().slice(0, 10);
}

function hashStr(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function seededShuffle<T>(arr: T[], seed: string): T[] {
  const copy = [...arr];
  let state = hashStr(seed);
  const rand = () => {
    state ^= state << 13;
    state ^= state >> 17;
    state ^= state << 5;
    return (state >>> 0) / 0xffffffff;
  };
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

interface DiscoveryMarqueeBannerProps {
  onQuickAdd: (item: {
    title: string;
    originalTitle?: string;
    posterUrl: string;
    type: 'anime' | 'manga';
    genre: string;
    totalEpisodes?: number;
  }) => void;
  existingTitles: string[];
}

// ── Fetch a page of media from AniList ───────────────────────────────────────
async function fetchAniListBatch(genre: string, page: number, type: 'ANIME' | 'MANGA'): Promise<DiscoveryItem[]> {
  const cacheKey = `wast_cache_${genre}_${type}_p${page}`;
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (_) {}

  const apiGenre = GENRE_MAP[genre];
  const isIsekaiSearch = genre === 'Isekai';
  const filterClause = isIsekaiSearch ? `tag: "Isekai", ` : apiGenre ? `genre: $genre, ` : '';

  const graphqlQuery = `
    query ($genre: String, $page: Int, $type: MediaType) {
      Page(page: $page, perPage: 30) {
        media(${filterClause}sort: [POPULARITY_DESC, SCORE_DESC], type: $type) {
           id
          title { english romaji native }
          coverImage { extraLarge large medium }
          genres
          type
          averageScore
          episodes
          chapters
        }
      }
    }
  `;

  try {
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query: graphqlQuery, variables: { genre: isIsekaiSearch ? undefined : apiGenre, page, type } }),
    });

    if (!res.ok) return [];

    const json = await res.json();
    const media = json.data?.Page?.media || [];
    const targetGenreStr = isIsekaiSearch ? 'Isekai' : apiGenre;

    const mapped: DiscoveryItem[] = media
      .filter((item: any) => {
        const url = item.coverImage?.extraLarge || item.coverImage?.large || item.coverImage?.medium || '';
        return url && !url.includes('default');
      })
      .map((item: any) => {
        const rawGenres: string[] = Array.isArray(item.genres) ? item.genres : [];

        let orderedGenres: string[];
        if (targetGenreStr) {
          const matchIdx = rawGenres.findIndex((g) => g.toLowerCase() === targetGenreStr.toLowerCase());
          if (matchIdx > 0) {
            orderedGenres = [
              rawGenres[matchIdx],
              ...rawGenres.filter((_, i) => i !== matchIdx),
            ].slice(0, 3);
          } else if (matchIdx === 0) {
            orderedGenres = rawGenres.slice(0, 3);
          } else if (isIsekaiSearch) {
            orderedGenres = ['Isekai', ...rawGenres].slice(0, 3);
          } else {
            orderedGenres = rawGenres.slice(0, 3);
          }
        } else {
          orderedGenres = rawGenres.slice(0, 3);
        }

        return {
          id: `anilist-${item.id}`,
          anilistId: item.id,
          title: item.title?.english || item.title?.romaji || item.title?.native || 'Unknown',
          originalTitle: item.title?.native || item.title?.romaji || null,
          posterUrl: item.coverImage?.extraLarge || item.coverImage?.large || item.coverImage?.medium || '',
          genre: orderedGenres.length > 0 ? orderedGenres[0] : (isIsekaiSearch ? 'Isekai' : 'General'),
          genres: orderedGenres,
          type: item.type === 'MANGA' ? 'manga' : 'anime',
          rating: item.averageScore ? Number((item.averageScore / 10).toFixed(1)) : 8.5,
          hasAnime: item.type === 'ANIME',
          hasManga: item.type === 'MANGA',
          animeEpisodes: item.type === 'ANIME' ? (item.episodes ?? null) : null,
          mangaChapters: item.type === 'MANGA' ? (item.chapters ?? null) : null,
        };
      });

    if (mapped.length > 0) {
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(mapped));
      } catch (_) {}
    }

    return mapped;
  } catch (_) {
    return [];
  }
}

// ── Check if a title also has the other media type via AniList relations ──────
// Uses the exact AniList ID to fetch relations — much more accurate than title search.
const availabilityCache = new Map<number, { hasAnime: boolean; hasManga: boolean; animeEpisodes: number | null; mangaChapters: number | null }>();

async function checkAvailability(item: DiscoveryItem): Promise<Partial<DiscoveryItem>> {
  if (availabilityCache.has(item.anilistId)) {
    return availabilityCache.get(item.anilistId)!;
  }

  const sessionKey = `wast_avail2_${item.anilistId}`;
  try {
    const cached = sessionStorage.getItem(sessionKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      availabilityCache.set(item.anilistId, parsed);
      return parsed;
    }
  } catch (_) {}

  // Query this exact entry plus its relations by AniList ID
  const query = `
    query ($id: Int) {
      Media(id: $id) {
        type
        episodes
        chapters
        relations {
          edges {
            relationType
            node {
              id
              type
              episodes
              chapters
              format
            }
          }
        }
      }
    }
  `;

  try {
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query, variables: { id: item.anilistId } }),
    });

    if (!res.ok) throw new Error('API error');
    const json = await res.json();
    const media = json.data?.Media;
    if (!media) throw new Error('No media');

    const selfIsAnime = media.type === 'ANIME';
    const selfIsManga = media.type === 'MANGA';

    // Collect related entries — look for SOURCE (manga→anime) or ADAPTATION
    const relations: any[] = (media.relations?.edges || []).map((e: any) => e.node);
    const relatedAnime = relations.find(
      (n) => n.type === 'ANIME' && ['ADAPTATION', 'ALTERNATIVE', 'SIDE_STORY', 'PARENT'].includes(undefined as any) === false
    ) || relations.find((n) => n.type === 'ANIME');
    const relatedManga = relations.find((n) => n.type === 'MANGA');

    const hasAnime = selfIsAnime || !!relatedAnime;
    const hasManga = selfIsManga || !!relatedManga;

    // Use self episodes/chapters for self type; related node for the other type
    const animeEpisodes: number | null = selfIsAnime
      ? (media.episodes ?? null)
      : relatedAnime ? (relatedAnime.episodes ?? null) : null;
    const mangaChapters: number | null = selfIsManga
      ? (media.chapters ?? null)
      : relatedManga ? (relatedManga.chapters ?? null) : null;

    const result = { hasAnime, hasManga, animeEpisodes, mangaChapters };
    availabilityCache.set(item.anilistId, result);
    try { sessionStorage.setItem(sessionKey, JSON.stringify(result)); } catch (_) {}
    return result;

  } catch (_) {
    const result = {
      hasAnime: item.hasAnime,
      hasManga: item.hasManga,
      animeEpisodes: item.animeEpisodes,
      mangaChapters: item.mangaChapters,
    };
    availabilityCache.set(item.anilistId, result);
    return result;
  }
}

const STATIC_FALLBACK_POOL: DiscoveryItem[] = [
  {
    id: 'anilist-154587',
    anilistId: 154587,
    title: "Frieren: Beyond Journey's End",
    originalTitle: "葬送のフリーレン",
    posterUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx154587-qQTzQnEJJ3oB.jpg",
    genre: "Action",
    genres: ["Action", "Adventure", "Fantasy"],
    type: "anime",
    rating: 9.3,
    hasAnime: true,
    hasManga: true,
    animeEpisodes: 28,
    mangaChapters: 130,
  },
  {
    id: 'anilist-101921',
    anilistId: 101921,
    title: "Kaguya-sama: Love is War",
    originalTitle: "かぐや様は告らせたい～天才たちの恋愛頭脳戦～",
    posterUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101921-ufrjLzhSz7L1.jpg",
    genre: "Romance",
    genres: ["Romance", "Comedy", "Slice of Life"],
    type: "anime",
    rating: 8.7,
    hasAnime: true,
    hasManga: true,
    animeEpisodes: 12,
    mangaChapters: 281,
  },
  {
    id: 'anilist-113415',
    anilistId: 113415,
    title: "Jujutsu Kaisen",
    originalTitle: "呪術廻戦",
    posterUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-LHBAeoZDIsnF.jpg",
    genre: "Action",
    genres: ["Action", "Fantasy", "Supernatural"],
    type: "anime",
    rating: 8.6,
    hasAnime: true,
    hasManga: true,
    animeEpisodes: 24,
    mangaChapters: 271,
  },
  {
    id: 'anilist-127230',
    anilistId: 127230,
    title: "Chainsaw Man",
    originalTitle: "チェンソーマン",
    posterUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx127230-DdP4vAdssLoz.png",
    genre: "Action",
    genres: ["Action", "Fantasy", "Supernatural"],
    type: "anime",
    rating: 8.4,
    hasAnime: true,
    hasManga: true,
    animeEpisodes: 12,
    mangaChapters: 180,
  },
  {
    id: 'anilist-124080',
    anilistId: 124080,
    title: "Horimiya",
    originalTitle: "ホリミヤ",
    posterUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx124080-3i22mRVPBS0T.jpg",
    genre: "Romance",
    genres: ["Romance", "Slice of Life", "Comedy"],
    type: "anime",
    rating: 8.2,
    hasAnime: true,
    hasManga: true,
    animeEpisodes: 13,
    mangaChapters: 125,
  },
  {
    id: 'anilist-101922',
    anilistId: 101922,
    title: "Demon Slayer: Kimetsu no Yaiba",
    originalTitle: "鬼滅の刃",
    posterUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101922-WBsBl0ClmgYL.jpg",
    genre: "Action",
    genres: ["Action", "Fantasy", "Supernatural"],
    type: "anime",
    rating: 8.5,
    hasAnime: true,
    hasManga: true,
    animeEpisodes: 26,
    mangaChapters: 205,
  },
  {
    id: 'anilist-140960',
    anilistId: 140960,
    title: "Spy x Family",
    originalTitle: "SPY×FAMILY",
    posterUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx140960-Kb6R5nYQfjmP.jpg",
    genre: "Comedy",
    genres: ["Comedy", "Action", "Slice of Life"],
    type: "anime",
    rating: 8.5,
    hasAnime: true,
    hasManga: true,
    animeEpisodes: 25,
    mangaChapters: 100,
  },
  {
    id: 'anilist-108465',
    anilistId: 108465,
    title: "Mushoku Tensei: Jobless Reincarnation",
    originalTitle: "無職転生 ～異世界行ったら本気だす～",
    posterUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx108465-1ANspF1EWyFx.jpg",
    genre: "Isekai",
    genres: ["Isekai", "Fantasy", "Adventure"],
    type: "anime",
    rating: 8.4,
    hasAnime: true,
    hasManga: true,
    animeEpisodes: 23,
    mangaChapters: 95,
  },
  {
    id: 'anilist-132405',
    anilistId: 132405,
    title: "My Dress-Up Darling",
    originalTitle: "その着せ替え人形は恋をする",
    posterUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx132405-qP7FQYGmNI3d.jpg",
    genre: "Romance",
    genres: ["Romance", "Slice of Life", "Comedy"],
    type: "anime",
    rating: 8.3,
    hasAnime: true,
    hasManga: true,
    animeEpisodes: 12,
    mangaChapters: 105,
  },
  {
    id: 'anilist-130003',
    anilistId: 130003,
    title: "Bocchi the Rock!",
    originalTitle: "ぼっち・ざ・ろっく！",
    posterUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx130003-HTDmeL4RGeJ4.png",
    genre: "Slice of Life",
    genres: ["Slice of Life", "Comedy", "Music"],
    type: "anime",
    rating: 8.8,
    hasAnime: true,
    hasManga: true,
    animeEpisodes: 12,
    mangaChapters: 70,
  },
  {
    id: 'anilist-126791',
    anilistId: 126791,
    title: "Cyberpunk: Edgerunners",
    originalTitle: "サイバーパンク エッジランナーズ",
    posterUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx126791-Rwhm1a5QFope.jpg",
    genre: "Sci-Fi",
    genres: ["Sci-Fi", "Action", "Drama"],
    type: "anime",
    rating: 8.6,
    hasAnime: true,
    hasManga: false,
    animeEpisodes: 10,
    mangaChapters: null,
  },
  {
    id: 'anilist-9253',
    anilistId: 9253,
    title: "Steins;Gate",
    originalTitle: "シュタインズ・ゲート",
    posterUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx9253-tIUXF2gfU8Sg.jpg",
    genre: "Sci-Fi",
    genres: ["Sci-Fi", "Thriller", "Psychological"],
    type: "anime",
    rating: 9.0,
    hasAnime: true,
    hasManga: true,
    animeEpisodes: 24,
    mangaChapters: 12,
  },
  {
    id: 'anilist-101280',
    anilistId: 101280,
    title: "That Time I Got Reincarnated as a Slime",
    originalTitle: "転生したらスライムだった件",
    posterUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101280-tDxCVJm714nt.jpg",
    genre: "Isekai",
    genres: ["Isekai", "Fantasy", "Action"],
    type: "anime",
    rating: 8.1,
    hasAnime: true,
    hasManga: true,
    animeEpisodes: 24,
    mangaChapters: 120,
  },
  {
    id: 'anilist-142838',
    anilistId: 142838,
    title: "Oshi no Ko",
    originalTitle: "【推しの子】",
    posterUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx142838-26JrqcFU1ljB.jpg",
    genre: "Drama",
    genres: ["Drama", "Supernatural", "Slice of Life"],
    type: "anime",
    rating: 8.7,
    hasAnime: true,
    hasManga: true,
    animeEpisodes: 11,
    mangaChapters: 166,
  },
  {
    id: 'anilist-105778',
    anilistId: 105778,
    title: "Solo Leveling",
    originalTitle: "俺だけレベルアップな件",
    posterUrl: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx105778-euxXZEIfDY2u.png",
    genre: "Action",
    genres: ["Action", "Fantasy", "Adventure"],
    type: "manga",
    rating: 8.6,
    hasAnime: true,
    hasManga: true,
    animeEpisodes: 12,
    mangaChapters: 200,
  },
  {
    id: 'anilist-30002',
    anilistId: 30002,
    title: "Berserk",
    originalTitle: "ベルセルク",
    posterUrl: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx30002-Cul4OeN7bYtn.jpg",
    genre: "Action",
    genres: ["Action", "Fantasy", "Horror"],
    type: "manga",
    rating: 9.3,
    hasAnime: true,
    hasManga: true,
    animeEpisodes: 25,
    mangaChapters: 376,
  },
];

// ── Fetch full set of 50 cards ─────────────────────────────────────────────────
async function fetchFullSet(genre: string, seed: string): Promise<DiscoveryItem[]> {
  const seenIds = new Set<string>();
  const seenImages = new Set<string>();
  const all: DiscoveryItem[] = [];

  const types: Array<'ANIME' | 'MANGA'> =
    genre === 'Semua' ? ['ANIME', 'MANGA', 'ANIME', 'MANGA'] : ['ANIME', 'ANIME', 'MANGA', 'ANIME'];

  for (let p = 0; p < types.length && all.length < TOTAL_CARDS_TARGET; p++) {
    try {
      if (p > 0) await new Promise((r) => setTimeout(r, 120));
      const batch = await fetchAniListBatch(genre, p + 1, types[p]);
      for (const item of batch) {
        if (seenIds.has(item.id)) continue;
        if (seenImages.has(item.posterUrl)) continue;
        seenIds.add(item.id);
        seenImages.add(item.posterUrl);
        all.push(item);
        if (all.length >= TOTAL_CARDS_TARGET) break;
      }
    } catch (_) {}
  }

  // FALLBACK GUARANTEE: If API returned fewer than TOTAL_CARDS_TARGET items (e.g. rate limit HTTP 429),
  // pull items from STATIC_FALLBACK_POOL so the marquee NEVER displays 0 cards!
  if (all.length < TOTAL_CARDS_TARGET) {
    const matchingFallback = STATIC_FALLBACK_POOL.filter((item) => {
      if (genre === 'Semua') return true;
      const lower = genre.toLowerCase();
      return (
        item.genre.toLowerCase() === lower ||
        item.genres.some((g) => g.toLowerCase() === lower)
      );
    });

    const poolToUse = matchingFallback.length > 0 ? matchingFallback : STATIC_FALLBACK_POOL;

    for (const item of poolToUse) {
      if (seenIds.has(item.id)) continue;
      if (seenImages.has(item.posterUrl)) continue;
      seenIds.add(item.id);
      seenImages.add(item.posterUrl);

      const clone = { ...item };
      if (genre !== 'Semua' && !clone.genres.some((g) => g.toLowerCase() === genre.toLowerCase())) {
        clone.genres = [genre, ...clone.genres].slice(0, 3);
        clone.genre = genre;
      }
      all.push(clone);
      if (all.length >= TOTAL_CARDS_TARGET) break;
    }
  }

  // Duplication guarantee to ensure marquee loop always has 50 items
  let finalSet = [...all];
  while (finalSet.length > 0 && finalSet.length < TOTAL_CARDS_TARGET) {
    const clones = finalSet.map((item, idx) => ({
      ...item,
      id: `${item.id}-dup-${finalSet.length}-${idx}`,
    }));
    finalSet = [...finalSet, ...clones].slice(0, TOTAL_CARDS_TARGET);
  }

  return seededShuffle(finalSet, `${seed}_${genre}`).slice(0, TOTAL_CARDS_TARGET);
}

export const DiscoveryMarqueeBanner: React.FC<DiscoveryMarqueeBannerProps> = ({ onQuickAdd, existingTitles }) => {
  const [activeGenre, setActiveGenre] = useState<string>(() => {
    try { return localStorage.getItem(LS_GENRE_KEY) || 'Semua'; } catch { return 'Semua'; }
  });

  const [addedItems, setAddedItems] = useState<Record<string, boolean>>({});
  const [cards, setCards] = useState<DiscoveryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const trackRef = useRef<HTMLDivElement>(null);
  const scrollXRef = useRef<number>(
    (() => { try { return Number(localStorage.getItem(LS_SCROLL_KEY)) || 0; } catch { return 0; } })()
  );
  const rafRef = useRef<number | null>(null);
  const cardsLengthRef = useRef(0);
  const genreRef = useRef(activeGenre);

  cardsLengthRef.current = cards.length;

  // ── Persist genre ────────────────────────────────────────────────────────────
  useEffect(() => {
    try { localStorage.setItem(LS_GENRE_KEY, activeGenre); } catch (_) {}
    genreRef.current = activeGenre;
  }, [activeGenre]);

  // ── Persist scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      try { localStorage.setItem(LS_SCROLL_KEY, String(Math.round(scrollXRef.current))); } catch (_) {}
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // ── Enrich cards with availability data lazily (in batches of 5) ─────────────
  const enrichCards = useCallback(async (rawCards: DiscoveryItem[]) => {
    // Process in batches of 5 to avoid rate-limiting
    const BATCH = 5;
    for (let i = 0; i < rawCards.length; i += BATCH) {
      const slice = rawCards.slice(i, i + BATCH);
      const enriched = await Promise.all(
        slice.map(async (card) => {
          const avail = await checkAvailability(card);
          return { ...card, ...avail };
        })
      );
      setCards((prev) => {
        const next = [...prev];
        enriched.forEach((enrichedCard) => {
          const idx = next.findIndex((c) => c.id === enrichedCard.id);
          if (idx !== -1) next[idx] = enrichedCard;
        });
        return next;
      });
      // Small delay to be kind to AniList rate limits
      if (i + BATCH < rawCards.length) {
        await new Promise((r) => setTimeout(r, 300));
      }
    }
  }, []);

  // ── Load cards ────────────────────────────────────────────────────────────────
  const loadCards = useCallback(async (genre: string, forceRefresh = false) => {
    setIsLoading(true);
    const today = getTodaySeed();

    if (!forceRefresh) {
      try {
        const savedSeedDate = localStorage.getItem(LS_SEED_KEY);
        const savedCards = localStorage.getItem(`${LS_CARDS_KEY}_${genre}`);
        if (savedSeedDate === today && savedCards) {
          const parsed: DiscoveryItem[] = JSON.parse(savedCards);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCards(parsed);
            setIsLoading(false);
            return;
          }
        }
      } catch (_) {}
    }

    const freshCards = await fetchFullSet(genre, today);

    if (freshCards.length > 0) {
      try {
        localStorage.setItem(LS_SEED_KEY, today);
        localStorage.setItem(`${LS_CARDS_KEY}_${genre}`, JSON.stringify(freshCards));
      } catch (_) {}
    }

    scrollXRef.current = 0;
    try { localStorage.setItem(LS_SCROLL_KEY, '0'); } catch (_) {}

    setCards(freshCards);
    setIsLoading(false);
    setIsRefreshing(false);

    // Lazily enrich with availability data
    enrichCards(freshCards);
  }, [enrichCards]);

  // ── Reset on genre change ────────────────────────────────────────────────────
  useEffect(() => {
    genreRef.current = activeGenre;
    setCards([]);
    // Clear stale cached data for this genre so new ordering logic applies
    try {
      sessionStorage.clear();
      localStorage.removeItem(`${LS_CARDS_KEY}_${activeGenre}`);
    } catch (_) {}
    loadCards(activeGenre);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [activeGenre, loadCards]);

  // ── Manual refresh ────────────────────────────────────────────────────────────
  const handleRefresh = async () => {
    if (isRefreshing || isLoading) return;
    setIsRefreshing(true);
    setCards([]);
    try {
      sessionStorage.clear();
      localStorage.removeItem(`${LS_CARDS_KEY}_${activeGenre}`);
      availabilityCache.clear();
    } catch (_) {}
    await loadCards(activeGenre, true);
  };

  // ── RAF animation ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (cards.length === 0) return;
    const SPEED = 0.6;
    const track = trackRef.current;
    if (!track) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const animate = () => {
      scrollXRef.current += SPEED;
      const cardStep = CARD_WIDTH + CARD_GAP;
      const totalWidth = cardsLengthRef.current * cardStep;
      if (totalWidth > 0 && scrollXRef.current >= totalWidth) scrollXRef.current -= totalWidth;
      track.style.transform = `translateX(-${scrollXRef.current}px)`;
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [cards.length > 0]); // eslint-disable-line

  // ── Pause / resume ────────────────────────────────────────────────────────────
  const pauseScroll = () => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
  };

  const resumeScroll = () => {
    if (rafRef.current) return;
    const SPEED = 0.6;
    const track = trackRef.current;
    if (!track) return;
    const animate = () => {
      scrollXRef.current += SPEED;
      const cardStep = CARD_WIDTH + CARD_GAP;
      const totalWidth = cardsLengthRef.current * cardStep;
      if (totalWidth > 0 && scrollXRef.current >= totalWidth) scrollXRef.current -= totalWidth;
      track.style.transform = `translateX(-${scrollXRef.current}px)`;
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
  };

  const handleAdd = (item: DiscoveryItem, selectedType: 'anime' | 'manga') => {
    const key = `${item.id}_${selectedType}`;
    setAddedItems((prev) => ({ ...prev, [key]: true }));
    const count = selectedType === 'anime' ? item.animeEpisodes : item.mangaChapters;
    onQuickAdd({
      title: item.title,
      originalTitle: item.originalTitle || undefined,
      posterUrl: item.posterUrl,
      type: selectedType,
      genre: item.genre,
      totalEpisodes: count && count > 0 ? count : (selectedType === 'anime' ? 12 : 1),
    });
    try {
      confetti({
        particleCount: 50, spread: 70, origin: { y: 0.7 },
        colors: selectedType === 'anime' ? ['#38bdf8', '#3b82f6'] : ['#c084fc', '#a855f7'],
      });
    } catch (_) {}
  };



  const displayCards = cards.length > 0 ? [...cards, ...cards] : [];

  return (
    <div
      className="discovery-marquee-container"
      style={{
        background: 'rgba(10, 15, 29, 0.85)',
        border: '1px solid rgba(56, 189, 248, 0.2)',
        borderRadius: 'var(--radius-lg)',
        padding: '18px 20px',
        marginBottom: '24px',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 800, color: '#fff' }}>
          <Compass size={18} color="#38bdf8" className={isLoading ? 'intro-spin-sparkle' : ''} />
          <span>REKOMENDASI ANIME &amp; MANGA RELEVAN</span>
          <span style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', background: 'rgba(56, 189, 248, 0.15)', padding: '2px 8px', borderRadius: '10px' }}>
            {isLoading || isRefreshing ? 'Memuat...' : `${cards.length} Rekomendasi · Auto-deteksi Anime & Manga`}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
            title="Generate rekomendasi baru"
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700,
              border: '1px solid rgba(56, 189, 248, 0.4)', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8',
              cursor: isLoading || isRefreshing ? 'not-allowed' : 'pointer',
              opacity: isLoading || isRefreshing ? 0.5 : 1, transition: 'all 0.15s ease',
            }}
          >
            <RefreshCw size={12} style={{ animation: isRefreshing ? 'spin 0.8s linear infinite' : 'none' }} />
            <span>Refresh</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
            <Filter size={13} color="var(--text-muted)" style={{ flexShrink: 0, marginRight: '2px' }} />
            {GENRES.map((g) => {
              const isActive = activeGenre === g;
              return (
                <button
                  key={g}
                  onClick={() => setActiveGenre(g)}
                  style={{
                    padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
                    border: isActive ? '1px solid var(--accent-cyan)' : '1px solid rgba(255, 255, 255, 0.1)',
                    background: isActive ? 'rgba(56, 189, 248, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                    color: isActive ? '#38bdf8' : 'var(--text-secondary)',
                    cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s ease',
                  }}
                >
                  {g}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Scrolling Track Viewport */}
      <div
        style={{ position: 'relative', width: '100%', overflow: 'hidden', borderRadius: 'var(--radius-md)', padding: '6px 0', cursor: 'grab' }}
        onMouseEnter={pauseScroll}
        onMouseLeave={resumeScroll}
      >
        {/* Fade edges */}
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '50px', background: 'linear-gradient(to right, rgba(10,15,29,1), transparent)', zIndex: 10, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: '50px', background: 'linear-gradient(to left, rgba(10,15,29,1), transparent)', zIndex: 10, pointerEvents: 'none' }} />

        <div ref={trackRef} style={{ display: 'flex', gap: `${CARD_GAP}px`, willChange: 'transform' }}>
          {isLoading || isRefreshing
            ? Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={`sk-${i}`}
                  style={{
                    flex: `0 0 ${CARD_WIDTH}px`, width: `${CARD_WIDTH}px`, height: '260px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, rgba(30,41,59,0.8) 0%, rgba(15,23,42,0.9) 100%)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }}
                />
              ))
            : displayCards.map((item, idx) => {
                const isAnimeAdded = addedItems[`${item.id}_anime`] || existingTitles.includes(item.title);
                const isMangaAdded = addedItems[`${item.id}_manga`];

                // Determine which buttons to show
                const showAnime = item.hasAnime;
                const showManga = item.hasManga;

                return (
                  <div
                    key={`${item.id}-${idx}`}
                    style={{
                      flex: `0 0 ${CARD_WIDTH}px`, width: `${CARD_WIDTH}px`, height: '260px',
                      borderRadius: '14px', overflow: 'hidden', position: 'relative',
                      border: '1px solid rgba(255,255,255,0.12)',
                      boxShadow: '0 8px 20px rgba(0,0,0,0.5)', background: '#0d1322', flexShrink: 0,
                    }}
                  >
                    <img
                      src={item.posterUrl}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        if (!img.dataset.fallback) {
                          img.dataset.fallback = 'true';
                          img.src = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&auto=format&fit=crop&q=80';
                        }
                      }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.3s ease' }}
                    />

                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,14,23,0.98) 0%, rgba(10,14,23,0.2) 55%, transparent 100%)' }} />

                    {/* Genre badges — top left: each genre on its own line */}
                    <div style={{
                      position: 'absolute', top: '8px', left: '8px',
                      display: 'flex', flexDirection: 'column', gap: '3px',
                    }}>
                      {(item.genres && item.genres.length > 0 ? item.genres : [item.genre]).map((g, gi) => (
                        <span
                          key={gi}
                          style={{
                            background: 'rgba(10,15,29,0.85)', backdropFilter: 'blur(6px)',
                            padding: '1px 6px', borderRadius: '6px',
                            fontSize: '0.6rem', fontWeight: 700, color: '#38bdf8',
                            border: '1px solid rgba(56,189,248,0.3)',
                            display: 'inline-block', whiteSpace: 'nowrap',
                          }}
                        >
                          {g}
                        </span>
                      ))}
                    </div>

                    {/* Type badge — top right, capitalized */}
                    <div style={{
                      position: 'absolute', top: '8px', right: '8px',
                      background: item.type === 'anime' ? 'rgba(59,130,246,0.8)' : 'rgba(168,85,247,0.8)',
                      backdropFilter: 'blur(6px)', padding: '2px 7px', borderRadius: '8px',
                      fontSize: '0.62rem', fontWeight: 700, color: '#fff',
                    }}>
                      {item.type === 'anime' ? '📺 Anime' : '📖 Manga'}
                    </div>

                    {/* Bottom content */}
                    <div style={{ position: 'absolute', bottom: '8px', left: '6px', right: '6px', display: 'flex', flexDirection: 'column', gap: '5px' }}>

                      {/* Title */}
                      <div
                        style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                        title={item.title}
                      >
                        {item.title}
                      </div>

                      {/* Japanese / original title */}
                      {item.originalTitle && item.originalTitle !== item.title && (
                        <div style={{
                          fontSize: '0.62rem', color: 'rgba(255,255,255,0.45)',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          marginTop: '-3px',
                        }}>
                          {item.originalTitle}
                        </div>
                      )}

                      {/* Availability info row — eps / chapter count */}
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {showAnime && (
                          <span style={{ fontSize: '0.6rem', fontWeight: 600, color: '#38bdf8', background: 'rgba(56,189,248,0.12)', padding: '1px 5px', borderRadius: '5px', border: '1px solid rgba(56,189,248,0.25)' }}>
                            {item.animeEpisodes ? `📺 ${item.animeEpisodes} eps` : '📺 Anime'}
                          </span>
                        )}
                        {showManga && (
                          <span style={{ fontSize: '0.6rem', fontWeight: 600, color: '#c084fc', background: 'rgba(192,132,252,0.12)', padding: '1px 5px', borderRadius: '5px', border: '1px solid rgba(192,132,252,0.25)' }}>
                            {item.mangaChapters ? `📖 ${item.mangaChapters} ch` : '📖 Manga'}
                          </span>
                        )}
                      </div>
                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {showAnime && (
                          <button
                            onClick={() => !isAnimeAdded && handleAdd(item, 'anime')}
                            disabled={isAnimeAdded}
                            title="Tambah sebagai Anime"
                            style={{
                              flex: 1, padding: '5px 2px', borderRadius: '6px',
                              fontSize: '0.63rem', fontWeight: 700,
                              background: isAnimeAdded ? 'rgba(34,197,94,0.2)' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                              color: isAnimeAdded ? '#4ade80' : '#fff',
                              border: isAnimeAdded ? '1px solid #4ade80' : '1px solid #3b82f6',
                              cursor: isAnimeAdded ? 'default' : 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px',
                            }}
                          >
                            {isAnimeAdded ? <Check size={10} /> : <Film size={10} />}
                            <span>{isAnimeAdded ? 'Anime ✓' : '+ Anime'}</span>
                          </button>
                        )}

                        {showManga && (
                          <button
                            onClick={() => !isMangaAdded && handleAdd(item, 'manga')}
                            disabled={isMangaAdded}
                            title="Tambah sebagai Manga"
                            style={{
                              flex: 1, padding: '5px 2px', borderRadius: '6px',
                              fontSize: '0.63rem', fontWeight: 700,
                              background: isMangaAdded ? 'rgba(34,197,94,0.2)' : 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                              color: isMangaAdded ? '#4ade80' : '#fff',
                              border: isMangaAdded ? '1px solid #4ade80' : '1px solid #a855f7',
                              cursor: isMangaAdded ? 'default' : 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px',
                            }}
                          >
                            {isMangaAdded ? <Check size={10} /> : <BookOpen size={10} />}
                            <span>{isMangaAdded ? 'Manga ✓' : '+ Manga'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
