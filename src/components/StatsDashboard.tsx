import React from 'react';
import type { StatsSummary, WatchStatus } from '../types/watchlist';
import { Camera, Loader2 } from 'lucide-react';

interface StatsDashboardProps {
  stats: StatsSummary;
  activeStatusFilter: WatchStatus | 'all';
  onSelectStatus: (status: WatchStatus | 'all') => void;
  onExportPNG?: () => void;
  isExporting?: boolean;
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({
  stats,
  activeStatusFilter: _activeStatusFilter,
  onSelectStatus: _onSelectStatus,
  onExportPNG,
  isExporting = false,
}) => {
  const completionPercentage = stats.totalItems > 0 
    ? Math.round((stats.completedCount / stats.totalItems) * 100) 
    : 0;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto 20px', padding: '0 16px' }}>
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        fontSize: '0.85rem'
      }}>
        {/* Stat Items */}
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Total Tontonan: </span>
            <strong style={{ color: '#fff' }}>{stats.totalItems}</strong>
          </div>

          <div>
            <span style={{ color: 'var(--text-muted)' }}>Est. Durasi: </span>
            {stats.remainingMinutes > 0 ? (() => {
              const h = Math.floor(stats.remainingMinutes / 60);
              const m = stats.remainingMinutes % 60;
              const label = h > 0 && m > 0 ? `${h}j ${m}m` : h > 0 ? `${h} jam` : `${m} menit`;
              return <strong style={{ color: 'var(--accent-cyan)' }}>{label}</strong>;
            })() : (
              <strong style={{ color: 'var(--text-muted)' }}>-</strong>
            )}
          </div>

          <div>
            <span style={{ color: 'var(--text-muted)' }}>Est. Chapter: </span>
            {stats.remainingChapters > 0 ? (
              <strong style={{ color: '#c084fc' }}>{stats.remainingChapters}</strong>
            ) : (
              <strong style={{ color: 'var(--text-muted)' }}>-</strong>
            )}
          </div>

          <div>
            <span style={{ color: 'var(--text-muted)' }}>Avg Rating: </span>
            <strong style={{ color: '#eab308' }}>{stats.averageRating > 0 ? `${stats.averageRating} / 10` : '-'}</strong>
          </div>
        </div>

        {/* Right Section: Progress Bar & Save Photo PNG Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '140px' }}>
            <div style={{ flex: 1, height: '4px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ width: `${completionPercentage}%`, height: '100%', background: 'var(--accent-blue)', borderRadius: '2px' }} />
            </div>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {completionPercentage}%
            </span>
          </div>

          {onExportPNG && (
            <button
              type="button"
              onClick={onExportPNG}
              disabled={isExporting}
              className="pill-btn"
              style={{
                fontSize: '0.78rem',
                padding: '6px 14px',
                background: 'rgba(56, 189, 248, 0.15)',
                color: 'var(--accent-cyan)',
                borderColor: 'rgba(56, 189, 248, 0.35)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                flexShrink: 0
              }}
              title="Simpan daftar tontonan sebagai gambar PNG"
            >
              {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
