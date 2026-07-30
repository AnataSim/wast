import React, { useState, useEffect } from 'react';
import { X, Search, ShieldCheck, Film, BookOpen, PlayCircle, CheckCircle } from 'lucide-react';
import { fetchFriendProfile, type FriendProfileData, type FriendUser } from '../services/friendService';

interface FriendProfileModalProps {
  friend: FriendUser | null;
  isOpen: boolean;
  onClose: () => void;
  onInspect: (friend: FriendUser) => void;
}

export const FriendProfileModal: React.FC<FriendProfileModalProps> = ({
  friend,
  isOpen,
  onClose,
  onInspect,
}) => {
  const [profile, setProfile] = useState<FriendProfileData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && friend) {
      setLoading(true);
      fetchFriendProfile(friend.uid)
        .then((data) => setProfile(data))
        .catch((err) => console.warn('Gagal memuat profil teman:', err))
        .finally(() => setLoading(false));
    } else {
      setProfile(null);
    }
  }, [isOpen, friend]);

  if (!isOpen || !friend) return null;

  const displayName = profile?.displayName || friend.username || 'User';
  const photoURL = profile?.photoURL || friend.photoURL;
  const bannerURL = profile?.bannerURL;

  const defaultBanner = 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #3b82f6 100%)';

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 5000,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '380px',
          background: '#0d1322',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '18px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(59, 130, 246, 0.2)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 10,
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          <X size={16} />
        </button>

        {/* Profile Banner */}
        <div
          style={{
            height: '110px',
            width: '100%',
            background: bannerURL ? `url(${bannerURL}) center/cover no-repeat` : defaultBanner,
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to bottom, transparent 30%, rgba(13, 19, 34, 0.95) 100%)',
            }}
          />
        </div>

        {/* Profile Details Area */}
        <div style={{ padding: '0 20px 20px', marginTop: '-40px', position: 'relative' }}>
          {/* Avatar and Badge */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ position: 'relative' }}>
              {photoURL ? (
                <img
                  src={photoURL}
                  alt={displayName}
                  style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '3px solid #0d1322',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.6), 0 0 12px rgba(56, 189, 248, 0.4)',
                    background: '#1e293b',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                    border: '3px solid #0d1322',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '1.8rem',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.6)',
                  }}
                >
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <span
                title="Verified Otaku Friend"
                style={{
                  position: 'absolute',
                  bottom: 2,
                  right: 2,
                  background: '#0d1322',
                  borderRadius: '50%',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#38bdf8',
                }}
              >
                <ShieldCheck size={16} fill="#0d1322" />
              </span>
            </div>

            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#38bdf8',
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                padding: '4px 12px',
                borderRadius: '20px',
                letterSpacing: '0.5px',
              }}
            >
              Friend
            </span>
          </div>

          {/* Display Name */}
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', margin: '0 0 14px' }}>
            {displayName}
          </h3>

          {/* Stats Box */}
          <div
            style={{
              background: '#121929',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '14px',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total List</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-blue)' }}>
                {loading ? '...' : (profile?.stats?.totalItems ?? 0)} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Judul</span>
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.78rem', color: 'rgba(255,255,255,0.75)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Film size={14} color="#60a5fa" />
                <span>Anime: <strong>{loading ? '...' : (profile?.stats?.animeCount ?? 0)}</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BookOpen size={14} color="#c084fc" />
                <span>Manga: <strong>{loading ? '...' : (profile?.stats?.mangaCount ?? 0)}</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <PlayCircle size={14} color="#38bdf8" />
                <span>Watching: <strong>{loading ? '...' : (profile?.stats?.watchingCount ?? 0)}</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={14} color="#4ade80" />
                <span>Selesai: <strong>{loading ? '...' : (profile?.stats?.completedCount ?? 0)}</strong></span>
              </div>
            </div>
          </div>

          {/* Inspect Button */}
          <button
            onClick={() => {
              onClose();
              onInspect(friend);
            }}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
              color: '#fff',
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 16px rgba(59, 130, 246, 0.4)',
              transition: 'transform 0.15s ease',
            }}
          >
            <Search size={16} /> Inspect WatchList
          </button>
        </div>
      </div>
    </div>
  );
};
