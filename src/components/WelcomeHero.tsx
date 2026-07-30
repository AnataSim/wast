import React from 'react';
import { Film, LogIn, UserPlus, Star, ShieldCheck, Zap, BookOpen } from 'lucide-react';
import { INITIAL_WATCHLIST } from '../data/mockData';

interface WelcomeHeroProps {
  onOpenAuthModal: () => void;
}

export const WelcomeHero: React.FC<WelcomeHeroProps> = ({ onOpenAuthModal }) => {
  const posters = INITIAL_WATCHLIST.map((item) => item.posterUrl);
  const column1 = [...posters, ...posters];
  const column2 = [...posters].reverse().concat(posters);
  const column3 = [...posters, ...posters];

  return (
    <div className="guest-env-container">
      {/* Background Floating Anime & Manga Poster Marquee Wall */}
      <div className="poster-wall-wrapper">
        <div className="poster-column-up">
          {column1.map((url, i) => (
            <img key={`col1-${i}`} src={url} alt="Anime Poster" className="poster-card-mini" />
          ))}
        </div>
        <div className="poster-column-down">
          {column2.map((url, i) => (
            <img key={`col2-${i}`} src={url} alt="Manga Poster" className="poster-card-mini" />
          ))}
        </div>
        <div className="poster-column-up">
          {column3.map((url, i) => (
            <img key={`col3-${i}`} src={url} alt="Anime Poster" className="poster-card-mini" />
          ))}
        </div>
      </div>

      {/* Rotating Conic Neon Border Wrapper */}
      <div className="neon-border-wrapper">
        {/* Floating Orbit Badges */}
        <div className="orbit-tag-1">
          <Zap size={13} style={{ display: 'inline', marginRight: '4px' }} />
          Anime &amp; Manga Firestore
        </div>
        <div className="orbit-tag-2">
          <Star size={13} style={{ display: 'inline', marginRight: '4px' }} />
          Episode &amp; Chapter Tracker
        </div>

        {/* Inner Card Content */}
        <div
          style={{
            width: '100%',
            maxWidth: '540px',
            background: 'rgba(10, 14, 23, 0.92)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderRadius: 'var(--radius-lg)',
            padding: '46px 36px',
            textAlign: 'center',
            position: 'relative',
            zIndex: 10,
          }}
        >
          {/* Glowing Brand Icon */}
          <div className="hero-badge-glow" style={{ display: 'inline-block', marginBottom: '20px' }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '22px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #a855f7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              boxShadow: '0 0 35px rgba(59, 130, 246, 0.5)'
            }}>
              <Film size={36} color="#ffffff" />
            </div>
          </div>

          {/* Title with Gradient Text */}
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ffffff', marginBottom: '8px', letterSpacing: '-0.02em' }}>
            Wast{' '}
            <span style={{
              background: 'linear-gradient(135deg, #38bdf8 0%, #a855f7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: '1rem',
              fontWeight: 700,
              verticalAlign: 'middle',
            }}>
              TSX
            </span>
          </h1>

          <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
            Platform pelacak sinematik eksklusif untuk <strong style={{ color: '#fff' }}>Anime</strong> dan <strong style={{ color: '#fff' }}>Manga</strong> favoritmu dengan sinkronisasi cloud real-time.
          </p>

          {/* Feature Badges Chips */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '32px' }}>
            <span style={{ fontSize: '0.75rem', padding: '4px 10px', background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.3)', color: 'var(--accent-cyan)', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Film size={12} /> Anime Episode Tracker
            </span>
            <span style={{ fontSize: '0.75rem', padding: '4px 10px', background: 'rgba(168, 85, 247, 0.12)', border: '1px solid rgba(168, 85, 247, 0.3)', color: '#c084fc', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <BookOpen size={12} /> Manga Chapter Reader
            </span>
            <span style={{ fontSize: '0.75rem', padding: '4px 10px', background: 'rgba(34, 197, 94, 0.12)', border: '1px solid rgba(34, 197, 94, 0.3)', color: '#4ade80', borderRadius: 'var(--radius-full)' }}>
              ☁️ Firebase Sync
            </span>
          </div>

          {/* Shimmer Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <button 
              className="pill-btn active btn-shimmer"
              onClick={onOpenAuthModal}
              style={{ 
                width: '100%', 
                justifyContent: 'center', 
                padding: '13px', 
                fontSize: '0.95rem', 
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                borderColor: '#3b82f6',
                boxShadow: '0 0 25px rgba(59, 130, 246, 0.4)'
              }}
            >
              <LogIn size={18} />
              <span>Masuk ke Akun</span>
            </button>

            <button 
              className="pill-btn"
              onClick={onOpenAuthModal}
              style={{ 
                width: '100%', 
                justifyContent: 'center', 
                padding: '13px', 
                fontSize: '0.95rem', 
                background: 'var(--bg-input)' 
              }}
            >
              <UserPlus size={18} />
              <span>Daftar Akun Baru</span>
            </button>
          </div>

          {/* Footer Note */}
          <div style={{ marginTop: '28px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <ShieldCheck size={14} color="var(--accent-cyan)" />
            <span>Sesi Aman &bull; Fitur Remember Me &bull; Live Cloud Database</span>
          </div>
        </div>
      </div>
    </div>
  );
};
