import React, { useRef, useEffect } from 'react';
import { Settings, LogOut, Clapperboard, BookOpen, CheckCircle, PlayCircle, ShieldCheck } from 'lucide-react';
import type { User } from 'firebase/auth';

interface ProfileCardProps {
  user: User;
  userBanner: string | null;
  totalItems: number;
  stats: {
    animeCount: number;
    mangaCount: number;
    completedCount: number;
    watchingCount: number;
  };
  onOpenSettings: () => void;
  onLogout: () => void;
  onClose: () => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  user,
  userBanner,
  totalItems,
  stats,
  onOpenSettings,
  onLogout,
  onClose,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const nickname = user.displayName || user.email?.split('@')[0] || 'User';
  const email = user.email || 'No email';
  const defaultBanner = 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #3b82f6 100%)';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={cardRef}
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        right: 0,
        width: '320px',
        background: '#0d1322',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '16px',
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6), 0 0 20px rgba(59, 130, 246, 0.2)',
        overflow: 'hidden',
        zIndex: 1000,
      }}
    >
      {/* Profile Banner */}
      <div
        style={{
          height: '90px',
          width: '100%',
          background: userBanner ? `url(${userBanner}) center/cover no-repeat` : defaultBanner,
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, transparent 40%, rgba(13, 19, 34, 0.8) 100%)',
          }}
        />
      </div>

      {/* Profile Info Area */}
      <div style={{ padding: '0 16px 16px', position: 'relative', marginTop: '-36px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ position: 'relative' }}>
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={nickname}
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid #0d1322',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.5), 0 0 10px rgba(56, 189, 248, 0.4)',
                  background: '#1e293b',
                }}
              />
            ) : (
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                  border: '3px solid #0d1322',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '1.5rem',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                }}
              >
                {nickname.charAt(0).toUpperCase()}
              </div>
            )}
            <span
              title="Verified User"
              style={{
                position: 'absolute',
                bottom: '2px',
                right: 0,
                background: '#3b82f6',
                borderRadius: '50%',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldCheck size={12} color="#fff" />
            </span>
          </div>

          <div
            style={{
              background: nickname.trim().toLowerCase() === 's' ? 'rgba(56, 189, 248, 0.1)' : 'rgba(168, 85, 247, 0.12)',
              border: nickname.trim().toLowerCase() === 's' ? '1px solid rgba(56, 189, 248, 0.25)' : '1px solid rgba(168, 85, 247, 0.3)',
              color: nickname.trim().toLowerCase() === 's' ? 'var(--accent-cyan)' : '#c084fc',
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: '9999px',
            }}
          >
            {nickname.trim().toLowerCase() === 's' ? 'Owner' : 'Watcher'}
          </div>
        </div>

        {/* Nickname & Email */}
        <div style={{ marginBottom: '14px' }}>
          <h3
            style={{
              fontSize: '1.1rem',
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.2,
              marginBottom: '2px',
            }}
          >
            {nickname}
          </h3>

        </div>

        {/* Total List Stats Box */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '12px',
            marginBottom: '14px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              paddingBottom: '8px',
            }}
          >
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total List</span>
            <span
              style={{
                fontSize: '1.05rem',
                fontWeight: 800,
                color: 'var(--accent-cyan)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {totalItems} Judul
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)' }}>
              <Clapperboard size={12} color="#3b82f6" /> Anime: <strong style={{ color: '#fff', marginLeft: '3px' }}>{stats.animeCount}</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)' }}>
              <BookOpen size={12} color="#a855f7" /> Manga: <strong style={{ color: '#fff', marginLeft: '3px' }}>{stats.mangaCount}</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)' }}>
              <PlayCircle size={12} color="#38bdf8" /> Watching: <strong style={{ color: '#fff', marginLeft: '3px' }}>{stats.watchingCount}</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)' }}>
              <CheckCircle size={12} color="#22c55e" /> Selesai: <strong style={{ color: '#fff', marginLeft: '3px' }}>{stats.completedCount}</strong>
            </div>
          </div>
        </div>

        {/* Action Buttons: Settings & Logout */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={() => {
              onClose();
              onOpenSettings();
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '9px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              background: 'var(--bg-input)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
            }}
          >
            <Settings size={15} color="var(--accent-blue)" />
            Settings
          </button>

          <button
            onClick={() => {
              onClose();
              onLogout();
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '9px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              background: 'rgba(239, 68, 68, 0.12)',
              color: '#f87171',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              cursor: 'pointer',
            }}
          >
            <LogOut size={15} />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};
