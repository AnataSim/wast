import React from 'react';
import type { WatchlistItem, WatchStatus } from '../types/watchlist';
import { Plus, Minus, Edit3, Trash2, Heart, Film, BookOpen, Clock } from 'lucide-react';

interface KanbanBoardProps {
  items: WatchlistItem[];
  onIncrementEpisode: (id: string) => void;
  onDecrementEpisode: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onEditItem: (item: WatchlistItem) => void;
  onUpdateStatus: (id: string, newStatus: WatchStatus) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  items,
  onIncrementEpisode,
  onDecrementEpisode,
  onToggleFavorite,
  onDeleteItem,
  onEditItem,
  onUpdateStatus,
}) => {
  const COLUMNS: { status: WatchStatus; title: string; color: string; icon: string }[] = [
    { status: 'watching', title: 'Watching / Reading', color: '#38bdf8', icon: '📺' },
    { status: 'plan_to_watch', title: 'Plan to Watch', color: '#facc15', icon: '⭐️' },
    { status: 'completed', title: 'Completed', color: '#4ade80', icon: '🎉' },
    { status: 'on_hold', title: 'On Hold', color: '#fb923c', icon: '⏸️' },
    { status: 'dropped', title: 'Dropped', color: '#f87171', icon: '❌' },
  ];

  return (
    <div
      className="kanban-board-container"
      style={{
        display: 'flex',
        gap: '16px',
        overflowX: 'auto',
        paddingBottom: '16px',
        margin: '16px 0 24px',
        minHeight: '600px',
      }}
    >
      {COLUMNS.map((col) => {
        const columnItems = items.filter((item) => item.status === col.status);

        return (
          <div
            key={col.status}
            className="kanban-column"
            style={{
              flex: '0 0 280px',
              minWidth: '280px',
              background: 'rgba(15, 22, 38, 0.75)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              display: 'flex',
              flexDirection: 'column',
              padding: '14px',
              backdropFilter: 'blur(12px)',
            }}
          >
            {/* Column Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '12px',
                marginBottom: '12px',
                borderBottom: `2px solid ${col.color}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>
                <span>{col.icon}</span>
                <span>{col.title}</span>
              </div>
              <span
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: col.color,
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                }}
              >
                {columnItems.length}
              </span>
            </div>

            {/* Column Items Stack */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                flex: 1,
                overflowY: 'auto',
                paddingRight: '2px',
              }}
            >
              {columnItems.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '30px 10px',
                    color: 'var(--text-muted)',
                    fontSize: '0.8rem',
                    border: '1px dashed rgba(255, 255, 255, 0.08)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  Kosong
                </div>
              ) : (
                columnItems.map((item) => {
                  const progressPct =
                    item.progress.totalEpisodes > 0
                      ? Math.min(100, Math.round((item.progress.currentEpisode / item.progress.totalEpisodes) * 100))
                      : 0;

                  return (
                    <div
                      key={item.id}
                      className="kanban-card"
                      style={{
                        background: 'rgba(23, 32, 51, 0.9)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        position: 'relative',
                        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {/* Top Poster & Title Row */}
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                        <img
                          src={item.posterUrl}
                          alt={item.title}
                          style={{
                            width: '50px',
                            height: '70px',
                            borderRadius: '8px',
                            objectFit: 'cover',
                            flexShrink: 0,
                          }}
                        />

                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <div
                            style={{
                              fontSize: '0.88rem',
                              fontWeight: 700,
                              color: '#fff',
                              marginBottom: '4px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                            title={item.title}
                          >
                            {item.title}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {item.type === 'anime' ? <Film size={11} color="#38bdf8" /> : <BookOpen size={11} color="#c084fc" />}
                            <span style={{ textTransform: 'capitalize' }}>{item.type}</span>
                            {item.releaseYear ? <span>&bull; {item.releaseYear}</span> : null}
                          </div>

                          {item.progress.lastTimeObj && (
                            <div style={{ fontSize: '0.7rem', color: '#38bdf8', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <Clock size={10} />
                              <span>{item.progress.lastTimestamp || 'Tanda Waktu'}</span>
                            </div>
                          )}
                        </div>

                        {/* Favorite button */}
                        <button
                          onClick={() => onToggleFavorite(item.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: item.favorite ? '#ef4444' : 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '2px',
                          }}
                        >
                          <Heart size={14} fill={item.favorite ? '#ef4444' : 'none'} />
                        </button>
                      </div>

                      {/* Progress Bar & Episode Counter */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>
                          <span>Eps: {item.progress.currentEpisode}/{item.progress.totalEpisodes}</span>
                          <span style={{ color: 'var(--accent-cyan)' }}>{progressPct}%</span>
                        </div>

                        <div style={{ height: '4px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${progressPct}%`, background: 'linear-gradient(90deg, #3b82f6, #a855f7)', borderRadius: '3px' }} />
                        </div>
                      </div>

                      {/* Bottom Controls Bar */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            onClick={() => onDecrementEpisode(item.id)}
                            disabled={item.progress.currentEpisode <= 0}
                            style={{
                              background: 'var(--bg-input)',
                              border: '1px solid var(--border-subtle)',
                              color: '#fff',
                              width: '24px',
                              height: '24px',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: item.progress.currentEpisode <= 0 ? 'not-allowed' : 'pointer',
                              opacity: item.progress.currentEpisode <= 0 ? 0.4 : 1,
                            }}
                          >
                            <Minus size={12} />
                          </button>
                          <button
                            onClick={() => onIncrementEpisode(item.id)}
                            disabled={item.progress.currentEpisode >= item.progress.totalEpisodes}
                            style={{
                              background: 'var(--accent-blue)',
                              border: '1px solid var(--accent-blue)',
                              color: '#fff',
                              width: '24px',
                              height: '24px',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: item.progress.currentEpisode >= item.progress.totalEpisodes ? 'not-allowed' : 'pointer',
                              opacity: item.progress.currentEpisode >= item.progress.totalEpisodes ? 0.4 : 1,
                            }}
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        {/* Quick Status Dropdown Move */}
                        <select
                          value={item.status}
                          onChange={(e) => onUpdateStatus(item.id, e.target.value as WatchStatus)}
                          style={{
                            background: 'var(--bg-input)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-secondary)',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            padding: '2px 4px',
                            cursor: 'pointer',
                          }}
                        >
                          <option value="watching">Watching</option>
                          <option value="plan_to_watch">Plan</option>
                          <option value="completed">Completed</option>
                          <option value="on_hold">On Hold</option>
                          <option value="dropped">Dropped</option>
                        </select>

                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            onClick={() => onEditItem(item)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                            title="Edit"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            onClick={() => onDeleteItem(item.id)}
                            style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}
                            title="Hapus"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
