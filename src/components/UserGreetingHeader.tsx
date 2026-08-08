import React, { useMemo } from 'react';
import { Flame, Sparkles, Quote, Tv, BookOpen } from 'lucide-react';
import type { User } from 'firebase/auth';

interface UserGreetingHeaderProps {
  user: User | null;
  totalItems: number;
  stats: {
    animeCount: number;
    mangaCount: number;
    completedCount: number;
    watchingCount: number;
  };
}

const ANIME_QUOTES = [
  { quote: "Whatever you lose, you'll find it again. But what you throw away you'll never get back.", author: "Kenshin Himura" },
  { quote: "Fear is not evil. It tells you what weakness is. And once you know weakness, you can become stronger.", author: "Gildarts Clive" },
  { quote: "Power comes in response to a need, not a desire.", author: "Goku (Dragon Ball Z)" },
  { quote: "If you don't take risks, you can't create a future.", author: "Monkey D. Luffy (One Piece)" },
  { quote: "Hard work is worthless for those that don't believe in themselves.", author: "Naruto Uzumaki" },
  { quote: "It's not the face that makes someone a monster, it's the choices they make.", author: "Naruto Shippuden" },
];

export const UserGreetingHeader: React.FC<UserGreetingHeaderProps> = ({ user, totalItems, stats }) => {
  const timeGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Selamat Pagi';
    if (hour >= 12 && hour < 15) return 'Selamat Siang';
    if (hour >= 15 && hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  }, []);

  const randomQuote = useMemo(() => {
    const idx = Math.floor(Math.random() * ANIME_QUOTES.length);
    return ANIME_QUOTES[idx];
  }, []);

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Otaku';

  return (
    <div
      className="user-greeting-banner"
      style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.8) 50%, rgba(15, 23, 42, 0.95) 100%)',
        border: '1px solid rgba(59, 130, 246, 0.25)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 24px',
        marginBottom: '20px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 10px 35px rgba(0, 0, 0, 0.4), inset 0 0 30px rgba(59, 130, 246, 0.08)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Background Subtle Glow Circle */}
      <div
        style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.25) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {/* Left Side: Personal Greeting & Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={displayName}
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '16px',
                objectFit: 'cover',
                border: '2px solid var(--accent-blue)',
                boxShadow: '0 0 15px rgba(59, 130, 246, 0.5)',
              }}
            />
          ) : (
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #a855f7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)',
                fontWeight: 800,
                fontSize: '1.2rem',
                color: '#fff',
              }}
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em' }}>
                {timeGreeting}, <span style={{ background: 'linear-gradient(135deg, #38bdf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{displayName}</span>! ✨
              </h2>
              <span
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  color: '#f87171',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Flame size={12} color="#f87171" />
                <span>Active Streak</span>
              </span>
            </div>

            {/* Anime Quote of the day */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              <Quote size={12} color="#38bdf8" />
              <span style={{ fontStyle: 'italic' }}>"{randomQuote.quote}"</span>
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>— {randomQuote.author}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Quick Stats Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div
            style={{
              background: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.35)',
              padding: '6px 14px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.8rem',
              color: '#38bdf8',
            }}
          >
            <Sparkles size={14} color="#38bdf8" />
            <span>Total Koleksi:</span>
            <strong>{totalItems}</strong>
          </div>

          <div
            style={{
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '6px 14px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.8rem',
            }}
          >
            <Tv size={14} color="#38bdf8" />
            <span style={{ color: 'var(--text-muted)' }}>Anime:</span>
            <strong style={{ color: '#fff' }}>{stats.animeCount}</strong>
          </div>

          <div
            style={{
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '6px 14px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.8rem',
            }}
          >
            <BookOpen size={14} color="#c084fc" />
            <span style={{ color: 'var(--text-muted)' }}>Manga:</span>
            <strong style={{ color: '#fff' }}>{stats.mangaCount}</strong>
          </div>

          <div
            style={{
              background: 'rgba(34, 197, 94, 0.12)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              padding: '6px 14px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.8rem',
              color: '#4ade80',
            }}
          >
            <Sparkles size={14} color="#4ade80" />
            <span>Selesai:</span>
            <strong>{stats.completedCount}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
