import React, { useState } from 'react';
import type { WatchlistItem } from '../types/watchlist';
import { X, Dices, Sparkles, Play, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';

interface AnimeRandomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: WatchlistItem[];
  onUpdateStatus: (id: string, newStatus: 'watching' | 'completed' | 'plan_to_watch' | 'on_hold' | 'dropped') => void;
}

export const AnimeRandomizerModal: React.FC<AnimeRandomizerModalProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateStatus,
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedItem, setSelectedItem] = useState<WatchlistItem | null>(null);
  const [displayedTitle, setDisplayedTitle] = useState<string>('SIAP MEMUTAR RODA GACHA?');
  const [displayedPoster, setDisplayedPoster] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter plan_to_watch items first, or fallback to all items
  const candidates = items.filter((i) => i.status === 'plan_to_watch');
  const pool = candidates.length > 0 ? candidates : items;

  const handleSpin = () => {
    if (pool.length === 0 || isSpinning) return;

    setIsSpinning(true);
    setSelectedItem(null);

    let counter = 0;
    const totalSwaps = 25;
    const intervalTime = 80;

    const interval = setInterval(() => {
      const randomIdx = Math.floor(Math.random() * pool.length);
      const current = pool[randomIdx];
      setDisplayedTitle(current.title);
      setDisplayedPoster(current.posterUrl);

      counter++;
      if (counter >= totalSwaps) {
        clearInterval(interval);
        const finalWinner = pool[Math.floor(Math.random() * pool.length)];
        setSelectedItem(finalWinner);
        setDisplayedTitle(finalWinner.title);
        setDisplayedPoster(finalWinner.posterUrl);
        setIsSpinning(false);

        // Confetti effect
        try {
          confetti({
            particleCount: 100,
            spread: 120,
            origin: { y: 0.5 },
            colors: ['#a855f7', '#3b82f6', '#38bdf8', '#c084fc'],
          });
        } catch (e) {}
      }
    }, intervalTime);
  };

  const handleAcceptWinner = () => {
    if (selectedItem) {
      onUpdateStatus(selectedItem.id, 'watching');
      onClose();
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 10000 }}>
      <div
        style={{
          background: 'rgba(10, 15, 29, 0.95)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(168, 85, 247, 0.4)',
          borderRadius: '24px',
          maxWidth: '480px',
          width: '90%',
          padding: '32px 24px',
          boxShadow: '0 0 50px rgba(168, 85, 247, 0.3)',
          textAlign: 'center',
          position: 'relative',
          color: '#fff',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            color: '#fff',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <X size={16} />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.4)', padding: '6px 16px', borderRadius: '20px', color: '#c084fc', fontSize: '0.8rem', fontWeight: 700, marginBottom: '16px' }}>
          <Dices size={16} className="intro-pulse-icon" />
          <span>ROULETTE BINGUNG NONTON</span>
        </div>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '6px' }}>
          Gacha Decision Wheel
        </h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          {candidates.length > 0
            ? `Memilih secara acak dari ${candidates.length} judul dalam daftar Plan to Watch`
            : `Memilih dari ${pool.length} judul anime & manga kamu`}
        </p>

        {/* Poster Showcase Box */}
        <div
          style={{
            width: '180px',
            height: '250px',
            margin: '0 auto 20px',
            borderRadius: '16px',
            overflow: 'hidden',
            border: selectedItem ? '2px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: selectedItem ? '0 0 35px rgba(168, 85, 247, 0.6)' : 'none',
            position: 'relative',
            background: '#0d1322',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
          }}
        >
          {displayedPoster ? (
            <img
              src={displayedPoster}
              alt="Poster"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: isSpinning ? 'blur(2px)' : 'none',
              }}
            />
          ) : (
            <Sparkles size={40} color="#a855f7" className="intro-spin-sparkle" />
          )}
        </div>

        {/* Selected Title Result Box */}
        <div
          style={{
            minHeight: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
          }}
        >
          <h3
            style={{
              fontSize: '1.15rem',
              fontWeight: 800,
              color: selectedItem ? '#38bdf8' : '#ffffff',
              lineHeight: 1.3,
            }}
          >
            {displayedTitle}
          </h3>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {selectedItem ? (
            <button
              onClick={handleAcceptWinner}
              className="pill-btn active btn-shimmer"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '12px',
                fontSize: '0.95rem',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                borderColor: '#3b82f6',
                boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)',
              }}
            >
              <Play size={18} />
              <span>Mulai Nonton / Baca Sekarang!</span>
            </button>
          ) : null}

          <button
            onClick={handleSpin}
            disabled={isSpinning || pool.length === 0}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.9rem',
              fontWeight: 700,
              background: isSpinning ? 'rgba(255, 255, 255, 0.1)' : 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
              color: '#ffffff',
              border: 'none',
              cursor: isSpinning || pool.length === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
            }}
          >
            <RotateCcw size={16} className={isSpinning ? 'intro-spin-sparkle' : ''} />
            <span>{isSpinning ? 'MEMUTAR RODA GACHA...' : selectedItem ? 'Putar Lagi 🎲' : 'PUTAR RODA GACHA!'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
