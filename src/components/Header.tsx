import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  X, 
  Clapperboard,
  BookOpen,
  LogIn,
  User as UserIcon,
  Users,
  SlidersHorizontal,
  ArrowUpDown,
  Check
} from 'lucide-react';
import type { FilterOptions, MediaType, WatchStatus } from '../types/watchlist';
import { useAuth } from '../context/AuthContext';
import { ProfileCard } from './ProfileCard';

interface HeaderProps {
  filter: FilterOptions;
  onFilterChange: (updatedFilter: Partial<FilterOptions>) => void;
  onOpenAddModal: () => void;
  onOpenAuthModal: () => void;
  onOpenSettings: () => void;
  totalCount: number;
  stats: {
    animeCount: number;
    mangaCount: number;
    completedCount: number;
    watchingCount: number;
  };
  saveStatus?: 'idle' | 'saving' | 'saved';
  onToggleFriendsPanel?: () => void;
  hasPendingInvitations?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  filter,
  onFilterChange,
  onOpenAddModal,
  onOpenAuthModal,
  onOpenSettings,
  totalCount,
  stats,
  saveStatus = 'idle',
  onToggleFriendsPanel,
  hasPendingInvitations = false,
}) => {
  const { user, userBanner, logout } = useAuth();
  const [isProfileCardOpen, setIsProfileCardOpen] = useState(false);

  const categoryTabs: { label: string; value: MediaType | 'all'; icon?: React.ReactNode }[] = [
    { label: 'Semua', value: 'all' },
    { label: 'Anime', value: 'anime', icon: <Clapperboard size={14} /> },
    { label: 'Manga', value: 'manga', icon: <BookOpen size={14} /> },
  ];

  const statusPills: { label: string; value: WatchStatus | 'all' }[] = [
    { label: 'Semua Status', value: 'all' },
    { label: 'Watching / Reading', value: 'watching' },
    { label: 'Completed', value: 'completed' },
    { label: 'Plan to Watch / Read', value: 'plan_to_watch' },
    { label: 'On Hold', value: 'on_hold' },
    { label: 'Dropped', value: 'dropped' },
  ];

  return (
    <>
      {/* Navbar Atas */}
      <nav className="navbar" style={{ marginBottom: '24px', position: 'sticky', top: 0, zIndex: 500 }}>
        <a href="#" className="brand-logo">
          <span className="brand-dot" />
          Wast
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-cyan)', background: 'rgba(56, 189, 248, 0.12)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
            TSX
          </span>
          {saveStatus === 'saved' && (
            <span 
              className="brand-save-badge"
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '4px', 
                fontSize: '0.72rem', 
                fontWeight: 600, 
                color: '#22c55e', 
                background: 'rgba(34, 197, 94, 0.15)', 
                border: '1px solid rgba(34, 197, 94, 0.3)', 
                padding: '2px 8px', 
                borderRadius: 'var(--radius-full)',
                marginLeft: '8px'
              }}
            >
              <Check size={12} color="#22c55e" /> Tersimpan otomatis
            </span>
          )}
        </a>

        {/* Right Controls: User Avatar / Login & Add Button */}
        <div className="navbar-right-controls" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {user && (
            <button
              onClick={onToggleFriendsPanel}
              title="Teman & Undangan"
              className="friends-toggle-btn"
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                cursor: 'pointer',
                position: 'relative',
              }}
            >
              <Users size={16} />
              {hasPendingInvitations && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: '#ef4444',
                    border: '2px solid #0d1322',
                    boxShadow: '0 0 8px #ef4444',
                  }}
                />
              )}
            </button>
          )}

          {user ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setIsProfileCardOpen((prev) => !prev)}
                title="Buka Profil & Settings"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#fff',
                  background: isProfileCardOpen ? 'rgba(59, 130, 246, 0.25)' : 'var(--bg-card)',
                  padding: '5px 14px',
                  borderRadius: 'var(--radius-pill)',
                  border: isProfileCardOpen ? '1px solid var(--accent-blue)' : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isProfileCardOpen ? '0 0 12px rgba(59, 130, 246, 0.3)' : 'none',
                }}
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <UserIcon size={14} color="var(--accent-cyan)" />
                )}
                <span className="user-name-text">{user.displayName || user.email?.split('@')[0]}</span>
              </button>

              {/* Profile Card Popover Dropdown */}
              {isProfileCardOpen && (
                <ProfileCard
                  user={user}
                  userBanner={userBanner}
                  totalItems={totalCount}
                  stats={stats}
                  onOpenSettings={onOpenSettings}
                  onLogout={logout}
                  onClose={() => setIsProfileCardOpen(false)}
                />
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="pill-btn" onClick={onOpenAuthModal}>
                <LogIn size={14} /> Login
              </button>
              <button className="pill-btn active" onClick={onOpenAuthModal}>
                + Register
              </button>
            </div>
          )}

          <button 
            className="pill-btn active" 
            onClick={onOpenAddModal} 
            style={{ 
              background: 'var(--accent-blue)', 
              borderColor: 'var(--accent-blue)',
              boxShadow: '0 2px 10px rgba(59, 130, 246, 0.35)'
            }}
          >
            <Plus size={16} />
            <span className="add-btn-label">Tambah Judul</span>
          </button>
        </div>
      </nav>

      {/* Main Container Section */}
      <div className="main-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px 16px' }}>
        
        {/* Row 1: Section Title Left & Segmented Category Tabs Right */}
        <div className="mobile-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <h1 className="section-title">
            Koleksi Anime &amp; Manga
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500, marginLeft: '8px' }}>
              ({totalCount} judul)
            </span>
          </h1>

          {/* Segmented Category Buttons */}
          <div className="mobile-category-tabs" style={{ display: 'flex', background: 'var(--bg-card)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', gap: '4px' }}>
            {categoryTabs.map((tab) => {
              const isActive = filter.category === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => onFilterChange({ category: tab.value })}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    border: 'none',
                    background: isActive ? 'var(--accent-blue)' : 'transparent',
                    color: isActive ? '#ffffff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 2 & 3: Clean Filter Panel Box */}
        <div 
          className="filter-panel-box"
          style={{ 
            background: 'var(--bg-card)', 
            border: '1px solid var(--border-subtle)', 
            borderRadius: 'var(--radius-md)', 
            padding: '16px 20px', 
            marginBottom: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
          }}
        >
          {/* Sub-row 1: Search bar (Left) & Sorting Buttons (Right) */}
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            
            {/* Search Input Box */}
            <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
              <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Cari judul anime, manga, genre..."
                className="input-clean"
                style={{ width: '100%', paddingLeft: '38px', paddingRight: filter.searchQuery ? '34px' : '14px' }}
                value={filter.searchQuery}
                onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
              />
              {filter.searchQuery && (
                <button
                  onClick={() => onFilterChange({ searchQuery: '' })}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Sort Controls */}
            <div className="mobile-sort-container" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                <ArrowUpDown size={13} /> Urutkan:
              </span>
              <button
                className={`pill-btn ${filter.sortBy === 'customOrder' ? 'active' : ''}`}
                onClick={() => onFilterChange({ sortBy: 'customOrder', sortOrder: 'asc' })}
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              >
                Kustom
              </button>
              <button
                className={`pill-btn ${filter.sortBy === 'updatedAt' ? 'active' : ''}`}
                onClick={() => onFilterChange({ sortBy: 'updatedAt', sortOrder: filter.sortBy === 'updatedAt' && filter.sortOrder === 'desc' ? 'asc' : 'desc' })}
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              >
                Terbaru
              </button>
              <button
                className={`pill-btn ${filter.sortBy === 'rating' ? 'active' : ''}`}
                onClick={() => onFilterChange({ sortBy: 'rating', sortOrder: filter.sortBy === 'rating' && filter.sortOrder === 'desc' ? 'asc' : 'desc' })}
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              >
                Rating
              </button>
              <button
                className={`pill-btn ${filter.sortBy === 'progress' ? 'active' : ''}`}
                onClick={() => onFilterChange({ sortBy: 'progress', sortOrder: filter.sortBy === 'progress' && filter.sortOrder === 'desc' ? 'asc' : 'desc' })}
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              >
                Progres
              </button>
            </div>
          </div>

          {/* Sub-row 2: Status Filter Chips Bar */}
          <div className="mobile-status-scroll" style={{ paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto' }}>
            <SlidersHorizontal size={14} color="var(--text-muted)" style={{ flexShrink: 0, marginRight: '4px' }} />
            {statusPills.map((s) => {
              const isActive = filter.status === s.value;
              return (
                <button
                  key={s.value}
                  onClick={() => onFilterChange({ status: s.value })}
                  className={`pill-btn ${isActive ? 'active' : ''}`}
                  style={{ padding: '5px 12px', fontSize: '0.78rem', whiteSpace: 'nowrap' }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </>
  );
};
