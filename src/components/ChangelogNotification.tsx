import React, { useState } from 'react';
import { Sparkles, GitCommit, CheckCircle2, ChevronUp, ChevronDown, X, ExternalLink, Plus } from 'lucide-react';

interface ChangelogNotificationProps {
  onOpenAddModal?: () => void;
}

export const ChangelogNotification: React.FC<ChangelogNotificationProps> = ({ onOpenAddModal }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const commitTitle = "feat(marquee): smart anime & manga cross-detection, daily date seed 1-50, accurate chapter count & japanese title support";
  const commitHash = "c9a2e41";
  const releaseDate = "8 Agustus 2026";

  const changelogItems = [
    {
      title: "Deteksi Otomatis Anime & Manga",
      description: "Tombol `+ Anime` & `+ Manga` di kartu rekomendasi otomatis menyesuaikan berdasarkan ketersediaan versi media di AniList.",
      category: "Feature",
    },
    {
      title: "Akurasi Total Chapter & Episode",
      description: "Menambahkan dari banner rekomendasi kini menyimpan jumlah total episode/chapter asli dari API (tidak lagi terbatas 12).",
      category: "Fix",
    },
    {
      title: "Judul Bahasa Jepang (Kanji / Kana)",
      description: "Otomatis menyimpan & menampilkan judul asli Jepang di bawah judul utama pada mode Grid 3D & List Row.",
      category: "Feature",
    },
    {
      title: "Genre Badge Vertikal & Prioritas Filter",
      description: "Hingga 3 genre tampil bertumpuk secara vertikal di pojok kiri atas kartu, dengan genre terpilih selalu berada di paling atas.",
      category: "UI/UX",
    },
    {
      title: "Rekomendasi Harian 1-50 (Daily Seed)",
      description: "Urutan rekomendasi stabil sepanjang hari, ganti otomatis tiap hari, dan dapat di-refresh manual tanpa duplikasi rekomendasi lama.",
      category: "Algorithm",
    },
    {
      title: "Penanda Halaman Manga & Timer Nonton",
      description: "Tampilan Grid 3D kini mendukung penanda `Hal. X` untuk Manga beserta link langsung ke platform baca/nonton.",
      category: "UI/UX",
    },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '10px',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Expanded Popup Card */}
      {isOpen && (
        <div
          style={{
            width: '360px',
            maxHeight: '480px',
            background: 'rgba(10, 15, 29, 0.95)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            borderRadius: '16px',
            padding: '16px',
            marginBottom: '12px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(56, 189, 248, 0.15)',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            animation: 'fadeInUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #38bdf8 0%, #3b82f6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                }}
              >
                <Sparkles size={16} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.88rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                  Update &amp; Changelog Baru
                </h4>
                <div style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 600 }}>
                  {releaseDate} · Latest Commit
                </div>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsDismissed(true);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '2px',
                borderRadius: '4px',
              }}
              title="Tutup Notifikasi"
            >
              <X size={16} />
            </button>
          </div>

          {/* Commit Name Banner */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '10px',
              padding: '8px 10px',
              fontSize: '0.72rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#93c5fd',
            }}
          >
            <GitCommit size={14} color="#38bdf8" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={commitTitle}>
              <span style={{ color: '#38bdf8', fontWeight: 700 }}>Commit:</span> {commitTitle}
            </div>
          </div>

          {/* Changelog Items List */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              overflowY: 'auto',
              maxHeight: '280px',
              paddingRight: '4px',
            }}
          >
            {changelogItems.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  gap: '8px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                <CheckCircle2 size={14} color="#4ade80" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#f8fafc', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{item.title}</span>
                    <span
                      style={{
                        fontSize: '0.58rem',
                        padding: '1px 5px',
                        borderRadius: '4px',
                        background:
                          item.category === 'Feature'
                            ? 'rgba(56, 189, 248, 0.2)'
                            : item.category === 'Fix'
                            ? 'rgba(74, 222, 128, 0.2)'
                            : 'rgba(192, 132, 252, 0.2)',
                        color:
                          item.category === 'Feature'
                            ? '#38bdf8'
                            : item.category === 'Fix'
                            ? '#4ade80'
                            : '#c084fc',
                        fontWeight: 700,
                      }}
                    >
                      {item.category}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', lineHeight: 1.35 }}>
                    {item.description}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Info */}
          <div
            style={{
              paddingTop: '8px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center',
              fontSize: '0.66rem',
              color: '#64748b',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <GitCommit size={11} color="#4ade80" />
              <span>Pushed to GitHub <strong style={{ color: '#94a3b8' }}>main</strong></span>
            </div>
            <a
              href="https://github.com/AnataSim/wast"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#38bdf8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '2px' }}
            >
              <span>GitHub</span> <ExternalLink size={9} />
            </a>
          </div>
        </div>
      )}

      {/* Floating Action Group Container */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
        {/* Floating Add Title Button (Top) */}
        {onOpenAddModal && (
          <button
            onClick={() => onOpenAddModal()}
            title="Tambah Anime atau Manga Baru"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 16px',
              borderRadius: '30px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.8rem',
              border: '1px solid rgba(147, 197, 253, 0.4)',
              boxShadow: '0 8px 25px rgba(37, 99, 235, 0.45), 0 0 15px rgba(59, 130, 246, 0.3)',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Tambah Judul</span>
          </button>
        )}

        {/* Floating Trigger Button: Update Baru (Bottom) */}
        {!isDismissed && (
          <button
            onClick={() => setIsOpen((prev) => !prev)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 14px',
              borderRadius: '30px',
              background: isOpen
                ? 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)'
                : 'rgba(10, 15, 29, 0.9)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              color: '#ffffff',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4), 0 0 15px rgba(56, 189, 248, 0.2)',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
            }}
          >
        {/* Pulsing Alert Badge Dot */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#38bdf8',
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              background: 'rgba(56, 189, 248, 0.5)',
              animation: 'ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite',
            }}
          />
        </div>

        <GitCommit size={15} color="#38bdf8" />
        <span style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.2px' }}>
          Update Baru
        </span>

        {isOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </button>
      )}
      </div>

      <style>{`
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
};
