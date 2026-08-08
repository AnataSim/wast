import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Check, Filter, Compass, Film, BookOpen } from 'lucide-react';
import confetti from 'canvas-confetti';

interface DiscoveryItem {
  id: string;
  title: string;
  posterUrl: string;
  genre: string;
  type: 'anime' | 'manga';
  rating: number;
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

interface DiscoveryMarqueeBannerProps {
  onQuickAdd: (item: { title: string; posterUrl: string; type: 'anime' | 'manga'; genre: string }) => void;
  existingTitles: string[];
}

async function fetchAniListBatch(genre: string, page: number): Promise<DiscoveryItem[]> {
  const cacheKey = `wast_cache_${genre}_p${page}`;
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (_) {}

  const apiGenre = GENRE_MAP[genre];
  const graphqlQuery = `
    query ($genre: String, $page: Int, $type: MediaType) {
      Page(page: $page, perPage: 15) {
        media(genre: $genre, sort: [POPULARITY_DESC, SCORE_DESC], type: $type) {
          id
          title { english romaji native }
          coverImage { extraLarge large medium }
          genres
          type
          averageScore
        }
      }
    }
  `;

  const mediaType = page % 2 === 0 ? 'MANGA' : 'ANIME';

  const res = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      query: graphqlQuery,
      variables: { genre: apiGenre, page, type: mediaType },
    }),
  });

  if (!res.ok) return [];

  const json = await res.json();
  const media = json.data?.Page?.media || [];
  const mapped: DiscoveryItem[] = media
    .filter((item: any) => {
      const url = item.coverImage?.extraLarge || item.coverImage?.large || item.coverImage?.medium || '';
      return url && !url.includes('default');
    })
    .map((item: any) => ({
      id: `anilist-${item.id}`,
      title: item.title?.english || item.title?.romaji || item.title?.native || 'Judul Anime',
      posterUrl: item.coverImage?.extraLarge || item.coverImage?.large || item.coverImage?.medium || '',
      genre:
        Array.isArray(item.genres) && item.genres.length > 0
          ? item.genres[0]
          : genre !== 'Semua'
          ? genre
          : 'Action',
      type: item.type === 'MANGA' ? 'manga' : 'anime',
      rating: item.averageScore ? Number((item.averageScore / 10).toFixed(1)) : 8.5,
    }));

  try {
    sessionStorage.setItem(cacheKey, JSON.stringify(mapped));
  } catch (_) {}

  return mapped;
}

