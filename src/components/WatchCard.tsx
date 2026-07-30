import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, 
  Plus, 
  Minus,
  Check, 
  Edit3, 
  Trash2,
  Clapperboard,
  BookOpen,
  Clock,
  Link as LinkIcon,
  BookMarked,
  ChevronUp,
  ChevronDown,
  Image as ImageIcon
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { WatchlistItem, WatchStatus, TimestampData } from '../types/watchlist';

interface WatchCardProps {
  item: WatchlistItem;
  index: number;
  totalItems?: number;
  onUpdateStatus: (id: string, newStatus: WatchStatus) => void;
  onIncrementEpisode: (id: string) => void;
  onDecrementEpisode?: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onRateItem: (id: string, rating: number) => void;
  onEditItem: (item: WatchlistItem) => void;
  onDeleteItem: (id: string) => void;
  onUpdateTimestamp?: (id: string, timeObj?: TimestampData, rawStr?: string, pageNum?: number) => void;
  onUpdateBannerPosition?: (id: string, bannerPositionY: number) => void;
  onMoveUp?: (id: string) => void;
  onMoveDown?: (id: string) => void;
  activeBgPickerId?: string | null;
  onToggleBgPicker?: (id: string) => void;
  onCloseBgPicker?: () => void;
}

export const WatchCard: React.FC<WatchCardProps> = ({
  item,
  index,
  totalItems,
  onUpdateStatus,
  onIncrementEpisode,
  onDecrementEpisode,
  onToggleFavorite,
  onRateItem,
  onEditItem,
  onDeleteItem,
  onUpdateTimestamp,
  onUpdateBannerPosition,
  onMoveUp,
  onMoveDown,
  activeBgPickerId,
  onToggleBgPicker,
  onCloseBgPicker,
}) => {
  const [isCardHovered, setIsCardHovered] = useState(false);
  const isPickerOpen = activeBgPickerId === item.id;
  const pickerRef = useRef<HTMLDivElement>(null);
  const pickerButtonRef = useRef<HTMLButtonElement>(null);

  // Close picker popover when user clicks outside
  useEffect(() => {
    if (!isPickerOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        pickerRef.current && 
        !pickerRef.current.contains(e.target as Node) &&
        pickerButtonRef.current && 
        !pickerButtonRef.current.contains(e.target as Node)
      ) {
        if (onCloseBgPicker) onCloseBgPicker();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPickerOpen, onCloseBgPicker]);
  const isAnime = item.type === 'anime';
  const unitLabel = isAnime ? 'Eps' : 'Ch.';

  // Anime Timestamp States (Hr, M, S)
  const [isEditingProgressMark, setIsEditingProgressMark] = useState(false);
  const [hrInput, setHrInput] = useState<string | number>(item.progress.lastTimeObj?.hours || 0);
  const [mInput, setMInput] = useState<string | number>(item.progress.lastTimeObj?.minutes || 0);
  const [sInput, setSInput] = useState<string | number>(item.progress.lastTimeObj?.seconds || 0);

  // Manga Page State (Integer)
  const [pageInput, setPageInput] = useState<string | number>(item.progress.lastPage || 0);

  const getGradeBadgeStyle = (status: WatchStatus) => {
    switch (status) {
      case 'completed': return { bg: 'rgba(34, 197, 94, 0.25)', color: '#22c55e' };
      case 'watching':
      case 'reading': return { bg: 'rgba(56, 189, 248, 0.25)', color: '#38bdf8' };
      case 'plan_to_watch': return { bg: 'rgba(234, 179, 8, 0.25)', color: '#eab308' };
      case 'on_hold': return { bg: 'rgba(249, 115, 22, 0.25)', color: '#f97316' };
      case 'dropped': return { bg: 'rgba(239, 68, 68, 0.25)', color: '#ef4444' };
    }
  };

  const handleQuickProgress = () => {
    const nextEp = item.progress.currentEpisode + 1;
    onIncrementEpisode(item.id);
    
    if (nextEp >= item.progress.totalEpisodes) {
      confetti({ particleCount: 60, spread: 50, origin: { y: 0.7 } });
    }
  };

  const handleDecrementProgress = () => {
    if (onDecrementEpisode && item.progress.currentEpisode > 0) {
      onDecrementEpisode(item.id);
    }
  };

  const handleSaveProgressMark = () => {
    setIsEditingProgressMark(false);
    if (!onUpdateTimestamp) return;

    if (isAnime) {
      const h = Math.max(0, parseInt(String(hrInput), 10) || 0);
      const m = Math.max(0, parseInt(String(mInput), 10) || 0);
      const s = Math.max(0, parseInt(String(sInput), 10) || 0);
      
      const mm = String(m).padStart(2, '0');
      const ss = String(s).padStart(2, '0');
      const formattedStr = h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;

      onUpdateTimestamp(item.id, { hours: h, minutes: m, seconds: s }, formattedStr, undefined);
    } else {
      const pg = Math.max(0, parseInt(String(pageInput), 10) || 0);
      onUpdateTimestamp(item.id, undefined, pg > 0 ? `Hal. ${pg}` : undefined, pg);
    }
  };

  // Helper formatting for Anime timestamp
  // Returns null if time is 0:00:00 (not yet set) so default label is shown
  const getFormattedAnimeTime = () => {
    const obj = item.progress.lastTimeObj;
    if (obj) {
      const { hours, minutes, seconds } = obj;
      // Treat all-zero as "not set" — same as manga's lastPage = 0
      if (hours === 0 && minutes === 0 && seconds === 0) return null;
      const mm = String(minutes).padStart(2, '0');
      const ss = String(seconds).padStart(2, '0');
      if (hours > 0) {
        return `${hours}:${mm}:${ss}`;
      }
      return `${minutes}:${ss}`; // e.g. 24:00 or 7:20
    }
    if (item.progress.lastTimestamp && item.progress.lastTimestamp !== '0:00') return item.progress.lastTimestamp;
    return null;
  };

  const formattedTimeStr = getFormattedAnimeTime();
  const grade = getGradeBadgeStyle(item.status);
  const isCompleted = item.status === 'completed';
  const progressPercent = item.progress.totalEpisodes > 0 
    ? Math.min(100, Math.round((item.progress.currentEpisode / item.progress.totalEpisodes) * 100))
    : 0;

  const bgImage = item.bannerUrl || item.posterUrl;

  const handleOpenLink = () => {
    if (item.linkUrl) {
      window.open(item.linkUrl, '_blank', 'noopener,noreferrer');
    } else {
      onEditItem(item);
    }
  };

  return (
    <div
      className="card-item-wrapper"
      onMouseEnter={() => setIsCardHovered(true)}
      onMouseLeave={() => setIsCardHovered(false)}
      style={{ 
        position: 'relative', 
        paddingRight: '32px', 
        marginRight: '-32px',
        zIndex: isPickerOpen ? 100 : isCardHovered ? 10 : 1 
      }}
    >
    <div 
      className="list-row mobile-list-row" 
      style={{ 
        position: 'relative',
        zIndex: isPickerOpen ? 100 : isCardHovered ? 10 : 1,
        backgroundImage: `linear-gradient(90deg, rgba(8, 12, 20, 0.90) 0%, rgba(12, 18, 30, 0.78) 55%, rgba(15, 23, 42, 0.35) 100%), url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: `center ${item.bannerPositionY ?? 45}%`,
        backgroundRepeat: 'no-repeat',
        imageRendering: '-webkit-optimize-contrast',
        filter: 'contrast(1.12) saturate(1.15) brightness(0.95)',
        WebkitFilter: 'contrast(1.12) saturate(1.15) brightness(0.95)',
        padding: '14px 20px',
        overflow: 'visible',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4)'
      }}
    >
      {/* Rank Index (#1, #2) */}
      <span className="rank-badge" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
        #{index + 1}
      </span>

      {/* Media Type Logo Icon Badge (Replaces Grade 'P' Letter) */}
      <div 
        className="grade-badge"
        title={`${isAnime ? 'Anime' : 'Manga'} - ${(item.status || 'watching').toUpperCase()}`}
        style={{ 
          background: grade.bg, 
          color: grade.color, 
          border: `1px solid ${grade.color}`, 
          boxShadow: `0 0 10px ${grade.color}40`,
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6px'
        }}
      >
        {isAnime ? (
          <Clapperboard size={16} color={grade.color} />
        ) : (
          <BookOpen size={16} color={grade.color} />
        )}
      </div>

      {/* Title & Subtitle Center Content */}
      <div className="card-info-main" style={{ flex: 1, minWidth: 0, zIndex: 2 }}>
        {/* Line 1: Main Title + (Release Year) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textShadow: '0 2px 8px rgba(0, 0, 0, 0.9)' }}>
            {item.title}
          </h3>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent-cyan)', opacity: 0.95, textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>
            ({item.releaseYear})
          </span>
          {item.favorite && (
            <Heart size={13} fill="hsl(340, 82%, 60%)" color="hsl(340, 82%, 60%)" style={{ flexShrink: 0 }} />
          )}
        </div>

        {/* Line 2: Japanese Romaji Subtitle + Genres */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'rgba(241, 245, 249, 0.8)', textShadow: '0 1px 4px rgba(0,0,0,0.9)', flexWrap: 'nowrap', overflow: 'hidden' }}>
          {item.originalTitle && (
            <>
              <span style={{ fontStyle: 'italic', color: 'var(--text-secondary)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flexShrink: 1, minWidth: 0, maxWidth: '240px' }}>
                {item.originalTitle}
              </span>
              <span style={{ flexShrink: 0 }}>•</span>
            </>
          )}
          <span style={{ fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0 }}>
            {(Array.isArray(item.genres) ? item.genres : []).slice(0, 3).join(', ')}
          </span>
        </div>
      </div>

      {/* Right Content Section: Link, Progress, Rating, Status & Actions (Total Width: 495px) */}
      <div className="card-right-controls" style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0, zIndex: 2 }}>
        
        {/* 1. Fixed Width Link Column (40px) */}
        <div style={{ width: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
          <button
            onClick={handleOpenLink}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              background: item.linkUrl ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255, 255, 255, 0.07)',
              color: item.linkUrl ? 'var(--accent-cyan)' : 'rgba(255, 255, 255, 0.4)',
              border: item.linkUrl ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid rgba(255, 255, 255, 0.12)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title={item.linkUrl ? `Buka link ${isAnime ? 'nonton' : 'baca'}: ${item.linkUrl}` : `Tambah link ${isAnime ? 'nonton' : 'baca'}`}
          >
            <LinkIcon size={14} />
          </button>
        </div>

        {/* 2. Fixed Width Progress Column (130px) */}
        <div style={{ textAlign: 'right', width: '130px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>
              {unitLabel} {item.progress.currentEpisode} / {item.progress.totalEpisodes}
            </span>
          </div>

          <div style={{ width: '110px', height: '4px', background: 'rgba(255, 255, 255, 0.15)', borderRadius: '2px', overflow: 'hidden', marginTop: '4px', marginLeft: 'auto' }}>
            <div style={{ width: `${progressPercent}%`, height: '100%', background: isCompleted ? '#22c55e' : 'var(--accent-blue)', borderRadius: '2px', boxShadow: isCompleted ? '0 0 8px #22c55e' : '0 0 8px #3b82f6' }} />
          </div>

          {/* Editable Progress Mark (Anime Hr:M:S vs Manga Page) */}
          <div style={{ marginTop: '4px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', position: 'relative' }}>
            {isEditingProgressMark ? (
              <div 
                style={{ 
                  display: 'flex', 
                  gap: '2px', 
                  alignItems: 'center',
                  background: 'rgba(10, 14, 23, 0.95)',
                  border: '1px solid var(--accent-blue)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '3px 5px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.6)',
                  backdropFilter: 'blur(8px)',
                  zIndex: 30
                }} 
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget)) {
                    handleSaveProgressMark();
                  }
                }}
              >
                {isAnime ? (
                  <>
                    <input
                      type="number"
                      min="0"
                      placeholder="hr"
                      value={hrInput}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setHrInput(e.target.value.replace(/^0+(?=\d)/, ''))}
                      style={{ width: '28px', height: '24px', fontSize: '0.78rem', fontWeight: 600, padding: '1px 2px', background: '#0d1320', border: '1px solid var(--accent-blue)', color: '#fff', borderRadius: '3px', textAlign: 'center' }}
                      title="Jam (hr)"
                    />
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>:</span>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      placeholder="m"
                      value={mInput}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setMInput(e.target.value.replace(/^0+(?=\d)/, ''))}
                      style={{ width: '28px', height: '24px', fontSize: '0.78rem', fontWeight: 600, padding: '1px 2px', background: '#0d1320', border: '1px solid var(--accent-blue)', color: '#fff', borderRadius: '3px', textAlign: 'center' }}
                      title="Menit (m)"
                    />
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>:</span>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      placeholder="s"
                      value={sInput}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setSInput(e.target.value.replace(/^0+(?=\d)/, ''))}
                      style={{ width: '28px', height: '24px', fontSize: '0.78rem', fontWeight: 600, padding: '1px 2px', background: '#0d1320', border: '1px solid var(--accent-blue)', color: '#fff', borderRadius: '3px', textAlign: 'center' }}
                      title="Detik (s)"
                    />
                  </>
                ) : (
                  <input
                    type="number"
                    min="0"
                    placeholder="Hal"
                    value={pageInput}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setPageInput(e.target.value.replace(/^0+(?=\d)/, ''))}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveProgressMark(); }}
                    style={{ width: '55px', height: '24px', fontSize: '0.78rem', fontWeight: 600, padding: '1px 4px', background: '#0d1320', border: '1px solid #c084fc', color: '#fff', borderRadius: '3px', textAlign: 'center' }}
                    title="Nomor Halaman (Integer)"
                  />
                )}
                <button 
                  type="button" 
                  onClick={handleSaveProgressMark} 
                  style={{ background: 'var(--accent-blue)', border: 'none', color: '#fff', borderRadius: '3px', padding: '1px 6px', height: '24px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  OK
                </button>
              </div>
            ) : (
              <span
                onClick={() => setIsEditingProgressMark(true)}
                title={isAnime ? 'Klik untuk set Jam : Menit : Detik' : 'Klik untuk set Nomor Halaman'}
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: (isAnime ? formattedTimeStr : item.progress.lastPage) ? (isAnime ? 'var(--accent-cyan)' : '#c084fc') : 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  background: 'rgba(15, 23, 42, 0.7)',
                  padding: '1px 6px',
                  borderRadius: '3px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                {isAnime ? <Clock size={11} /> : <BookMarked size={11} />}
                {isAnime 
                  ? (formattedTimeStr || '+ Timer')
                  : (item.progress.lastPage ? `Hal. ${item.progress.lastPage}` : '+ Halaman')
                }
              </span>
            )}
          </div>
        </div>

        {/* 3. Fixed Width Rating Score Column (85px) */}
        <div style={{ textAlign: 'right', width: '85px', flexShrink: 0 }}>
          <div className="score-text" style={{ fontSize: '0.95rem', textShadow: '0 0 10px rgba(56, 189, 248, 0.4)' }}>
            {item.rating ? `${item.rating}.0 / 10` : '-'}
          </div>
          <select
            value={item.rating || ''}
            onChange={(e) => onRateItem(item.id, Number(e.target.value))}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: '0.72rem', cursor: 'pointer', outline: 'none' }}
          >
            <option value="" style={{ background: '#0d1320' }}>Rate...</option>
            {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={r} style={{ background: '#0d1320' }}>⭐ {r}/10</option>
            ))}
          </select>
        </div>

        {/* 4. Fixed Width Status Dropdown Column (130px) */}
        <div style={{ width: '130px', flexShrink: 0 }}>
          <select
            value={item.status}
            onChange={(e) => onUpdateStatus(item.id, e.target.value as WatchStatus)}
            style={{
              width: '100%',
              background: 'rgba(15, 23, 42, 0.85)',
              border: `1px solid ${grade.color}80`,
              borderRadius: 'var(--radius-sm)',
              color: grade.color,
              fontWeight: 700,
              fontSize: '0.78rem',
              padding: '5px 8px',
              cursor: 'pointer',
              outline: 'none',
              backdropFilter: 'blur(6px)',
              textOverflow: 'ellipsis'
            }}
          >
            <option value="watching" style={{ background: '#0d1320', color: '#fff' }}>{isAnime ? 'Watching' : 'Reading'}</option>
            <option value="completed" style={{ background: '#0d1320', color: '#fff' }}>Completed</option>
            <option value="plan_to_watch" style={{ background: '#0d1320', color: '#fff' }}>{isAnime ? 'Plan to Watch' : 'Plan to Read'}</option>
            <option value="on_hold" style={{ background: '#0d1320', color: '#fff' }}>On Hold</option>
            <option value="dropped" style={{ background: '#0d1320', color: '#fff' }}>Dropped</option>
          </select>
        </div>

        {/* 5. Action Buttons Column (Flexible width to fit all 5 action buttons) */}
        <div style={{ minWidth: '145px', display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'flex-end', flexShrink: 0, position: 'relative' }}>
          {item.progress.currentEpisode === 0 ? (
            <button
              onClick={handleQuickProgress}
              disabled={isCompleted}
              style={{
                width: '36px',
                height: '24px',
                background: isCompleted ? 'rgba(255, 255, 255, 0.08)' : 'rgba(59, 130, 246, 0.28)',
                border: isCompleted ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(59, 130, 246, 0.4)',
                color: '#fff',
                borderRadius: 'var(--radius-sm)',
                cursor: isCompleted ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: isCompleted ? 0.5 : 1,
                transition: 'all 0.15s ease'
              }}
              title={`+1 ${unitLabel}`}
            >
              {isCompleted ? <Check size={13} color="#22c55e" /> : <Plus size={13} />}
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'center' }}>
              <button
                onClick={handleQuickProgress}
                disabled={isCompleted}
                style={{
                  width: '36px',
                  height: '24px',
                  background: isCompleted ? 'rgba(255, 255, 255, 0.08)' : 'rgba(59, 130, 246, 0.28)',
                  border: isCompleted ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(59, 130, 246, 0.4)',
                  color: '#fff',
                  borderRadius: 'var(--radius-sm)',
                  cursor: isCompleted ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: isCompleted ? 0.5 : 1,
                  transition: 'all 0.15s ease'
                }}
                title={`+1 ${unitLabel}`}
              >
                {isCompleted ? <Check size={13} color="#22c55e" /> : <Plus size={13} />}
              </button>

              <button
                onClick={handleDecrementProgress}
                disabled={item.progress.currentEpisode <= 0}
                style={{
                  width: '36px',
                  height: '24px',
                  background: 'rgba(239, 68, 68, 0.22)',
                  border: '1px solid rgba(239, 68, 68, 0.45)',
                  color: '#f87171',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease'
                }}
                title={`-1 ${unitLabel} (Kurangi)`}
              >
                <Minus size={13} />
              </button>
            </div>
          )}

          <button
            onClick={() => onToggleFavorite(item.id)}
            style={{ background: 'none', border: 'none', color: item.favorite ? 'hsl(340, 82%, 60%)' : 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: '4px' }}
            title="Favorit"
          >
            <Heart size={15} fill={item.favorite ? 'currentColor' : 'none'} />
          </button>

          <button
            ref={pickerButtonRef}
            onClick={() => onToggleBgPicker && onToggleBgPicker(item.id)}
            style={{ background: 'none', border: 'none', color: isPickerOpen ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: '4px' }}
            title="Atur Posisi Background Image (Y-Axis)"
          >
            <ImageIcon size={15} />
          </button>

          {/* Quick Background Position Slider Popover */}
          {isPickerOpen && (
            <div 
              ref={pickerRef}
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'absolute',
                right: '40px',
                top: '52px',
                background: 'rgba(10, 14, 23, 0.95)',
                border: '1px solid var(--accent-cyan)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 12px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.8)',
                backdropFilter: 'blur(12px)',
                zIndex: 200,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '220px'
              }}
            >
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>BG Y:</span>
              <input
                type="range"
                min={0}
                max={100}
                value={item.bannerPositionY ?? 45}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (onUpdateBannerPosition) {
                    onUpdateBannerPosition(item.id, val);
                  }
                }}
                style={{ flex: 1, accentColor: 'var(--accent-cyan)', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', fontWeight: 700, minWidth: '34px', textAlign: 'right' }}>
                {item.bannerPositionY ?? 45}%
              </span>
            </div>
          )}

          <button
            onClick={() => onEditItem(item)}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: '4px' }}
            title="Edit"
          >
            <Edit3 size={15} />
          </button>

          <button
            onClick={() => onDeleteItem(item.id)}
            style={{ background: 'none', border: 'none', color: 'var(--status-dropped)', cursor: 'pointer', padding: '4px' }}
            title="Hapus"
          >
            <Trash2 size={15} />
          </button>

          {/* Reorder Up / Down Chevron Buttons (Floating Outside Card Bar on Right) */}
          <div style={{
            position: 'absolute',
            right: '-24px',
            top: '50%',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            opacity: isCardHovered ? 1 : 0,
            transform: isCardHovered ? 'translateY(-50%) translateX(0)' : 'translateY(-50%) translateX(-4px)',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            pointerEvents: isCardHovered ? 'auto' : 'none',
            zIndex: 10
          }}>
            <button
              onClick={() => onMoveUp && onMoveUp(item.id)}
              disabled={index === 0}
              style={{
                background: 'none',
                border: 'none',
                color: index === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.7)',
                cursor: index === 0 ? 'default' : 'pointer',
                padding: '1px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Geser Urutan Naik (#Up)"
            >
              <ChevronUp size={14} />
            </button>
            <button
              onClick={() => onMoveDown && onMoveDown(item.id)}
              disabled={totalItems !== undefined && index === totalItems - 1}
              style={{
                background: 'none',
                border: 'none',
                color: (totalItems !== undefined && index === totalItems - 1) ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.7)',
                cursor: (totalItems !== undefined && index === totalItems - 1) ? 'default' : 'pointer',
                padding: '1px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Geser Urutan Turun (#Down)"
            >
              <ChevronDown size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};
