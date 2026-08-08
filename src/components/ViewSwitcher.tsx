import React from 'react';
import { LayoutGrid, Columns, List, BarChart3, Dices } from 'lucide-react';

export type ViewMode = 'grid' | 'kanban' | 'list' | 'analytics';

interface ViewSwitcherProps {
  currentMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
  onOpenRandomizer: () => void;
  planToWatchCount: number;
}

export const ViewSwitcher: React.FC<ViewSwitcherProps> = ({
  currentMode,
  onModeChange,
  onOpenRandomizer,
  planToWatchCount,
}) => {
  const modes: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
    { id: 'grid', label: 'Grid 3D', icon: <LayoutGrid size={15} /> },
    { id: 'kanban', label: 'Kanban Board', icon: <Columns size={15} /> },
    { id: 'list', label: 'List Row', icon: <List size={15} /> },
    { id: 'analytics', label: 'RPG Stats', icon: <BarChart3 size={15} /> },
  ];

  return (
    <div
      className="view-switcher-bar"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        margin: '0 0 18px',
        padding: '10px 16px',
        background: 'rgba(15, 22, 38, 0.85)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 'var(--radius-md)',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* Mode Buttons Segmented Pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginRight: '4px' }}>
          Mode Tampilan:
        </span>
        {modes.map((m) => {
          const isActive = currentMode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onModeChange(m.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                fontWeight: 600,
                border: isActive ? '1px solid var(--accent-blue)' : '1px solid transparent',
                background: isActive ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'var(--bg-input)',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isActive ? '0 0 15px rgba(59, 130, 246, 0.4)' : 'none',
              }}
            >
              {m.icon}
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* Gacha Wheel Roulette Button */}
      <button
        onClick={onOpenRandomizer}
        className="btn-shimmer"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '7px 16px',
          borderRadius: 'var(--radius-pill)',
          fontSize: '0.82rem',
          fontWeight: 700,
          background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
          color: '#ffffff',
          border: '1px solid rgba(192, 132, 252, 0.4)',
          boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        title="Putar Roda Gacha untuk Memilih Anime/Manga Acak dari Tontonanmu!"
      >
        <Dices size={16} color="#ffffff" className="intro-pulse-icon" />
        <span>Bingung Nonton Apa?</span>
        {planToWatchCount > 0 && (
          <span
            style={{
              background: 'rgba(255, 255, 255, 0.25)',
              padding: '1px 7px',
              borderRadius: '10px',
              fontSize: '0.72rem',
            }}
          >
            {planToWatchCount}
          </span>
        )}
      </button>
    </div>
  );
};
