import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Header } from './components/Header';
import { StatsDashboard } from './components/StatsDashboard';
import { WatchCard } from './components/WatchCard';
import { MediaModal } from './components/MediaModal';
import { AuthModal } from './components/AuthModal';
import { SettingsModal } from './components/SettingsModal';
import { WelcomeHero } from './components/WelcomeHero';
import { AnimatedBackground } from './components/AnimatedBackground';
import { CursorTrail } from './components/CursorTrail';
import type { WatchlistItem, FilterOptions, StatsSummary, WatchStatus, TimestampData } from './types/watchlist';
import { useAuth } from './context/AuthContext';
import { 
  subscribeToWatchlist, 
  saveWatchlistItemToFirestore, 
  deleteWatchlistItemFromFirestore 
} from './services/watchlistService';
import { RefreshCw, AlertCircle, ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import { FriendsPanel } from './components/FriendsPanel';
import { FriendProfileModal } from './components/FriendProfileModal';
import { InspectWatchlistModal } from './components/InspectWatchlistModal';
import { subscribeToIncomingRequests, type FriendRequest, type FriendUser } from './services/friendService';


export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("React ErrorBoundary caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '24px', background: '#7f1d1d', color: '#fff', borderRadius: '12px', margin: '20px auto', maxWidth: '800px', border: '1px solid #f87171', zIndex: 99999, position: 'relative' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px' }}>⚠️ Error Terjadi Saat Mengakses Komponen</h3>
          <p style={{ fontSize: '0.85rem', color: '#fca5a5' }}>
            Aplikasi berhasil mencegah layar hitam! Di bawah ini adalah detail error untuk perbaikan:
          </p>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.78rem', background: '#000', padding: '12px', borderRadius: '6px', marginTop: '12px', color: '#4ade80', overflowX: 'auto' }}>
            {this.state.error?.toString()}
            {'\n\n'}
            {this.state.error?.stack}
          </pre>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{ marginTop: '14px', padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
          >
            🔄 Coba Buka Ulang
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  
  const [items, setItems] = useState<WatchlistItem[]>([]);

  // Strictly isolate items per user UID to prevent cross-account item leaks
  useEffect(() => {
    if (!user) {
      setItems([]);
      return;
    }

    // 1. Try loading cached items for THIS user from local storage
    const userStorageKey = `watchlist_items_${user.uid}`;
    try {
      const cached = localStorage.getItem(userStorageKey);
      if (cached) {
        setItems(JSON.parse(cached));
      } else {
        setItems([]);
      }
    } catch (e) {
      setItems([]);
    }

    // 2. Subscribe to real-time Firestore updates for THIS user
    const unsubscribe = subscribeToWatchlist(
      user.uid,
      (firestoreItems) => {
        // Authoritative source: Firestore items for user.uid
        setItems(firestoreItems);
        try {
          localStorage.setItem(userStorageKey, JSON.stringify(firestoreItems));
        } catch (e) {
          console.warn('Gagal menyimpan cache lokal watchlist user:', e);
        }
      },
      (err) => {
        console.warn('Gagal berlangganan watchlist Firestore:', err);
      }
    );

    return () => unsubscribe();
  }, [user]);

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

  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WatchlistItem | null>(null);
  const [activeBgPickerId, setActiveBgPickerId] = useState<string | null>(null);

  const handleOpenAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  // PNG Screenshot Export States
  const [isExporting, setIsExporting] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  // Friends System States
  const [isOpenMobileFriends, setIsOpenMobileFriends] = useState(false);
  const [selectedFriendForProfile, setSelectedFriendForProfile] = useState<FriendUser | null>(null);
  const [selectedFriendForInspect, setSelectedFriendForInspect] = useState<FriendUser | null>(null);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);

  useEffect(() => {
    if (!user) {
      setIncomingRequests([]);
      return;
    }
    const unsub = subscribeToIncomingRequests(user.uid, (reqs) => setIncomingRequests(reqs));
    return () => unsub();
  }, [user]);

  // Visual Autosave Notification State
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const saveTimeoutRef = useRef<any>(null);

  const triggerAutosaveIndicator = () => {
    setSaveStatus('saved');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      setSaveStatus('idle');
    }, 2500);
  };

  const handleExportPNG = async () => {
    if (!exportRef.current) return;
    setIsExporting(true);
    try {
      const { toPng } = await import('html-to-image');
      const node = exportRef.current;
      const PIXEL_RATIO = 2;

      // Step 1: shrink to content width
      const prevWidth = node.style.width;
      node.style.width = 'fit-content';
      node.style.minWidth = 'unset';
      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => requestAnimationFrame(r));

      const captureWidth = node.scrollWidth;

      // Step 2: measure exact height (top of node → bottom of last card + 3px gap)
      const allCards = node.querySelectorAll<HTMLElement>('.list-row');
      const nodeRect = node.getBoundingClientRect();
      let captureHeight: number;
      if (allCards.length > 0) {
        const lastCard = allCards[allCards.length - 1];
        const lastCardRect = lastCard.getBoundingClientRect();
        captureHeight = Math.round(lastCardRect.bottom - nodeRect.top) + 3;
      } else {
        captureHeight = node.scrollHeight;
      }

      // Step 3: capture full natural height PNG
      const fullDataUrl = await toPng(node, {
        cacheBust: true,
        backgroundColor: '#0a0e17',
        pixelRatio: PIXEL_RATIO,
        width: captureWidth,
      });

      // Step 4: crop canvas to exact captureHeight
      const img = new Image();
      img.src = fullDataUrl;
      await new Promise<void>((r) => { img.onload = () => r(); });

      const canvas = document.createElement('canvas');
      canvas.width = captureWidth * PIXEL_RATIO;
      canvas.height = captureHeight * PIXEL_RATIO;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0); // draws from top-left; canvas clips bottom

      // Step 5: restore styles
      node.style.width = prevWidth;
      node.style.minWidth = '';

      const link = document.createElement('a');
      link.download = `watchlist_anime_manga_${new Date().toISOString().slice(0, 10)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Gagal mengekspor gambar PNG:', err);
      alert('Gagal mengekspor gambar PNG.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFilterChange = (updatedFilter: Partial<FilterOptions>) => {
    setFilter((prev) => ({ ...prev, ...updatedFilter }));
    setCurrentPage(1);
  };

  const handleSaveItem = async (itemData: Partial<WatchlistItem>) => {
    const now = new Date().toISOString();
    let targetItem: WatchlistItem;

    if (itemData.id) {
      targetItem = {
        ...items.find(i => i.id === itemData.id),
        ...itemData,
        updatedAt: now,
      } as WatchlistItem;
      setItems((prev) => prev.map((item) => (item.id === targetItem.id ? targetItem : item)));
    } else {
      targetItem = {
        id: Date.now().toString(),
        title: itemData.title || 'Judul Tanpa Nama',
        originalTitle: itemData.originalTitle,
        type: itemData.type || 'anime',
        status: itemData.status || 'plan_to_watch',
        rating: itemData.rating || null,
        progress: itemData.progress || { currentEpisode: 0, totalEpisodes: 1 },
        posterUrl: itemData.posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80',
        genres: itemData.genres || ['General'],
        releaseYear: itemData.releaseYear || new Date().getFullYear(),
        runtimeMinutes: itemData.runtimeMinutes || 120,
        notes: itemData.notes,
        favorite: false,
        tags: [],
        createdAt: now,
        updatedAt: now,
      };
      setItems((prev) => [targetItem, ...prev]);
    }

    triggerAutosaveIndicator();

    if (user) {
      try {
        await saveWatchlistItemToFirestore(user.uid, targetItem);
      } catch (err) {
        console.warn('Firestore save error:', err);
      }
    }
  };

  const handleDeleteItem = async (id: string) => {
    const target = items.find((i) => String(i.id) === String(id));
    if (confirm(`Apakah kamu yakin ingin menghapus "${target?.title}" dari WatchList?`)) {
      setItems((prev) => prev.filter((item) => String(item.id) !== String(id)));
      if (user) {
        try {
          await deleteWatchlistItemFromFirestore(user.uid, id);
        } catch (err) {
          console.warn('Gagal hapus di Firestore:', err);
        }
      }
    }
  };

  const handleToggleFavorite = async (id: string) => {
    const now = new Date().toISOString();
    let updatedItem: WatchlistItem | undefined;

    setItems((prev) =>
      prev.map((item) => {
        if (String(item.id) === String(id)) {
          updatedItem = { ...item, favorite: !item.favorite, updatedAt: now };
          return updatedItem;
        }
        return item;
      })
    );

    if (user && updatedItem) {
      try {
        await saveWatchlistItemToFirestore(user.uid, updatedItem);
      } catch (err) {
        console.warn('Firestore update error:', err);
      }
    }
  };

  const handleIncrementEpisode = async (id: string) => {
    const now = new Date().toISOString();
    let updatedItem: WatchlistItem | undefined;

    setItems((prev) =>
      prev.map((item) => {
        if (String(item.id) !== String(id)) return item;
        const nextEp = item.progress.currentEpisode + 1;
        const isFinished = nextEp >= item.progress.totalEpisodes;
        updatedItem = {
          ...item,
          status: isFinished ? 'completed' : item.status === 'plan_to_watch' ? 'watching' : item.status,
          progress: {
            ...item.progress,
            currentEpisode: Math.min(item.progress.totalEpisodes, nextEp),
          },
          updatedAt: now,
        };
        return updatedItem;
      })
    );

    triggerAutosaveIndicator();

    if (user && updatedItem) {
      try {
        await saveWatchlistItemToFirestore(user.uid, updatedItem);
      } catch (err) {
        console.warn('Firestore update error:', err);
      }
    }
  };

  const handleDecrementEpisode = async (id: string) => {
    const now = new Date().toISOString();
    let updatedItem: WatchlistItem | undefined;

    setItems((prev) =>
      prev.map((item) => {
        if (String(item.id) !== String(id)) return item;
        const prevEp = Math.max(0, item.progress.currentEpisode - 1);
        const newStatus = prevEp === 0 && item.status === 'watching' ? 'plan_to_watch' : item.status === 'completed' ? 'watching' : item.status;
        updatedItem = {
          ...item,
          status: newStatus,
          progress: {
            ...item.progress,
            currentEpisode: prevEp,
          },
          updatedAt: now,
        };
        return updatedItem;
      })
    );

    triggerAutosaveIndicator();

    if (user && updatedItem) {
      try {
        await saveWatchlistItemToFirestore(user.uid, updatedItem);
      } catch (err) {
        console.warn('Firestore update error:', err);
      }
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: WatchStatus) => {
    const now = new Date().toISOString();
    let updatedItem: WatchlistItem | undefined;

    setItems((prev) =>
      prev.map((item) => {
        if (String(item.id) === String(id)) {
          updatedItem = { ...item, status: newStatus, updatedAt: now };
          return updatedItem;
        }
        return item;
      })
    );

    triggerAutosaveIndicator();

    if (user && updatedItem) {
      try {
        await saveWatchlistItemToFirestore(user.uid, updatedItem);
      } catch (err) {
        console.warn('Firestore update error:', err);
      }
    }
  };

  const handleUpdateTimestamp = async (
    id: string, 
    timeObj?: TimestampData, 
    rawStr?: string, 
    pageNum?: number
  ) => {
    const now = new Date().toISOString();
    let updatedItem: WatchlistItem | undefined;

    setItems((prev) =>
      prev.map((item) => {
        if (String(item.id) === String(id)) {
          const isMarkSet = timeObj || rawStr || pageNum;
          const autoStatus = (item.status === 'plan_to_watch' && isMarkSet)
            ? (item.type === 'anime' ? 'watching' : 'reading')
            : item.status;

          updatedItem = {
            ...item,
            status: autoStatus,
            progress: {
              ...item.progress,
              lastTimeObj: timeObj,
              lastTimestamp: rawStr,
              lastPage: pageNum,
            },
            updatedAt: now,
          };
          return updatedItem;
        }
        return item;
      })
    );

    triggerAutosaveIndicator();

    if (user && updatedItem) {
      try {
        await saveWatchlistItemToFirestore(user.uid, updatedItem);
      } catch (err) {
        console.warn('Firestore update error:', err);
      }
    }
  };

  const handleRateItem = async (id: string, rating: number) => {
    const now = new Date().toISOString();
    let updatedItem: WatchlistItem | undefined;

    setItems((prev) =>
      prev.map((item) => {
        if (String(item.id) === String(id)) {
          updatedItem = { ...item, rating: rating as any, updatedAt: now };
          return updatedItem;
        }
        return item;
      })
    );

    if (user && updatedItem) {
      try {
        await saveWatchlistItemToFirestore(user.uid, updatedItem);
      } catch (err) {
        console.warn('Firestore update error:', err);
      }
    }
  };

  const handleUpdateBannerPosition = async (id: string, bannerPositionY: number) => {
    let updatedItem: WatchlistItem | undefined;

    setItems((prev) =>
      prev.map((item) => {
        if (String(item.id) === String(id)) {
          // Keep existing updatedAt unchanged so sorting order stays FIXED
          updatedItem = { ...item, bannerPositionY };
          return updatedItem;
        }
        return item;
      })
    );

    triggerAutosaveIndicator();

    if (user && updatedItem) {
      try {
        await saveWatchlistItemToFirestore(user.uid, updatedItem);
      } catch (err) {
        console.warn('Firestore update error:', err);
      }
    }
  };

  const handleMoveUp = async (id: string) => {
    const currentList = [...filteredItems];
    const idx = currentList.findIndex((i) => i.id === id);
    if (idx <= 0) return;

    // Assign customOrder to ALL items first (normalize), then swap
    const now = new Date().toISOString();
    const normalized = currentList.map((item, i) => ({
      ...item,
      customOrder: i + 1,
    }));

    // Swap positions idx and idx-1
    const temp = normalized[idx].customOrder;
    normalized[idx] = { ...normalized[idx], customOrder: normalized[idx - 1].customOrder, updatedAt: now };
    normalized[idx - 1] = { ...normalized[idx - 1], customOrder: temp, updatedAt: now };

    const updatedA = normalized[idx];
    const updatedB = normalized[idx - 1];

    setItems((prev) =>
      prev.map((i) => {
        const found = normalized.find((n) => n.id === i.id);
        return found ? { ...i, customOrder: found.customOrder, updatedAt: found.updatedAt } : i;
      })
    );

    if (filter.sortBy !== 'customOrder') {
      setFilter((f) => ({ ...f, sortBy: 'customOrder', sortOrder: 'asc' }));
    }

    if (user) {
      try {
        await saveWatchlistItemToFirestore(user.uid, updatedA);
        await saveWatchlistItemToFirestore(user.uid, updatedB);
      } catch (err) {
        console.warn('Firestore reorder error:', err);
      }
    }
  };

  const handleMoveDown = async (id: string) => {
    const currentList = [...filteredItems];
    const idx = currentList.findIndex((i) => i.id === id);
    if (idx < 0 || idx >= currentList.length - 1) return;

    // Assign customOrder to ALL items first (normalize), then swap
    const now = new Date().toISOString();
    const normalized = currentList.map((item, i) => ({
      ...item,
      customOrder: i + 1,
    }));

    // Swap positions idx and idx+1
    const temp = normalized[idx].customOrder;
    normalized[idx] = { ...normalized[idx], customOrder: normalized[idx + 1].customOrder, updatedAt: now };
    normalized[idx + 1] = { ...normalized[idx + 1], customOrder: temp, updatedAt: now };

    const updatedA = normalized[idx];
    const updatedB = normalized[idx + 1];

    setItems((prev) =>
      prev.map((i) => {
        const found = normalized.find((n) => n.id === i.id);
        return found ? { ...i, customOrder: found.customOrder, updatedAt: found.updatedAt } : i;
      })
    );

    if (filter.sortBy !== 'customOrder') {
      setFilter((f) => ({ ...f, sortBy: 'customOrder', sortOrder: 'asc' }));
    }

    if (user) {
      try {
        await saveWatchlistItemToFirestore(user.uid, updatedA);
        await saveWatchlistItemToFirestore(user.uid, updatedB);
      } catch (err) {
        console.warn('Firestore reorder error:', err);
      }
    }
  };

  const handleResetData = () => {
    if (confirm('Kosongkan semua daftar Anime & Manga?')) {
      setItems([]);
    }
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

      // Kalkulasi sisa: hanya untuk yang belum selesai (bukan completed/dropped)
      if (item.status !== 'completed' && item.status !== 'dropped') {
        const remainingEpisodes = Math.max(0, item.progress.totalEpisodes - item.progress.currentEpisode);
        if (item.type === 'anime') {
          const episodeRuntime = item.runtimeMinutes || 24;
          let itemRemainingMins = remainingEpisodes * episodeRuntime;

          // Deduct partial watched minutes within current episode if timer mark is set
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

  const renderPagination = (position: 'top' | 'bottom') => {
    if (!isPaginationActive || isExporting) return null;

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

  const profileStats = useMemo(() => {
    let animeCount = 0;
    let mangaCount = 0;
    items.forEach((item) => {
      if (item.type === 'anime') animeCount++;
      else if (item.type === 'manga') mangaCount++;
    });
    return {
      animeCount,
      mangaCount,
      watchingCount: stats.watchingCount,
      completedCount: stats.completedCount,
    };
  }, [items, stats]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)', color: 'var(--text-muted)' }}>
        <span>Memuat aplikasi...</span>
      </div>
    );
  }

  // 1. GUEST UNAUTHENTICATED VIEW: Fullscreen Animated Environment Landing (No Top Bar/Header/Filters)
  if (!user) {
    return (
      <>
        <CursorTrail />
        <WelcomeHero onOpenAuthModal={(mode) => handleOpenAuthModal(mode || 'login')} />
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          initialTab={authModalMode}
        />
      </>
    );
  }

  // 2. LOGGED-IN AUTHENTICATED VIEW: Full App Shell + Navbar + Stats + Watchlist Table
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <CursorTrail />
      <AnimatedBackground />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header
          filter={filter}
          onFilterChange={handleFilterChange}
          onOpenAddModal={() => {
            setEditingItem(null);
            setIsMediaModalOpen(true);
          }}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          totalCount={items.length}
          stats={profileStats}
          saveStatus={saveStatus}
          onToggleFriendsPanel={() => setIsOpenMobileFriends((prev) => !prev)}
          hasPendingInvitations={incomingRequests.length > 0}
        />

        {/* Main Content Area (Centred in viewport) */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>
          {/* Centering container - export div shrinks to content during export */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div
              ref={exportRef as React.RefObject<HTMLDivElement>}
              style={{
                background: 'transparent',
                padding: '20px 3px 3px',
                width: '100%',
              }}
            >
              <StatsDashboard
                stats={stats}
                activeStatusFilter={filter.status}
                onSelectStatus={(status) => handleFilterChange({ status })}
                onExportPNG={handleExportPNG}
                isExporting={isExporting}
              />

              <main 
                style={{ 
                  maxWidth: '1200px', 
                  width: '100%', 
                  margin: '0 auto',
                  padding: '0 16px 0',
                  background: 'transparent'
                }}
              >
                {filteredItems.length > 0 ? (
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
                            activeBgPickerId={activeBgPickerId}
                            onToggleBgPicker={(id) => setActiveBgPickerId((prev) => (prev === id ? null : id))}
                            onCloseBgPicker={() => setActiveBgPickerId(null)}
                            onUpdateStatus={handleUpdateStatus}
                            onIncrementEpisode={handleIncrementEpisode}
                            onDecrementEpisode={handleDecrementEpisode}
                            onToggleFavorite={handleToggleFavorite}
                            onRateItem={handleRateItem}
                            onEditItem={(itemToEdit) => {
                              setEditingItem(itemToEdit);
                              setIsMediaModalOpen(true);
                            }}
                            onDeleteItem={handleDeleteItem}
                            onUpdateTimestamp={handleUpdateTimestamp}
                            onUpdateBannerPosition={handleUpdateBannerPosition}
                            totalItems={filteredItems.length}
                            onMoveUp={handleMoveUp}
                            onMoveDown={handleMoveDown}
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
                    <h3 style={{ fontSize: '1rem', color: '#fff', marginBottom: '4px' }}>Tidak ada judul ditemukan</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '16px' }}>
                      Coba sesuaikan kata kunci pencarian atau filter yang digunakan.
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
              </main>
            </div>
          </div>

          <footer style={{
            margin: '40px auto 0',
            maxWidth: '1200px',
            width: '100%',
            padding: '20px 16px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: 'var(--text-muted)',
            fontSize: '0.8rem'
          }}>
            <div>Anime &amp; Manga List Tracker &bull; Firebase Auth &amp; Firestore Enabled</div>
            <button
              onClick={handleResetData}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.78rem' }}
            >
              Reset Sample Data
            </button>
          </footer>
        </div>

        {/* Floating Right Sidebar: Friends Panel */}
        <FriendsPanel
          user={user}
          isOpen={isOpenMobileFriends}
          onClose={() => setIsOpenMobileFriends(false)}
          onSelectFriend={(friend) => setSelectedFriendForProfile(friend)}
        />
      </div>

      <ErrorBoundary>
        <MediaModal
          isOpen={isMediaModalOpen}
          onClose={() => {
            setIsMediaModalOpen(false);
            setEditingItem(null);
          }}
          onSave={handleSaveItem}
          editingItem={editingItem}
        />
      </ErrorBoundary>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialTab={authModalMode}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />

      {/* Modals */}
      <FriendProfileModal
        friend={selectedFriendForProfile}
        isOpen={!!selectedFriendForProfile}
        onClose={() => setSelectedFriendForProfile(null)}
        onInspect={(friend) => setSelectedFriendForInspect(friend)}
      />

      <InspectWatchlistModal
        friend={selectedFriendForInspect}
        isOpen={!!selectedFriendForInspect}
        onClose={() => setSelectedFriendForInspect(null)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
};

export default App;
