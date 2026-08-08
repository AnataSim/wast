import React, { useMemo } from 'react';
import type { WatchlistItem, StatsSummary } from '../types/watchlist';
import { Star, Clock, Trophy, Flame, CheckCircle2, Film, BookOpen } from 'lucide-react';

interface AnalyticsRadarProps {
  items: WatchlistItem[];
  stats: StatsSummary;
}

export const AnalyticsRadar: React.FC<AnalyticsRadarProps> = ({ items, stats }) => {
  // Genre frequency breakdown
  const genreStats = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((item) => {
      if (Array.isArray(item.genres)) {
        item.genres.forEach((g) => {
          if (g) counts[g] = (counts[g] || 0) + 1;
        });
      }
    });
    return Object.entries(counts)
      .map(([genre, count]) => ({ genre, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [items]);

  const maxGenreCount = genreStats.length > 0 ? genreStats[0].count : 1;

  // Top rated items
  const topRated = useMemo(() => {
    return [...items]
      .filter((i) => i.rating)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 5);
  }, [items]);

  const animeCount = items.filter((i) => i.type === 'anime').length;
  const mangaCount = items.filter((i) => i.type === 'manga').length;
  const completionRatio = stats.totalItems > 0 ? Math.round((stats.completedCount / stats.totalItems) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', margin: '16px 0 32px' }}>
      {/* Top Stat Overview Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}
      >
        {/* Stat Box 1: RPG Level / Total Items */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', color: '#38bdf8' }}>
            <Trophy size={20} />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.05em' }}>TOTAL KOLEKSI</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#fff' }}>{stats.totalItems}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', gap: '10px' }}>
            <span><Film size={11} style={{ display: 'inline', marginRight: '3px' }} /> {animeCount} Anime</span>
            <span><BookOpen size={11} style={{ display: 'inline', marginRight: '3px' }} /> {mangaCount} Manga</span>
          </div>
        </div>

        {/* Stat Box 2: Total Time Watched */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(168, 85, 247, 0.25)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', color: '#c084fc' }}>
            <Clock size={20} />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.05em' }}>ESTIMASI DURASI</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#fff' }}>{stats.totalHoursWatched} <span style={{ fontSize: '1rem', fontWeight: 600 }}>Jam</span></div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Sisa tontonan: {Math.round(stats.remainingMinutes / 60)} Jam
          </div>
        </div>

        {/* Stat Box 3: Completion Rate */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(34, 197, 94, 0.25)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', color: '#4ade80' }}>
            <CheckCircle2 size={20} />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.05em' }}>COMPLETION RATE</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#fff' }}>{completionRatio}%</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {stats.completedCount} dari {stats.totalItems} tontonan selesai
          </div>
        </div>

        {/* Stat Box 4: Average Score */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(234, 179, 8, 0.25)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', color: '#facc15' }}>
            <Star size={20} />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.05em' }}>AVERAGE RATING</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#fff' }}>{stats.averageRating || '-'}<span style={{ fontSize: '1rem', fontWeight: 600 }}>/10</span></div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Berdasarkan rating yang kamu berikan
          </div>
        </div>
      </div>

      {/* Main Breakdown Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Genre Breakdown Progress Bars */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: '18px' }}>
            <Flame size={18} color="#f97316" />
            <span>Genre Terfavorit Kamu</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {genreStats.length === 0 ? (
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Belum ada data genre.</span>
            ) : (
              genreStats.map((g) => {
                const pct = Math.round((g.count / maxGenreCount) * 100);
                return (
                  <div key={g.genre}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      <span>{g.genre}</span>
                      <span>{g.count} judul</span>
                    </div>
                    <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #38bdf8, #a855f7)', borderRadius: '4px' }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Top Rated Hall of Fame */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: '18px' }}>
            <Trophy size={18} color="#facc15" />
            <span>Top Rated (Hall of Fame)</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {topRated.length === 0 ? (
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Belum ada judul yang diberi rating.</span>
            ) : (
              topRated.map((item, idx) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: 'var(--bg-input)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: idx === 0 ? '#facc15' : idx === 1 ? '#94a3b8' : '#cd7f32' }}>
                      #{idx + 1}
                    </span>
                    <img src={item.posterUrl} alt={item.title} style={{ width: '32px', height: '44px', borderRadius: '6px', objectFit: 'cover' }} />
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.title}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#facc15', fontWeight: 800, fontSize: '0.9rem' }}>
                    <Star size={14} fill="#facc15" />
                    <span>{item.rating}/10</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
