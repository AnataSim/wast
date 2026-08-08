import type { MediaType } from '../types/watchlist';
import { apiFetch, TTL } from '../utils/apiCache';

export interface MalSearchResult {
  malId: number | string;
  title: string;
  titleJapanese?: string;
  type: MediaType;
  posterUrl: string;
  bannerUrl?: string;
  episodesOrChapters: number;
  runtimeMinutes?: number;
  score?: number;
  releaseYear: number;
  genres: string[];
  synopsis?: string;
  source?: 'MangaDex' | 'AniList' | 'MyAnimeList';
}

/**
 * Cari Manga, Manhwa, dan Webtoon khusus dari API resmi MangaDex dengan data Chapter Akurat dari Aggregate
 */
export async function searchMangaDex(query: string): Promise<MalSearchResult[]> {
  if (!query.trim()) return [];

  try {
    const url = `https://api.mangadex.org/manga?title=${encodeURIComponent(query.trim())}&limit=6&includes[]=cover_art`;
    const json = await apiFetch(url, TTL.FIFTEEN_MIN).catch(() => null);
    if (!json) return [];
    const dataList = json.data || [];

    // Fetch aggregates in parallel to get accurate latest chapter counts
    const results = await Promise.all(
      dataList.map(async (item: any) => {
        const titleObj = item.attributes?.title || {};
        const mainTitle = titleObj.en || titleObj['ja-ro'] || titleObj.ja || Object.values(titleObj)[0] || 'Judul Manga';
        
        // Find Japanese / Romaji alt title
        let altTitle: string | undefined = undefined;
        if (Array.isArray(item.attributes?.altTitles)) {
          const jaObj = item.attributes.altTitles.find((t: any) => t.ja || t['ja-ro']);
          if (jaObj) altTitle = jaObj.ja || jaObj['ja-ro'];
        }

        // Find Cover Art image filename
        const coverRel = item.relationships?.find((r: any) => r.type === 'cover_art');
        const fileName = coverRel?.attributes?.fileName;
        const coverUrl = fileName 
          ? `https://uploads.mangadex.org/covers/${item.id}/${fileName}.512.jpg`
          : '';

        // Extract genres from tags
        const genres: string[] = [];
        if (Array.isArray(item.attributes?.tags)) {
          item.attributes.tags.forEach((tag: any) => {
            if (tag.attributes?.name?.en) {
              genres.push(tag.attributes.name.en);
            }
          });
        }

        // Clean description text
        const descObj = item.attributes?.description || {};
        const rawDesc = descObj.en || Object.values(descObj)[0] || '';
        const cleanDesc = typeof rawDesc === 'string' && rawDesc.trim() 
          ? rawDesc.replace(/\[\/*[a-z]+\]/gi, '').slice(0, 180) + '...'
          : undefined;

        // Calculate accurate maximum chapter count
        let totalCh = item.attributes?.lastChapter ? Number(item.attributes.lastChapter) : 0;

        if (!totalCh || totalCh <= 1) {
          try {
            const aggJson = await apiFetch(`https://api.mangadex.org/manga/${item.id}/aggregate`, TTL.ONE_WEEK).catch(() => null);
            if (aggJson) {
              const volumes = aggJson.volumes || {};
              let maxCh = 0;
              Object.values(volumes).forEach((vol: any) => {
                const chapters = vol.chapters || {};
                Object.keys(chapters).forEach((chKey) => {
                  const num = parseFloat(chKey);
                  if (!isNaN(num) && num > maxCh) {
                    maxCh = num;
                  }
                });
              });
              if (maxCh > 0) {
                totalCh = Math.ceil(maxCh);
              }
            }
          } catch (e) {
            console.warn('MangaDex aggregate fetch warning:', e);
          }
        }

        return {
          malId: `mangadex-${item.id}`,
          title: mainTitle,
          titleJapanese: altTitle,
          type: 'manga' as MediaType,
          posterUrl: coverUrl,
          bannerUrl: coverUrl,
          episodesOrChapters: Math.max(1, totalCh || 1),
          releaseYear: item.attributes?.year || new Date().getFullYear(),
          genres: genres.length > 0 ? genres.slice(0, 4) : ['Manga'],
          synopsis: cleanDesc,
          source: 'MangaDex',
        };
      })
    );

    return results;
  } catch (err) {
    console.warn('MangaDex API fetch error:', err);
    return [];
  }
}

/**
 * Cari Anime atau Manga dari AniList, MangaDex & MyAnimeList API
 */
export async function searchMyAnimeList(
  query: string, 
  type: MediaType = 'anime'
): Promise<MalSearchResult[]> {
  if (!query.trim()) return [];

  // IF SEARCHING MANGA: Call MangaDex API as primary provider
  if (type === 'manga') {
    const mangaDexResults = await searchMangaDex(query);

    // Also fetch AniList Manga for extra coverage
    try {
      const aniListQuery = `
        query ($q: String) {
          Page(perPage: 6) {
            media(search: $q, type: MANGA) {
              id
              title { english romaji native }
              coverImage { extraLarge large }
              bannerImage
              chapters
              volumes
              startDate { year }
              averageScore
              genres
              description
            }
          }
        }
      `;

      const json = await apiFetch(
        'https://graphql.anilist.co',
        TTL.FIFTEEN_MIN,
        { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify({ query: aniListQuery, variables: { q: query.trim() } }) }
      ).catch(() => null);

      if (json) {
        const aniListItems = json.data?.Page?.media || [];

        const aniListMapped: MalSearchResult[] = aniListItems.map((item: any) => {
          const displayTitle = item.title?.english || item.title?.romaji || item.title?.native || 'Judul Manga';
          const romajiTitle = item.title?.romaji !== displayTitle ? item.title?.romaji : item.title?.native;
          const score = item.averageScore ? Number((item.averageScore / 10).toFixed(1)) : undefined;
          const releaseYear = item.startDate?.year || new Date().getFullYear();
          const count = item.chapters || item.volumes || 1;

          const posterUrl = item.coverImage?.extraLarge || item.coverImage?.large || '';
          const bannerUrl = item.bannerImage || posterUrl;

          return {
            malId: `anilist-${item.id}`,
            title: displayTitle,
            titleJapanese: romajiTitle,
            type: 'manga' as MediaType,
            posterUrl,
            bannerUrl,
            episodesOrChapters: count,
            score,
            releaseYear,
            genres: Array.isArray(item.genres) && item.genres.length > 0 ? item.genres : ['Manga'],
            source: 'AniList',
          };
        });

        // Combine MangaDex + AniList without duplicate titles
        const combined = [...mangaDexResults];
        aniListMapped.forEach((aniItem) => {
          const exists = combined.some(m => m.title.toLowerCase() === aniItem.title.toLowerCase());
          if (!exists) {
            combined.push(aniItem);
          }
        });

        return combined.slice(0, 8);
      }
    } catch (err) {
      console.warn('AniList Manga fetch warning:', err);
    }

    return mangaDexResults;
  }

  // IF SEARCHING ANIME: Primary Provider AniList GraphQL API
  try {
    const aniListQuery = `
      query ($q: String) {
        Page(perPage: 6) {
          media(search: $q, type: ANIME) {
            id
            title { english romaji native }
            coverImage { extraLarge large }
            bannerImage
            episodes
            duration
            seasonYear
            startDate { year }
            averageScore
            genres
            description
          }
        }
      }
    `;

    const json = await apiFetch(
      'https://graphql.anilist.co',
      TTL.FIFTEEN_MIN,
      { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify({ query: aniListQuery, variables: { q: query.trim() } }) }
    ).catch(() => null);

    if (json) {
      const mediaList = json.data?.Page?.media || [];

      if (mediaList.length > 0) {
        return mediaList.map((item: any) => {
          const displayTitle = item.title?.english || item.title?.romaji || item.title?.native || 'Judul Tanpa Nama';
          const romajiTitle = item.title?.romaji !== displayTitle ? item.title?.romaji : item.title?.native;
          const score = item.averageScore ? Number((item.averageScore / 10).toFixed(1)) : undefined;
          const releaseYear = item.seasonYear || item.startDate?.year || new Date().getFullYear();

          const cleanDesc = item.description 
            ? item.description.replace(/<[^>]*>?/gm, '').slice(0, 180) + '...'
            : undefined;

          const posterUrl = item.coverImage?.extraLarge || item.coverImage?.large || '';
          const bannerUrl = item.bannerImage || posterUrl;

          return {
            malId: `anilist-${item.id}`,
            title: displayTitle,
            titleJapanese: romajiTitle,
            type: 'anime' as MediaType,
            posterUrl,
            bannerUrl,
            episodesOrChapters: item.episodes || 12,
            runtimeMinutes: item.duration || 24,
            score,
            releaseYear,
            genres: Array.isArray(item.genres) && item.genres.length > 0 ? item.genres : ['Action'],
            synopsis: cleanDesc,
            source: 'AniList',
          };
        });
      }
    }
  } catch (err) {
    console.warn('AniList API fetch warning, trying Jikan fallback:', err);
  }

  // Secondary Fallback Provider: Jikan REST API v4 (MyAnimeList)
  try {
    const endpoint = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=6`;
    const json = await apiFetch(endpoint, TTL.FIFTEEN_MIN).catch(() => null);
    if (json) {
      const dataList = json.data || [];

      return dataList.map((item: any) => {
        const genres = Array.isArray(item.genres) 
          ? item.genres.map((g: any) => g.name) 
          : [];

        const releaseYear = item.year 
          ? item.year 
          : item.published?.from 
            ? new Date(item.published.from).getFullYear() 
            : item.aired?.from 
              ? new Date(item.aired.from).getFullYear() 
              : new Date().getFullYear();

        const posterUrl = item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || '';

        // Extract runtime minutes from Jikan string e.g. "24 min per ep" or "1 hr 42 min"
        let parsedMins = 24;
        if (typeof item.duration === 'string') {
          const matchHr = item.duration.match(/(\d+)\s*hr/i);
          const matchMin = item.duration.match(/(\d+)\s*min/i);
          const hrs = matchHr ? parseInt(matchHr[1], 10) : 0;
          const mins = matchMin ? parseInt(matchMin[1], 10) : 0;
          if (hrs > 0 || mins > 0) {
            parsedMins = hrs * 60 + mins;
          }
        }

        return {
          malId: `mal-${item.mal_id}`,
          title: item.title_english || item.title || 'Judul Tanpa Nama',
          titleJapanese: item.title_japanese || undefined,
          type: 'anime' as MediaType,
          posterUrl,
          bannerUrl: posterUrl,
          episodesOrChapters: item.episodes || 12,
          runtimeMinutes: parsedMins,
          score: item.score || undefined,
          releaseYear: releaseYear || new Date().getFullYear(),
          genres: genres.length > 0 ? genres : ['Action'],
          synopsis: item.synopsis ? item.synopsis.slice(0, 180) + '...' : undefined,
          source: 'MyAnimeList',
        };
      });
    }
  } catch (err) {
    console.error('All Anime/Manga API searches failed:', err);
  }

  return [];
}
