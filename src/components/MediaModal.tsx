import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Save, Search, Sparkles, ArrowRight, Loader2, Clapperboard, BookOpen, Link as LinkIcon } from 'lucide-react';
import type { WatchlistItem, MediaType, WatchStatus, Rating } from '../types/watchlist';
import { GENRE_OPTIONS } from '../data/mockData';
import { searchMyAnimeList, type MalSearchResult } from '../services/jikanService';

interface MediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (itemData: Partial<WatchlistItem>) => void;
  editingItem: WatchlistItem | null;
}

export const MediaModal: React.FC<MediaModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingItem,
}) => {
  const [title, setTitle] = useState('');
  const [originalTitle, setOriginalTitle] = useState('');
  const [type, setType] = useState<MediaType>('anime');
  const [status, setStatus] = useState<WatchStatus>('plan_to_watch');
  const [rating, setRating] = useState<Rating | null>(null);
  const [currentEpisode, setCurrentEpisode] = useState(0);
  const [totalEpisodes, setTotalEpisodes] = useState(12);
  
  // Progress Detail States (Anime Hr/M/S vs Manga Page)
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [mangaPage, setMangaPage] = useState(0);

  const [linkUrl, setLinkUrl] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [releaseYear, setReleaseYear] = useState(new Date().getFullYear());
  const [runtimeMinutes, setRuntimeMinutes] = useState(24);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [bannerPositionY, setBannerPositionY] = useState(45); // 0-100
  const [showPositionPicker, setShowPositionPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // MyAnimeList Auto-Search States
  const [malQuery, setMalQuery] = useState('');
  const [malResults, setMalResults] = useState<MalSearchResult[]>([]);
  const [isSearchingMal, setIsSearchingMal] = useState(false);
  const [hasSearchedMal, setHasSearchedMal] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setTitle(editingItem.title || '');
      setOriginalTitle(editingItem.originalTitle || '');
      setType(editingItem.type || 'anime');
      setStatus(editingItem.status || 'plan_to_watch');
      setRating(editingItem.rating ?? null);
      setCurrentEpisode(editingItem.progress?.currentEpisode ?? 0);
      setTotalEpisodes(editingItem.progress?.totalEpisodes ?? 12);
      
      setHours(editingItem.progress?.lastTimeObj?.hours ?? 0);
      setMinutes(editingItem.progress?.lastTimeObj?.minutes ?? 0);
      setSeconds(editingItem.progress?.lastTimeObj?.seconds ?? 0);
      setMangaPage(editingItem.progress?.lastPage ?? 0);

      setLinkUrl(editingItem.linkUrl || '');
      setPosterUrl(editingItem.posterUrl || '');
      setBannerUrl(editingItem.bannerUrl || editingItem.posterUrl || '');
      setReleaseYear(editingItem.releaseYear || new Date().getFullYear());
      setRuntimeMinutes(editingItem.runtimeMinutes || 24);
      setSelectedGenres(Array.isArray(editingItem.genres) ? editingItem.genres : []);
      setNotes(editingItem.notes || '');
      setBannerPositionY(editingItem.bannerPositionY ?? 45);
    } else {
      setTitle('');
      setOriginalTitle('');
      setType('anime');
      setStatus('plan_to_watch');
      setRating(null);
      setCurrentEpisode(0);
      setTotalEpisodes(12);
      
      setHours(0);
      setMinutes(0);
      setSeconds(0);
      setMangaPage(0);

      setLinkUrl('');
      setPosterUrl('');
      setBannerUrl('');
      setReleaseYear(new Date().getFullYear());
      setRuntimeMinutes(24);
      setSelectedGenres(['Action']);
      setNotes('');
      setBannerPositionY(45);
      setShowPositionPicker(false);
    }
    setMalQuery('');
    setMalResults([]);
    setHasSearchedMal(false);
  }, [editingItem, isOpen]);

  // Live Debounced Autocomplete Search as you type (>= 3 characters)
  useEffect(() => {
    const trimmed = malQuery.trim();
    if (trimmed.length < 3) {
      setMalResults([]);
      setHasSearchedMal(false);
      setIsSearchingMal(false);
      return;
    }

    setIsSearchingMal(true);
    setHasSearchedMal(true);

    const timer = setTimeout(async () => {
      const results = await searchMyAnimeList(trimmed, type);
      setMalResults(results);
      setIsSearchingMal(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [malQuery, type]);

  // Drag handler for position picker (Must be called before conditional returns to obey Rules of Hooks)
  const handlePickerDrag = useCallback((clientY: number) => {
    if (!pickerRef.current) return;
    const rect = pickerRef.current.getBoundingClientRect();
    const relY = clientY - rect.top;
    const pct = Math.round(Math.max(0, Math.min(100, (relY / rect.height) * 100)));
    setBannerPositionY(pct);
  }, []);

  if (!isOpen) return null;

  const handleManualSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!malQuery.trim()) return;

    setIsSearchingMal(true);
    setHasSearchedMal(true);
    const results = await searchMyAnimeList(malQuery.trim(), type);
    setMalResults(results);
    setIsSearchingMal(false);
  };

  const handleImportMalItem = (res: MalSearchResult) => {
    setTitle(res.title);
    if (res.titleJapanese) setOriginalTitle(res.titleJapanese);
    if (res.posterUrl) setPosterUrl(res.posterUrl);
    if (res.bannerUrl) setBannerUrl(res.bannerUrl);
    if (res.episodesOrChapters) setTotalEpisodes(res.episodesOrChapters);
    if (res.runtimeMinutes) setRuntimeMinutes(res.runtimeMinutes);
    if (res.releaseYear) setReleaseYear(res.releaseYear);
    if (res.score) setRating(Math.round(res.score) as Rating);
    if (res.genres && res.genres.length > 0) {
      setSelectedGenres(res.genres);
    }
    if (res.synopsis) {
      setNotes(res.synopsis);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const isAnimeType = type === 'anime';
    const h = Math.max(0, Number(hours) || 0);
    const m = Math.max(0, Number(minutes) || 0);
    const s = Math.max(0, Number(seconds) || 0);
    const mm = String(m).padStart(2, '0');
    const ss = String(s).padStart(2, '0');
    const formattedStr = isAnimeType 
      ? (h > 0 ? `${h}:${mm}:${ss}` : (m > 0 || s > 0 ? `${m}:${ss}` : undefined))
      : (mangaPage > 0 ? `Hal. ${mangaPage}` : undefined);

    onSave({
      id: editingItem?.id,
      title: title.trim(),
      originalTitle: originalTitle.trim() || undefined,
      type,
      status,
      rating,
      progress: {
        currentEpisode: Number(currentEpisode),
        totalEpisodes: Math.max(1, Number(totalEpisodes)),
        lastTimeObj: isAnimeType ? { hours: h, minutes: m, seconds: s } : undefined,
        lastTimestamp: formattedStr,
        lastPage: !isAnimeType && mangaPage > 0 ? Number(mangaPage) : undefined,
      },
      linkUrl: linkUrl.trim() || undefined,
      posterUrl: posterUrl.trim() || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
      bannerUrl: bannerUrl.trim() || posterUrl.trim() || undefined,
      bannerPositionY,
      releaseYear: Number(releaseYear),
      runtimeMinutes: Number(runtimeMinutes),
      genres: selectedGenres.length > 0 ? selectedGenres : ['Action'],
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  const isAnime = type === 'anime';
  const unitLabel = isAnime ? 'Episode' : 'Chapter';
  const previewImageUrl = (bannerUrl || '').trim() || (posterUrl || '').trim();



  const handlePickerMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    handlePickerDrag(e.clientY);
    const onMove = (ev: MouseEvent) => { if (isDragging.current) handlePickerDrag(ev.clientY); };
    const onUp = () => { isDragging.current = false; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handlePickerTouchMove = (e: React.TouchEvent) => {
    handlePickerDrag(e.touches[0].clientY);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '28px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        {/* Header Modal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {editingItem ? `Edit ${(type || 'anime').toUpperCase()}` : `Tambah ${type === 'manga' ? 'Manga' : 'Anime'} Baru`}
            </h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Ketik judul di pencarian otomatis atau isi formulir secara manual.
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Section Live Auto-Search MyAnimeList / AniList */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          borderRadius: 'var(--radius-sm)',
          padding: '16px',
          marginBottom: '20px'
        }}>
          {/* Search Header Row with Anime / Manga Toggle Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
              <Sparkles size={15} />
              <span>Pencarian Otomatis ({(type || 'anime').toUpperCase()})</span>
            </div>

            {/* Anime vs Manga Toggle Tabs */}
            <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-main)', padding: '3px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                onClick={() => setType('anime')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 10px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: type === 'anime' ? 'var(--accent-blue)' : 'transparent',
                  color: type === 'anime' ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Clapperboard size={12} />
                <span>Anime</span>
              </button>
              <button
                type="button"
                onClick={() => setType('manga')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 10px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: type === 'manga' ? '#a855f7' : 'transparent',
                  color: type === 'manga' ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <BookOpen size={12} />
                <span>Manga</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleManualSearchSubmit} style={{ display: 'flex', gap: '8px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder={`Cari ${type === 'anime' ? 'Anime (contoh: One Piece, Frieren, Naruto)' : 'Manga (contoh: Ikiru no Hetana, Solo Leveling, Berserk)'}...`}
                className="input-clean"
                style={{ width: '100%', paddingLeft: '36px', fontSize: '0.88rem' }}
                value={malQuery}
                onChange={(e) => setMalQuery(e.target.value)}
              />
              {malQuery && (
                <button
                  type="button"
                  onClick={() => setMalQuery('')}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </form>

          {/* Results Grid from Live Search */}
          {hasSearchedMal && (
            <div style={{ marginTop: '14px' }}>
              {isSearchingMal ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Loader2 size={16} className="animate-spin" color="var(--accent-cyan)" />
                  <span>Mencari {type} untuk "{malQuery}"...</span>
                </div>
              ) : malResults.length > 0 ? (
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>
                    Hasil Pencarian {type.toUpperCase()} ({malResults.length} ditemukan):
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '10px', maxHeight: '240px', overflowY: 'auto' }}>
                    {malResults.map((res) => (
                      <div
                        key={res.malId}
                        style={{
                          display: 'flex',
                          gap: '10px',
                          background: 'var(--bg-main)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '8px 10px',
                          alignItems: 'center',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <img
                          src={res.bannerUrl || res.posterUrl}
                          alt={res.title}
                          style={{ width: '38px', height: '52px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0, background: '#0d1320' }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.83rem', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {res.title}
                          </div>
                          <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {res.releaseYear} • {unitLabel}: {res.episodesOrChapters} {res.score ? `• ⭐ ${res.score}` : ''}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleImportMalItem(res)}
                          className="pill-btn"
                          style={{ padding: '5px 10px', fontSize: '0.75rem', background: 'rgba(56, 189, 248, 0.15)', color: 'var(--accent-cyan)', borderColor: 'rgba(56, 189, 248, 0.3)', flexShrink: 0 }}
                          title="Impor ke Form"
                        >
                          <ArrowRight size={13} /> Impor
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)' }}>
                  <div>Tidak ada {type} ditemukan untuk kata kunci "{malQuery}".</div>
                  <button
                    type="button"
                    onClick={() => setType(type === 'anime' ? 'manga' : 'anime')}
                    className="pill-btn"
                    style={{ marginTop: '8px', fontSize: '0.75rem', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', borderColor: 'rgba(168, 85, 247, 0.3)' }}
                  >
                    {type === 'anime' ? '📚 Coba Cari sebagai MANGA' : '🎬 Coba Cari sebagai ANIME'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Manual Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                Judul Utama (Terkunci) *
              </label>
              <input
                type="text"
                required
                readOnly
                disabled
                placeholder="Cari dari MyAnimeList / AniList di atas..."
                className="input-clean"
                style={{ width: '100%', opacity: 0.6, cursor: 'not-allowed' }}
                value={title}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                Judul Jepang / Sub-Judul (Terkunci)
              </label>
              <input
                type="text"
                readOnly
                disabled
                placeholder="Judul romaji/jepang otomatis terisi..."
                className="input-clean"
                style={{ width: '100%', opacity: 0.6, cursor: 'not-allowed' }}
                value={originalTitle}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                Kategori Media (Terkunci)
              </label>
              <select
                disabled
                className="input-clean select-clean"
                style={{ width: '100%', opacity: 0.6, cursor: 'not-allowed' }}
                value={type}
              >
                <option value="anime" style={{ background: '#0d1320' }}>Anime</option>
                <option value="manga" style={{ background: '#0d1320' }}>Manga</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                Status
              </label>
              <select
                className="input-clean select-clean"
                style={{ width: '100%' }}
                value={status}
                onChange={(e) => setStatus(e.target.value as WatchStatus)}
              >
                <option value="watching" style={{ background: '#0d1320' }}>{isAnime ? 'Watching' : 'Reading'}</option>
                <option value="completed" style={{ background: '#0d1320' }}>Completed</option>
                <option value="plan_to_watch" style={{ background: '#0d1320' }}>{isAnime ? 'Plan to Watch' : 'Plan to Read'}</option>
                <option value="on_hold" style={{ background: '#0d1320' }}>On Hold</option>
                <option value="dropped" style={{ background: '#0d1320' }}>Dropped</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                Rating (1 - 10)
              </label>
              <select
                className="input-clean select-clean"
                style={{ width: '100%' }}
                value={rating || ''}
                onChange={(e) => setRating(e.target.value ? Number(e.target.value) as Rating : null)}
              >
                <option value="" style={{ background: '#0d1320' }}>Belum Rated</option>
                {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((r) => (
                  <option key={r} value={r} style={{ background: '#0d1320' }}>⭐ {r} / 10</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                Tahun Rilis (Terkunci)
              </label>
              <input
                type="number"
                readOnly
                disabled
                min="1950"
                max="2100"
                className="input-clean"
                style={{ width: '100%', opacity: 0.6, cursor: 'not-allowed' }}
                value={releaseYear}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                {unitLabel} Saat Ini
              </label>
              <input
                type="number"
                min="0"
                className="input-clean"
                style={{ width: '100%' }}
                value={currentEpisode}
                onChange={(e) => setCurrentEpisode(Number(e.target.value))}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                Total {unitLabel} (Terkunci)
              </label>
              <input
                type="number"
                readOnly
                disabled
                min="1"
                className="input-clean"
                style={{ width: '100%', opacity: 0.6, cursor: 'not-allowed' }}
                value={totalEpisodes}
              />
            </div>
          </div>

          {/* Special Timestamp (Anime) vs Page Input (Manga) */}
          <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '8px', color: isAnime ? 'var(--accent-cyan)' : '#c084fc' }}>
              {isAnime ? '⏱️ Progress Waktu Anime (Jam : Menit : Detik)' : '📖 Progress Halaman Manga'}
            </label>
            {isAnime ? (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Jam (hr)</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    className="input-clean"
                    style={{ width: '100%', textAlign: 'center' }}
                    value={hours}
                    onChange={(e) => setHours(Number(e.target.value))}
                  />
                </div>
                <span style={{ fontSize: '1rem', color: '#fff', marginTop: '14px' }}>:</span>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Menit (m)</span>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    placeholder="24"
                    className="input-clean"
                    style={{ width: '100%', textAlign: 'center' }}
                    value={minutes}
                    onChange={(e) => setMinutes(Number(e.target.value))}
                  />
                </div>
                <span style={{ fontSize: '1rem', color: '#fff', marginTop: '14px' }}>:</span>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Detik (s)</span>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    placeholder="00"
                    className="input-clean"
                    style={{ width: '100%', textAlign: 'center' }}
                    value={seconds}
                    onChange={(e) => setSeconds(Number(e.target.value))}
                  />
                </div>
              </div>
            ) : (
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Nomor Halaman Komik (Integer)</span>
                <input
                  type="number"
                  min="0"
                  placeholder="Contoh: 42"
                  className="input-clean"
                  style={{ width: '100%' }}
                  value={mangaPage}
                  onChange={(e) => setMangaPage(Number(e.target.value))}
                />
              </div>
            )}
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', marginBottom: '4px', color: 'var(--text-secondary)' }}>
              <LinkIcon size={13} color="var(--accent-cyan)" />
              <span>URL Link {isAnime ? 'Nonton (Streaming)' : 'Baca (Komik Online)'}</span>
            </label>
            <input
              type="url"
              placeholder={isAnime ? "https://bilibili.tv/... atau https://crunchyroll.com/..." : "https://mangadex.org/... atau https://komiku.com/..."}
              className="input-clean"
              style={{ width: '100%' }}
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px', color: 'var(--text-secondary)' }}>
              URL Gambar Poster / Banner (Terkunci)
            </label>
            <input
              type="url"
              readOnly
              disabled
              placeholder="URL gambar otomatis dari hasil pencarian..."
              className="input-clean"
              style={{ width: '100%', opacity: 0.6, cursor: 'not-allowed' }}
              value={posterUrl}
            />

            {/* Image Position Picker */}
            {previewImageUrl && (
              <div style={{ marginTop: '10px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                {/* Toggle button */}
                <button
                  type="button"
                  onClick={() => setShowPositionPicker((v) => !v)}
                  style={{
                    width: '100%', padding: '6px 12px', background: 'rgba(56,189,248,0.08)',
                    border: 'none', borderBottom: showPositionPicker ? '1px solid var(--border-subtle)' : 'none',
                    color: 'var(--accent-cyan)', fontSize: '0.78rem', fontWeight: 600,
                    cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '6px'
                  }}
                >
                  🖼️ Atur Posisi Gambar Background Card — Y: {bannerPositionY}%
                  <span style={{ marginLeft: 'auto', opacity: 0.6 }}>{showPositionPicker ? '▲ Tutup' : '▼ Buka'}</span>
                </button>

                {showPositionPicker && (
                  <div style={{ padding: '10px 12px', background: 'rgba(10,14,23,0.8)' }}>
                    {/* Card Preview Strip */}
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                      Drag pada gambar atau geser slider untuk atur posisi vertikal
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      {/* Drag zone - full image height */}
                      <div
                        ref={pickerRef}
                        onMouseDown={handlePickerMouseDown}
                        onTouchMove={handlePickerTouchMove}
                        style={{
                          flex: 1, height: '200px', position: 'relative',
                          borderRadius: '6px', overflow: 'hidden', cursor: 'ns-resize',
                          userSelect: 'none', backgroundImage: `url(${previewImageUrl})`,
                          backgroundSize: 'cover', backgroundPosition: `center ${bannerPositionY}%`,
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        {/* Card frame highlight */}
                        <div style={{
                          position: 'absolute', left: 0, right: 0,
                          top: '30%', height: '40%',
                          background: 'rgba(56,189,248,0.18)',
                          border: '2px solid rgba(56,189,248,0.7)',
                          borderRadius: '2px',
                          backdropFilter: 'blur(1px)',
                          pointerEvents: 'none',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <span style={{ fontSize: '0.65rem', color: '#38bdf8', fontWeight: 700, background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: '4px' }}>
                            ↕ Card Frame
                          </span>
                        </div>
                      </div>

                      {/* Live mini card preview */}
                      <div style={{ width: '120px', flexShrink: 0 }}>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '4px', textAlign: 'center' }}>Preview Card</div>
                        <div style={{
                          height: '52px', borderRadius: '6px', overflow: 'hidden',
                          backgroundImage: `linear-gradient(90deg, rgba(8,12,20,0.90) 0%, rgba(12,18,30,0.60) 55%, rgba(15,23,42,0.25) 100%), url(${previewImageUrl})`,
                          backgroundSize: 'cover', backgroundPosition: `center ${bannerPositionY}%`,
                          border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center',
                          padding: '0 8px',
                        }}>
                          <span style={{ fontSize: '0.62rem', color: '#fff', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {title || 'Preview...'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Slider */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Atas</span>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={bannerPositionY}
                        onChange={(e) => setBannerPositionY(Number(e.target.value))}
                        style={{ flex: 1, accentColor: 'var(--accent-cyan)' }}
                      />
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Bawah</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', fontWeight: 700, minWidth: '36px', textAlign: 'right' }}>
                        {bannerPositionY}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '6px', color: 'var(--text-secondary)' }}>
              Genre (Terkunci)
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', pointerEvents: 'none', opacity: 0.6 }}>
              {GENRE_OPTIONS.map((g) => {
                const isSelected = Array.isArray(selectedGenres) && selectedGenres.includes(g);
                return (
                  <button
                    type="button"
                    key={g}
                    className={`pill-btn ${isSelected ? 'active' : ''}`}
                    style={{ padding: '3px 10px', fontSize: '0.75rem', cursor: 'not-allowed' }}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
            <button type="button" onClick={onClose} className="pill-btn">
              Batal
            </button>
            <button type="submit" className="pill-btn active">
              <Save size={14} />
              Simpan Data
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