export const DiscoveryMarqueeBanner: React.FC<DiscoveryMarqueeBannerProps> = ({ onQuickAdd, existingTitles }) => {
  const [activeGenre, setActiveGenre] = useState('Semua');
  const [addedItems, setAddedItems] = useState<Record<string, boolean>>({});
  const [cards, setCards] = useState<DiscoveryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const trackRef = useRef<HTMLDivElement>(null);
  // scrollXRef holds the current pixel offset; RAF reads/writes this only
  const scrollXRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  // Mirror of cards.length that RAF can read without stale closure issues
  const cardsLengthRef = useRef(0);

  const seenIdsRef = useRef<Set<string>>(new Set());
  const seenImagesRef = useRef<Set<string>>(new Set());
  const nextPageRef = useRef(1);
  const isFetchingRef = useRef(false);
  const genreRef = useRef(activeGenre);

  // Keep length ref in sync with state (runs on every render, before effects)
  cardsLengthRef.current = cards.length;

  // ── Fetch and append unique cards (pure React state, no DOM touching) ──
  const appendBatch = useCallback(async (genre: string) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    const page = nextPageRef.current;
    nextPageRef.current += 1;

    try {
      const batch = await fetchAniListBatch(genre, page);

      const fresh = batch.filter((item) => {
        if (!item.posterUrl) return false;
        if (seenIdsRef.current.has(item.id)) return false;
        if (seenImagesRef.current.has(item.posterUrl)) return false;
        return true;
      });

      fresh.forEach((item) => {
        seenIdsRef.current.add(item.id);
        seenImagesRef.current.add(item.posterUrl);
      });

      if (fresh.length > 0 && genreRef.current === genre) {
        setCards((prev) => [...prev, ...fresh]);
      }
    } catch (e) {
      console.warn('AniList batch fetch error:', e);
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  // ── Reset state & load initial batch when genre changes ──
  useEffect(() => {
    genreRef.current = activeGenre;
    setCards([]);
    seenIdsRef.current.clear();
    seenImagesRef.current.clear();
    nextPageRef.current = 1;
    scrollXRef.current = 0;
    setIsLoading(true);

    fetchAniListBatch(activeGenre, 1).then((batch) => {
      const fresh = batch.filter((item) => {
        if (!item.posterUrl) return false;
        if (seenIdsRef.current.has(item.id)) return false;
        if (seenImagesRef.current.has(item.posterUrl)) return false;
        return true;
      });
      fresh.forEach((item) => {
        seenIdsRef.current.add(item.id);
        seenImagesRef.current.add(item.posterUrl);
      });
      nextPageRef.current = 2;
      setCards(fresh);
      setIsLoading(false);
    });

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [activeGenre]);

  // ── RAF animation — ONLY writes translateX, never touches React state or DOM structure ──
  //
  // Strategy: render [...cards, ...cards] (doubled list).
  // Scroll continuously. When offset reaches totalWidth (one full set),
  // seamlessly reset to 0. The second copy makes the loop invisible.
  // Fetch more cards before we near the end of the first copy.
  useEffect(() => {
    if (cards.length === 0) return;

    const SPEED = 0.6; // px/frame at ~60fps
    const track = trackRef.current;
    if (!track) return;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const animate = () => {
      scrollXRef.current += SPEED;

      const cardStep = CARD_WIDTH + CARD_GAP;
      // totalWidth = width of ONE set of cards (we render two sets, so reset at 1×)
      const totalWidth = cardsLengthRef.current * cardStep;

      if (totalWidth > 0) {
        // Seamless wrap: when we've scrolled one full copy, jump back to 0
        if (scrollXRef.current >= totalWidth) {
          scrollXRef.current -= totalWidth;
        }

        // Fetch more when approaching the 80% mark of the first set
        const fetchThreshold = totalWidth * 0.8;
        if (
          scrollXRef.current > fetchThreshold &&
          cardsLengthRef.current < 40 // cap total cards to avoid memory bloat
        ) {
          appendBatch(genreRef.current);
        }
      }

      track.style.transform = `translateX(-${scrollXRef.current}px)`;
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [cards.length > 0, appendBatch]); // eslint-disable-line

  // ── Pause / resume on hover ──
  const pauseScroll = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
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

      if (totalWidth > 0) {
        if (scrollXRef.current >= totalWidth) {
          scrollXRef.current -= totalWidth;
        }
        const fetchThreshold = totalWidth * 0.8;
        if (scrollXRef.current > fetchThreshold && cardsLengthRef.current < 40) {
          appendBatch(genreRef.current);
        }
      }

      track.style.transform = `translateX(-${scrollXRef.current}px)`;
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
  };

  const handleAdd = (item: DiscoveryItem, selectedType: 'anime' | 'manga') => {
    const key = `${item.id}_${selectedType}`;
    setAddedItems((prev) => ({ ...prev, [key]: true }));
    onQuickAdd({
      title: item.title,
      posterUrl: item.posterUrl,
      type: selectedType,
      genre: item.genre,
    });

    try {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.7 },
        colors: selectedType === 'anime' ? ['#38bdf8', '#3b82f6'] : ['#c084fc', '#a855f7'],
      });
    } catch (_) {}
  };

  // Render doubled list for seamless infinite loop — pure React, no DOM hacks
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
      {/* Header Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 800, color: '#fff' }}>
          <Compass size={18} color="#38bdf8" className={isLoading ? 'intro-spin-sparkle' : ''} />
          <span>REKOMENDASI ANIME &amp; MANGA RELEVAN</span>
          <span
            style={{
              fontSize: '0.72rem',
              color: 'var(--accent-cyan)',
              background: 'rgba(56, 189, 248, 0.15)',
              padding: '2px 8px',
              borderRadius: '10px',
            }}
          >
            {isLoading ? 'Memuat...' : 'Pilih Format Anime 📺 atau Manga 📖 ⚡'}
          </span>
        </div>

        {/* Genre Filter Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
          <Filter size={13} color="var(--text-muted)" style={{ flexShrink: 0, marginRight: '2px' }} />
          {GENRES.map((g) => {
            const isActive = activeGenre === g;
            return (
              <button
                key={g}
                onClick={() => setActiveGenre(g)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  border: isActive ? '1px solid var(--accent-cyan)' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: isActive ? 'rgba(56, 189, 248, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                  color: isActive ? '#38bdf8' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
              >
                {g}
              </button>
            );
          })}
        </div>
      </div>

      {/* Scrolling Track Viewport */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          overflow: 'hidden',
          borderRadius: 'var(--radius-md)',
          padding: '6px 0',
          cursor: 'grab',
        }}
        onMouseEnter={pauseScroll}
        onMouseLeave={resumeScroll}
      >
        {/* Fade edges */}
        <div
          style={{
            position: 'absolute', top: 0, bottom: 0, left: 0, width: '50px',
            background: 'linear-gradient(to right, rgba(10,15,29,1), transparent)',
            zIndex: 10, pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute', top: 0, bottom: 0, right: 0, width: '50px',
            background: 'linear-gradient(to left, rgba(10,15,29,1), transparent)',
            zIndex: 10, pointerEvents: 'none',
          }}
        />

        {/* Track — RAF only writes transform on this element, never touches children */}
        <div
          ref={trackRef}
          style={{
            display: 'flex',
            gap: `${CARD_GAP}px`,
            willChange: 'transform',
          }}
        >
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={`sk-${i}`}
                  style={{
                    flex: `0 0 ${CARD_WIDTH}px`,
                    width: `${CARD_WIDTH}px`,
                    height: '240px',
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

                return (
                  <div
                    key={`${item.id}-${idx}`}
                    style={{
                      flex: `0 0 ${CARD_WIDTH}px`,
                      width: `${CARD_WIDTH}px`,
                      height: '240px',
                      borderRadius: '14px',
                      overflow: 'hidden',
                      position: 'relative',
                      border: '1px solid rgba(255,255,255,0.12)',
                      boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
                      background: '#0d1322',
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={item.posterUrl}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.opacity = '0';
                      }}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'opacity 0.3s ease',
                      }}
                    />

                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to top, rgba(10,14,23,0.97) 0%, rgba(10,14,23,0.15) 50%, transparent 100%)',
                      }}
                    />

                    {/* Genre badge */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '8px',
                        left: '8px',
                        background: 'rgba(10,15,29,0.85)',
                        backdropFilter: 'blur(6px)',
                        padding: '2px 7px',
                        borderRadius: '8px',
                        fontSize: '0.66rem',
                        fontWeight: 700,
                        color: '#38bdf8',
                        border: '1px solid rgba(56,189,248,0.3)',
                      }}
                    >
                      {item.genre}
                    </div>

                    {/* Type badge */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: item.type === 'anime' ? 'rgba(59,130,246,0.75)' : 'rgba(168,85,247,0.75)',
                        backdropFilter: 'blur(6px)',
                        padding: '2px 7px',
                        borderRadius: '8px',
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        color: '#fff',
                      }}
                    >
                      {item.type === 'anime' ? '📺' : '📖'} {item.type}
                    </div>

                    {/* Bottom: title + add buttons */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '8px',
                        left: '6px',
                        right: '6px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '5px',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          color: '#ffffff',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                        title={item.title}
                      >
                        {item.title}
                      </div>

                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={() => !isAnimeAdded && handleAdd(item, 'anime')}
                          disabled={isAnimeAdded}
                          title="Tambah sebagai Anime"
                          style={{
                            flex: 1,
                            padding: '4px 2px',
                            borderRadius: '6px',
                            fontSize: '0.63rem',
                            fontWeight: 700,
                            background: isAnimeAdded ? 'rgba(34,197,94,0.2)' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            color: isAnimeAdded ? '#4ade80' : '#fff',
                            border: isAnimeAdded ? '1px solid #4ade80' : '1px solid #3b82f6',
                            cursor: isAnimeAdded ? 'default' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '2px',
                          }}
                        >
                          {isAnimeAdded ? <Check size={10} /> : <Film size={10} />}
                          <span>{isAnimeAdded ? 'Anime ✓' : '+ Anime'}</span>
                        </button>

                        <button
                          onClick={() => !isMangaAdded && handleAdd(item, 'manga')}
                          disabled={isMangaAdded}
                          title="Tambah sebagai Manga"
                          style={{
                            flex: 1,
                            padding: '4px 2px',
                            borderRadius: '6px',
                            fontSize: '0.63rem',
                            fontWeight: 700,
                            background: isMangaAdded ? 'rgba(34,197,94,0.2)' : 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                            color: isMangaAdded ? '#4ade80' : '#fff',
                            border: isMangaAdded ? '1px solid #4ade80' : '1px solid #a855f7',
                            cursor: isMangaAdded ? 'default' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '2px',
                          }}
                        >
                          {isMangaAdded ? <Check size={10} /> : <BookOpen size={10} />}
                          <span>{isMangaAdded ? 'Manga ✓' : '+ Manga'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
        </div>
      </div>
    </div>
  );
};
