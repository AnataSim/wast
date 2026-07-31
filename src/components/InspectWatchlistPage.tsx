import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, 
  Search, 
  X, 
  Clapperboard, 
  BookOpen, 
  SlidersHorizontal, 
  ArrowUpDown, 
  Layers, 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle, 
  RefreshCw,
  Eye
} from 'lucide-react';
import type { WatchlistItem, FilterOptions, StatsSummary, WatchStatus, MediaType } from '../types/watchlist';
import { fetchFriendWatchlist, type FriendUser } from '../services/friendService';
import { StatsDashboard } from './StatsDashboard';
import { WatchCard } from './WatchCard';

interface InspectWatchlistPageProps {
  friend: FriendUser;
  onBackToLobby: () => void;
}

export const InspectWatchlistPage: React.FC<InspectWatchlistPageProps> = ({
  friend,
  onBackToLobby,
}) => {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState<FilterOptions>({
    searchQuery: '',
    category: 'all',
    status: 'all',
    genre: 'all',
    sortBy: 'updatedAt',
    sortOrder: 'desc',
    favoritesOnly: false,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number | 'all'>(10);

  useEffect(() => {
    setLoading(true);
    fetchFriendWatchlist(friend.uid, friend.username)
      .then((data) => setItems(data))
      .catch((err) => console.warn('Gagal memuat list teman:', err))
      .finally(() => setLoading(false));
  }, [friend]);

  const handleFilterChange = (updatedFilter: Partial<FilterOptions>) => {
    setFilter((prev) => ({ ...prev, ...updatedFilter }));
    setCurrentPage(1);
  };

  const stats: StatsSummary = useMemo(() => {
    let watchingCount = 0;
    let completedCount = 0;
    let planToWatchCount = 0;
    let onHoldCount = 0;
    let droppedCount = 0;
    let favoriteCount = 0;
    let totalMinutes = 0;
    let ratingSum = 0;
    let ratedItemsCount = 0;
    let remainingMinutes = 0;
    let remainingChapters = 0;

    items.forEach((item) => {
      if (item.status === 'watching') watchingCount++;
      if (item.status === 'completed') completedCount++;
      if (item.status === 'plan_to_watch') planToWatchCount++;
      if (item.status === 'on_hold') onHoldCount++;
      if (item.status === 'dropped') droppedCount++;
      if (item.favorite) favoriteCount++;

      const episodesWatched = item.progress.currentEpisode;
      totalMinutes += episodesWatched * item.runtimeMinutes;

      if (item.status !== 'completed' && item.status !== 'dropped') {
        const remainingEpisodes = Math.max(0, item.progress.totalEpisodes - item.progress.currentEpisode);
        if (item.type === 'anime') {
          const episodeRuntime = item.runtimeMinutes || 24;
          let itemRemainingMins = remainingEpisodes * episodeRuntime;

          if (item.progress.lastTimeObj && remainingEpisodes > 0) {
            const watchedMinsInCurrentEp = 
              (item.progress.lastTimeObj.hours || 0) * 60 + 
              (item.progress.lastTimeObj.minutes || 0) + 
              Math.round((item.progress.lastTimeObj.seconds || 0) / 60);

            const timeDeduction = Math.min(episodeRuntime, watchedMinsInCurrentEp);
            itemRemainingMins = Math.max(0, itemRemainingMins - timeDeduction);
          }

          remainingMinutes += itemRemainingMins;
        } else {
          remainingChapters += remainingEpisodes;
        }
      }

      if (item.rating) {
        ratingSum += item.rating;
        ratedItemsCount++;
      }
    });

    return {
      totalItems: items.length,
      watchingCount,
      completedCount,
      planToWatchCount,
      onHoldCount,
      droppedCount,
      favoriteCount,
      totalHoursWatched: Math.round(totalMinutes / 60),
      averageRating: ratedItemsCount > 0 ? Number((ratingSum / ratedItemsCount).toFixed(1)) : 0,
      remainingMinutes,
      remainingChapters,
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        if (filter.searchQuery.trim()) {
          const q = filter.searchQuery.toLowerCase();
          const matchTitle = (item.title || '').toLowerCase().includes(q);
          const matchOriginal = item.originalTitle?.toLowerCase().includes(q);
          const matchGenre = Array.isArray(item.genres) && item.genres.some((g) => (g || '').toLowerCase().includes(q));
          const matchNotes = item.notes?.toLowerCase().includes(q);
          if (!matchTitle && !matchOriginal && !matchGenre && !matchNotes) return false;
        }

        if (filter.category !== 'all' && item.type !== filter.category) return false;
        if (filter.status !== 'all' && item.status !== filter.status) return false;
        if (filter.genre !== 'all' && !(Array.isArray(item.genres) && item.genres.includes(filter.genre))) return false;
        if (filter.favoritesOnly && !item.favorite) return false;

        return true;
      })
      .sort((a, b) => {
        const factor = filter.sortOrder === 'asc' ? 1 : -1;
        if (filter.sortBy === 'customOrder') {
          const ordA = a.customOrder ?? (items.indexOf(a) + 1);
          const ordB = b.customOrder ?? (items.indexOf(b) + 1);
          return (ordA - ordB) * factor;
        }
        if (filter.sortBy === 'title') {
          return a.title.localeCompare(b.title) * factor;
        }
        if (filter.sortBy === 'rating') {
          return ((a.rating || 0) - (b.rating || 0)) * factor;
        }
        if (filter.sortBy === 'releaseYear') {
          return (a.releaseYear - b.releaseYear) * factor;
        }
        if (filter.sortBy === 'progress') {
          const pA = a.progress.totalEpisodes > 0 ? a.progress.currentEpisode / a.progress.totalEpisodes : 0;
          const pB = b.progress.totalEpisodes > 0 ? b.progress.currentEpisode / b.progress.totalEpisodes : 0;
          return (pA - pB) * factor;
        }
        return (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()) * factor;
      });
  }, [items, filter]);

  const totalItemsCount = filteredItems.length;
  const isPaginationActive = totalItemsCount > 10;
  const effectiveLimit = itemsPerPage === 'all' ? totalItemsCount : itemsPerPage;
  const totalPages = Math.max(1, Math.ceil(totalItemsCount / (typeof effectiveLimit === 'number' && effectiveLimit > 0 ? effectiveLimit : 1)));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const paginatedItems = useMemo(() => {
    if (!isPaginationActive || itemsPerPage === 'all') {
      return filteredItems;
    }
    const start = (currentPage - 1) * (itemsPerPage as number);
    return filteredItems.slice(start, start + (itemsPerPage as number));
  }, [filteredItems, isPaginationActive, itemsPerPage, currentPage]);

  const categoryTabs: { label: string; value: MediaType | 'all'; icon?: React.ReactNode }[] = [
    { label: 'Semua', value: 'all' },
    { label: 'Anime', value: 'anime', icon: <Clapperboard size={14} /> },
    { label: 'Manga', value: 'manga', icon: <BookOpen size={14} /> },
  ];

  const statusPills: { label: string; value: WatchStatus | 'all' }[] = [
    { label: 'Semua Status', value: 'all' },
    { label: 'Watching / Reading', value: 'watching' },
    { label: 'Completed', value: 'completed' },
    { label: 'Plan to Watch / Read', value: 'plan_to_watch' },
    { label: 'On Hold', value: 'on_hold' },
    { label: 'Dropped', value: 'dropped' },
  ];

  const noop = () => {};

  const renderPagination = (position: 'top' | 'bottom') => {
    if (!isPaginationActive) return null;

    const startItem = itemsPerPage === 'all' ? 1 : Math.min((currentPage - 1) * (itemsPerPage as number) + 1, totalItemsCount);
    const endItem = itemsPerPage === 'all' ? totalItemsCount : Math.min(currentPage * (itemsPerPage as number), totalItemsCount);

    return (
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          margin: position === 'top' ? '0 0 16px' : '20px 0 10px',
          padding: '12px 18px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Layers size={15} color="var(--accent-blue)" />
          {itemsPerPage === 'all' ? (
            <span>Menampilkan <strong>semua {totalItemsCount}</strong> judul</span>
          ) : (
            <span>
              Menampilkan <strong>{startItem}–{endItem}</strong> dari <strong>{totalItemsCount}</strong> judul
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: '2px' }}>Tampilkan:</span>
            <button
              type="button"
              onClick={() => { setItemsPerPage(10); setCurrentPage(1); }}
              className={`pill-btn ${itemsPerPage === 10 ? 'active' : ''}`}
              style={{ fontSize: '0.75rem', padding: '3px 9px' }}
            >
              10
            </button>
            <button
              type="button"
              onClick={() => { setItemsPerPage(20); setCurrentPage(1); }}
              className={`pill-btn ${itemsPerPage === 20 ? 'active' : ''}`}
              style={{ fontSize: '0.75rem', padding: '3px 9px' }}
            >
              20
            </button>
            <button
              type="button"
              onClick={() => { setItemsPerPage('all'); setCurrentPage(1); }}
              className={`pill-btn ${itemsPerPage === 'all' ? 'active' : ''}`}
              style={{ fontSize: '0.75rem', padding: '3px 10px' }}
            >
              Semua ({totalItemsCount})
            </button>
          </div>

          {itemsPerPage !== 'all' && totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="pill-btn"
                style={{
                  padding: '4px 8px',
                  fontSize: '0.78rem',
                  opacity: currentPage === 1 ? 0.35 : 1,
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                }}
              >
                <ChevronLeft size={14} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  type="button"
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`pill-btn ${currentPage === pageNum ? 'active' : ''}`}
                  style={{
                    minWidth: '28px',
                    height: '28px',
                    padding: '0 6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.78rem',
                    fontWeight: currentPage === pageNum ? 700 : 500,
                  }}
                >
                  {pageNum}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="pill-btn"
                style={{
                  padding: '4px 8px',
                  fontSize: '0.78rem',
                  opacity: currentPage === totalPages ? 0.35 : 1,
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const friendName = friend.username || 'Friend';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', width: '100%' }}>
      {/* Top Navbar */}
      <nav className="navbar" style={{ marginBottom: '24px', position: 'sticky', top: 0, zIndex: 500 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={onBackToLobby}
            className="pill-btn active"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              fontSize: '0.85rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
              borderColor: 'transparent',
              boxShadow: '0 4px 15px rgba(59, 130, 246, 0.35)',
              cursor: 'pointer'
            }}
          >
            <ArrowLeft size={16} />
            <span>Kembali ke Lobby Saya</span>
          </button>

          <a href="#" onClick={(e) => { e.preventDefault(); onBackToLobby(); }} className="brand-logo" style={{ textDecoration: 'none' }}>
            <span className="brand-dot" />
            Wast
          </a>
        </div>

        {/* Inspect Banner Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '5px 14px',
              borderRadius: 'var(--radius-pill)',
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: 'var(--accent-cyan)',
              fontSize: '0.82rem',
              fontWeight: 700
            }}
          >
            <Eye size={16} color="var(--accent-cyan)" />
            <span>Mode Inspect &bull; {friendName}&apos;s Boothlisted</span>
          </div>

          {friend.photoURL && (
            <img
              src={friend.photoURL}
              alt={friendName}
              style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #38bdf8' }}
            />
          )}
        </div>
      </nav>

      {/* Main Container Section */}
      <div className="main-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px 16px', width: '100%' }}>
        
        {/* Title & Category Tabs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <h1 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              Koleksi Anime &amp; Manga {friendName}
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                ({items.length} judul)
              </span>
            </h1>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
              Melihat daftar tontonan dan bacaan milik {friendName} secara read-only.
            </p>
          </div>

          {/* Segmented Category Buttons */}
          <div style={{ display: 'flex', background: 'var(--bg-card)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', gap: '4px' }}>
            {categoryTabs.map((tab) => {
              const isActive = filter.category === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => handleFilterChange({ category: tab.value })}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    border: 'none',
                    background: isActive ? 'var(--accent-blue)' : 'transparent',
                    color: isActive ? '#ffffff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Clean Filter Panel Box */}
        <div 
          className="filter-panel-box"
          style={{ 
            background: 'var(--bg-card)', 
            border: '1px solid var(--border-subtle)', 
            borderRadius: 'var(--radius-md)', 
            padding: '16px 20px', 
            marginBottom: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
          }}
        >
          {/* Sub-row 1: Search bar (Left) & Sorting Buttons (Right) */}
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            
            <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
              <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder={`Cari dalam koleksi ${friendName}...`}
                className="input-clean"
                style={{ width: '100%', paddingLeft: '38px', paddingRight: filter.searchQuery ? '34px' : '14px' }}
                value={filter.searchQuery}
                onChange={(e) => handleFilterChange({ searchQuery: e.target.value })}
              />
              {filter.searchQuery && (
                <button
                  onClick={() => handleFilterChange({ searchQuery: '' })}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="mobile-sort-container" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                <ArrowUpDown size={13} /> Urutkan:
              </span>
              <button
                className={`pill-btn ${filter.sortBy === 'customOrder' ? 'active' : ''}`}
                onClick={() => handleFilterChange({ sortBy: 'customOrder', sortOrder: 'asc' })}
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              >
                Kustom
              </button>
              <button
                className={`pill-btn ${filter.sortBy === 'updatedAt' ? 'active' : ''}`}
                onClick={() => handleFilterChange({ sortBy: 'updatedAt', sortOrder: filter.sortBy === 'updatedAt' && filter.sortOrder === 'desc' ? 'asc' : 'desc' })}
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              >
                Terbaru
              </button>
              <button
                className={`pill-btn ${filter.sortBy === 'rating' ? 'active' : ''}`}
                onClick={() => handleFilterChange({ sortBy: 'rating', sortOrder: filter.sortBy === 'rating' && filter.sortOrder === 'desc' ? 'asc' : 'desc' })}
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              >
                Rating
              </button>
              <button
                className={`pill-btn ${filter.sortBy === 'progress' ? 'active' : ''}`}
                onClick={() => handleFilterChange({ sortBy: 'progress', sortOrder: filter.sortBy === 'progress' && filter.sortOrder === 'desc' ? 'asc' : 'desc' })}
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              >
                Progres
              </button>
            </div>
          </div>

          {/* Sub-row 2: Status Filter Chips Bar */}
          <div className="mobile-status-scroll" style={{ paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto' }}>
            <SlidersHorizontal size={14} color="var(--text-muted)" style={{ flexShrink: 0, marginRight: '4px' }} />
            {statusPills.map((s) => {
              const isActive = filter.status === s.value;
              return (
                <button
                  key={s.value}
                  onClick={() => handleFilterChange({ status: s.value })}
                  className={`pill-btn ${isActive ? 'active' : ''}`}
                  style={{ padding: '5px 12px', fontSize: '0.78rem', whiteSpace: 'nowrap' }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Stats Dashboard for Friend */}
        <StatsDashboard
          stats={stats}
          activeStatusFilter={filter.status}
          onSelectStatus={(status) => handleFilterChange({ status })}
        />

        {/* Watchlist Main Content */}
        {loading ? (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '60px 20px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            margin: '20px 0'
          }}>
            <span>Memuat koleksi {friendName}...</span>
          </div>
        ) : filteredItems.length > 0 ? (
          <>
            {renderPagination('top')}
            <div className="cards-list" style={{ background: 'transparent' }}>
              {paginatedItems.map((item, index) => {
                const globalIndex = (itemsPerPage === 'all' || !isPaginationActive)
                  ? index
                  : (currentPage - 1) * (itemsPerPage as number) + index;
                return (
                  <WatchCard
                    key={item.id}
                    item={item}
                    index={globalIndex}
                    totalItems={filteredItems.length}
                    onUpdateStatus={noop}
                    onIncrementEpisode={noop}
                    onDecrementEpisode={noop}
                    onToggleFavorite={noop}
                    onRateItem={noop}
                    onEditItem={noop}
                    onDeleteItem={noop}
                    onUpdateTimestamp={noop}
                    onUpdateBannerPosition={noop}
                    onMoveUp={noop}
                    onMoveDown={noop}
                  />
                );
              })}
            </div>
            {renderPagination('bottom')}
          </>
        ) : (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '40px 20px',
            textAlign: 'center',
            margin: '20px 0'
          }}>
            <AlertCircle size={28} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
            <h3 style={{ fontSize: '1rem', color: '#fff', marginBottom: '4px' }}>Daftar Kosong / Tidak Ditemukan</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '16px' }}>
              {friendName} belum menambahkan judul atau kata kunci filter tidak cocok.
            </p>
            <button
              onClick={() => {
                setFilter({
                  searchQuery: '',
                  category: 'all',
                  status: 'all',
                  genre: 'all',
                  sortBy: 'customOrder',
                  sortOrder: 'asc',
                  favoritesOnly: false,
                });
              }}
              className="pill-btn"
            >
              <RefreshCw size={14} /> Reset Filter
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
