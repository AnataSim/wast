import React from 'react';
import type { WatchlistItem, WatchStatus } from '../types/watchlist';
import { Star, Plus, Minus, Heart, Trash2, Edit3, Film, BookOpen, Clock, BookMarked, ExternalLink } from 'lucide-react';

interface GridShowcaseProps {
  items: WatchlistItem[];
  onIncrementEpisode: (id: string) => void;
  onDecrementEpisode: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onEditItem: (item: WatchlistItem) => void;
  onUpdateStatus: (id: string, newStatus: WatchStatus) => void;
}

export const GridShowcase: React.FC<GridShowcaseProps> = ({
  items,
  onIncrementEpisode,
  onDecrementEpisode,
  onToggleFavorite,
  onDeleteItem,
  onEditItem,
  onUpdateStatus,
}) => {
  if (items.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px dashed var(--border-subtle)',
          color: 'var(--text-muted)',
        }}
      >
        <Film size={40} style={{ opacity: 0.4, marginBottom: '12px' }} />
        <p>Tidak ada judul anime atau manga yang sesuai dengan filter.</p>
      </div>
    );
  }

  const getStatusBadge = (status: WatchStatus, type: 'anime' | 'manga') => {
    switch (status) {
      case 'watching':
        return { label: type === 'anime' ? 'Watching' : 'Reading', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)' };
      case 'completed':
        return { label: 'Completed', color: '#4ade80', bg: 'rgba(74, 222, 128, 0.15)' };
      case 'plan_to_watch':
        return { label: type === 'anime' ? 'Plan to Watch' : 'Plan to Read', color: '#facc15', bg: 'rgba(250, 204, 21, 0.15)' };
      case 'on_hold':
        return { label: 'On Hold', color: '#fb923c', bg: 'rgba(251, 146, 60, 0.15)' };
      case 'dropped':
        return { label: 'Dropped', color: '#f87171', bg: 'rgba(248, 113, 113, 0.15)' };
      default:
        return { label: status, color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)' };
    }
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: '20px',
        margin: '16px 0 24px',
      }}
    >
      {items.map((item) => {
        const badge = getStatusBadge(item.status, item.type);
        const progressPct =
          item.progress.totalEpisodes > 0
            ? Math.min(100, Math.round((item.progress.currentEpisode / item.progress.totalEpisodes) * 100))
            : 0;

        return (
          <div
            key={item.id}
            className="grid-3d-card"
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {/* Top Poster Image Area */}
            <div style={{ position: 'relative', height: '320px', overflow: 'hidden' }}>
              <img
                src={item.posterUrl}
                alt={item.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transition: 'transform 0.5s ease',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(10, 14, 23, 1) 0%, rgba(10, 14, 23, 0.3) 50%, transparent 100%)',
                }}
              />

              {/* Type Badge Top Left */}
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  background: 'rgba(10, 15, 29, 0.8)',
                  backdropFilter: 'blur(8px)',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                }}
              >
                {item.type === 'anime' ? <Film size={12} color="#38bdf8" /> : <BookOpen size={12} color="#c084fc" />}
                <span style={{ textTransform: 'capitalize' }}>{item.type}</span>
              </div>

              {/* Favorite Button Top Right */}
              <button
                onClick={() => onToggleFavorite(item.id)}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: item.favorite ? 'rgba(239, 68, 68, 0.25)' : 'rgba(10, 15, 29, 0.8)',
                  backdropFilter: 'blur(8px)',
                  border: item.favorite ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: item.favorite ? '#ef4444' : '#ffffff',
                  cursor: 'pointer',
                }}
              >
                <Heart size={16} fill={item.favorite ? '#ef4444' : 'none'} />
              </button>

              {/* Rating Star Badge */}
              {item.rating ? (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '12px',
                    left: '12px',
                    background: 'rgba(234, 179, 8, 0.2)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(234, 179, 8, 0.4)',
                    color: '#facc15',
                    padding: '3px 8px',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Star size={12} fill="#facc15" />
                  <span>{item.rating}/10</span>
                </div>
              ) : null}

              {/* Status Select Badge Dropdown */}
              <select
                value={item.status}
                onChange={(e) => onUpdateStatus(item.id, e.target.value as WatchStatus)}
                style={{
                  position: 'absolute',
                  bottom: '12px',
                  right: '12px',
                  background: badge.bg,
                  backdropFilter: 'blur(8px)',
                  border: `1px solid ${badge.color}`,
                  color: badge.color,
                  padding: '3px 8px',
                  borderRadius: '8px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="watching" style={{ background: '#0f172a', color: '#fff' }}>
                  {item.type === 'anime' ? 'Watching' : 'Reading'}
                </option>
                <option value="plan_to_watch" style={{ background: '#0f172a', color: '#fff' }}>
                  {item.type === 'anime' ? 'Plan to Watch' : 'Plan to Read'}
                </option>
                <option value="completed" style={{ background: '#0f172a', color: '#fff' }}>
                  Completed
                </option>
                <option value="on_hold" style={{ background: '#0f172a', color: '#fff' }}>
                  On Hold
                </option>
                <option value="dropped" style={{ background: '#0f172a', color: '#fff' }}>
                  Dropped
                </option>
              </select>
            </div>

            {/* Bottom Details Content Area */}
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
              <h3
                style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: '#ffffff',
                  marginBottom: '4px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={item.title}
              >
                {item.title}
              </h3>

              {item.originalTitle && (
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    marginBottom: '10px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {item.originalTitle}
                </div>
              )}

              {/* Progress Bar & Counter */}
              <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.78rem',
                    color: 'var(--text-secondary)',
                    marginBottom: '6px',
                    fontWeight: 600,
                  }}
                >
                  <span>
                    {item.type === 'anime' ? 'Episode' : 'Chapter'}: {item.progress.currentEpisode} / {item.progress.totalEpisodes}
                  </span>
                  <span style={{ color: 'var(--accent-cyan)' }}>{progressPct}%</span>
                </div>

                <div
                  style={{
                    height: '6px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    marginBottom: '12px',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${progressPct}%`,
                      background: 'linear-gradient(90deg, #3b82f6, #a855f7)',
                      borderRadius: '4px',
                    }}
                  />
                </div>

                {/* Anime: Timer tanda / Manga: Halaman tanda + link */}
                {item.type === 'anime' && item.progress.lastTimeObj && (
                  <div
                    style={{
                      fontSize: '0.72rem',
                      color: '#38bdf8',
                      background: 'rgba(56, 189, 248, 0.1)',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Clock size={11} />
                    <span style={{ flex: 1 }}>
                      Tanda: {String(item.progress.lastTimeObj.hours).padStart(2, '0')}:
                      {String(item.progress.lastTimeObj.minutes).padStart(2, '0')}:
                      {String(item.progress.lastTimeObj.seconds).padStart(2, '0')}
                    </span>
                    {item.linkUrl && (
                      <a
                        href={item.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Buka link nonton"
                        style={{
                          display: 'inline-flex', alignItems: 'center',
                          color: '#38bdf8', opacity: 0.8,
                          background: 'rgba(56,189,248,0.15)',
                          borderRadius: '4px', padding: '1px 4px',
                          flexShrink: 0,
                        }}
                      >
                        <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                )}
                {item.type === 'manga' && item.progress.lastPage && item.progress.lastPage > 0 && (
                  <div
                    style={{
                      fontSize: '0.72rem',
                      color: '#c084fc',
                      background: 'rgba(192, 132, 252, 0.1)',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      border: '1px solid rgba(192,132,252,0.2)',
                    }}
                  >
                    <BookMarked size={11} />
                    <span style={{ flex: 1 }}>Hal. {item.progress.lastPage}</span>
                    {item.linkUrl && (
                      <a
                        href={item.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Buka link baca"
                        style={{
                          display: 'inline-flex', alignItems: 'center',
                          color: '#c084fc', opacity: 0.8,
                          background: 'rgba(192,132,252,0.15)',
                          borderRadius: '4px', padding: '1px 4px',
                          flexShrink: 0,
                        }}
                      >
                        <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                )}

                {/* Bottom Quick Control Buttons */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '10px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  {/* Counter + / - Buttons */}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => onDecrementEpisode(item.id)}
                      disabled={item.progress.currentEpisode <= 0}
                      style={{
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-subtle)',
                        color: '#fff',
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: item.progress.currentEpisode <= 0 ? 'not-allowed' : 'pointer',
                        opacity: item.progress.currentEpisode <= 0 ? 0.4 : 1,
                      }}
                    >
                      <Minus size={14} />
                    </button>
                    <button
                      onClick={() => onIncrementEpisode(item.id)}
                      disabled={item.progress.currentEpisode >= item.progress.totalEpisodes}
                      style={{
                        background: 'var(--accent-blue)',
                        border: '1px solid var(--accent-blue)',
                        color: '#fff',
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: item.progress.currentEpisode >= item.progress.totalEpisodes ? 'not-allowed' : 'pointer',
                        opacity: item.progress.currentEpisode >= item.progress.totalEpisodes ? 0.4 : 1,
                      }}
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* Edit & Delete Action Buttons */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => onEditItem(item)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                      title="Edit Judul"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => onDeleteItem(item.id)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.12)',
                        border: 'none',
                        color: '#f87171',
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                      title="Hapus Judul"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
