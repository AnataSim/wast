import React, { useState, useEffect } from 'react';
import { X, Film, BookOpen, Star, AlertCircle } from 'lucide-react';
import { fetchFriendWatchlist, type FriendUser } from '../services/friendService';
import type { WatchlistItem } from '../types/watchlist';

interface InspectWatchlistModalProps {
  friend: FriendUser | null;
  isOpen: boolean;
  onClose: () => void;
}

export const InspectWatchlistModal: React.FC<InspectWatchlistModalProps> = ({
  friend,
  isOpen,
  onClose,
}) => {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && friend) {
      setLoading(true);
      fetchFriendWatchlist(friend.uid)
        .then((data) => setItems(data))
        .catch((err) => console.warn('Gagal memuat list teman:', err))
        .finally(() => setLoading(false));
    } else {
      setItems([]);
    }
  }, [isOpen, friend]);

  if (!isOpen || !friend) return null;

  const username = friend.username || 'User';

  const getStatusBadge = (status: string, type: 'anime' | 'manga') => {
    switch (status) {
      case 'watching':
        return { label: type === 'anime' ? 'Watching' : 'Reading', bg: 'rgba(59, 130, 246, 0.18)', border: 'rgba(59, 130, 246, 0.4)', color: '#60a5fa' };
      case 'completed':
        return { label: 'Completed', bg: 'rgba(34, 197, 94, 0.18)', border: 'rgba(34, 197, 94, 0.4)', color: '#4ade80' };
      case 'plan_to_watch':
        return { label: type === 'anime' ? 'Plan to Watch' : 'Plan to Read', bg: 'rgba(234, 179, 8, 0.18)', border: 'rgba(234, 179, 8, 0.4)', color: '#facc15' };
      case 'on_hold':
        return { label: 'On Hold', bg: 'rgba(168, 85, 247, 0.18)', border: 'rgba(168, 85, 247, 0.4)', color: '#c084fc' };
      case 'dropped':
        return { label: 'Dropped', bg: 'rgba(239, 68, 68, 0.18)', border: 'rgba(239, 68, 68, 0.4)', color: '#f87171' };
      default:
        return { label: status, bg: 'rgba(255, 255, 255, 0.1)', border: 'rgba(255, 255, 255, 0.2)', color: '#fff' };
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 5500,
        background: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 16px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '940px',
          maxHeight: '90vh',
          background: '#0a0e17',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '20px',
          boxShadow: '0 28px 70px rgba(0, 0, 0, 0.9), 0 0 35px rgba(59, 130, 246, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header: Replacement for Search/Filter -> "Username's Boothlisted" */}
        <div
          style={{
            padding: '20px 24px',
            background: '#0d1322',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {friend.photoURL ? (
              <img
                src={friend.photoURL}
                alt={username}
                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #3b82f6' }}
              />
            ) : (
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 800,
                }}
              >
                {username.charAt(0).toUpperCase()}
              </div>
            )}

            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '0.3px' }}>
                {username}&apos;s Boothlisted
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                Mode Inspect &bull; Hanya dapat melihat ({items.length} judul)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              padding: '6px',
              color: 'rgba(255, 255, 255, 0.7)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* List Content Area */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
              <span>Memuat koleksi {username}...</span>
            </div>
          ) : items.length === 0 ? (
            <div
              style={{
                padding: '50px 20px',
                textAlign: 'center',
                background: '#0d1322',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '14px',
              }}
            >
              <AlertCircle size={32} color="var(--text-muted)" style={{ marginBottom: '10px' }} />
              <h4 style={{ color: '#fff', fontSize: '1rem', margin: '0 0 4px' }}>Daftar Kosong</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: 0 }}>
                {username} belum menambahkan judul Anime atau Manga ke dalam daftar.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {items.map((item, idx) => {
                const badge = getStatusBadge(item.status, item.type);
                const isAnime = item.type === 'anime';

                return (
                  <div
                    key={item.id}
                    className="list-row"
                    style={{
                      background: item.posterUrl ? `linear-gradient(90deg, rgba(13, 19, 34, 0.95) 0%, rgba(13, 19, 34, 0.82) 100%), url(${item.posterUrl}) center/cover no-repeat` : '#0d1322',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '14px',
                      padding: '14px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      boxShadow: '0 6px 20px rgba(0, 0, 0, 0.4)',
                    }}
                  >
                    {/* Index Number */}
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', width: '32px' }}>
                      #{idx + 1}
                    </div>

                    {/* Icon Type */}
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: isAnime ? 'rgba(59, 130, 246, 0.2)' : 'rgba(192, 132, 252, 0.2)',
                        border: isAnime ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid rgba(192, 132, 252, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isAnime ? '#60a5fa' : '#c084fc',
                        flexShrink: 0,
                      }}
                    >
                      {isAnime ? <Film size={18} /> : <BookOpen size={18} />}
                    </div>

                    {/* Main Title, Original Title, Year, Genres */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.title}
                        </h4>
                        {item.releaseYear && (
                          <span style={{ fontSize: '0.75rem', color: '#60a5fa', fontWeight: 600 }}>
                            ({item.releaseYear})
                          </span>
                        )}
                      </div>

                      {item.originalTitle && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0', fontStyle: 'italic' }}>
                          {item.originalTitle}
                        </p>
                      )}

                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                        {item.genres?.map((g) => (
                          <span
                            key={g}
                            style={{
                              fontSize: '0.68rem',
                              background: 'rgba(255, 255, 255, 0.06)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              color: 'rgba(255, 255, 255, 0.7)',
                              padding: '2px 8px',
                              borderRadius: '12px',
                            }}
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Progress Info (Read Only) */}
                    <div style={{ textAlign: 'center', padding: '0 12px', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff' }}>
                        {isAnime ? 'Eps' : 'Ch.'} {item.progress.currentEpisode} / {item.progress.totalEpisodes}
                      </div>
                      {(item.progress.lastTimestamp || item.progress.lastPage) && (
                        <div style={{ fontSize: '0.72rem', color: '#38bdf8', marginTop: '2px' }}>
                          {item.progress.lastTimestamp ? `⏱ ${item.progress.lastTimestamp}` : `📖 Hal. ${item.progress.lastPage}`}
                        </div>
                      )}
                    </div>

                    {/* Rating (Read Only) */}
                    <div style={{ textAlign: 'center', padding: '0 12px', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center', color: item.rating ? '#facc15' : 'var(--text-muted)', fontWeight: 700, fontSize: '0.85rem' }}>
                        <Star size={14} fill={item.rating ? '#facc15' : 'none'} />
                        {item.rating ? item.rating.toFixed(1) : '-'}
                      </div>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Score</span>
                    </div>

                    {/* Read-Only Status Badge */}
                    <div style={{ borderLeft: '1px solid rgba(255,255,255,0.06)', paddingLeft: '12px' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '6px 14px',
                          borderRadius: '20px',
                          background: badge.bg,
                          border: `1px solid ${badge.border}`,
                          color: badge.color,
                          display: 'inline-block',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {badge.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
