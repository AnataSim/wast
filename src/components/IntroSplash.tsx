import React, { useEffect, useRef, useState } from 'react';
import { Film, Volume2, VolumeX, Sparkles, Zap, Play, FastForward, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface IntroSplashProps {
  onComplete: () => void;
  autoStart?: boolean;
}

export const IntroSplash: React.FC<IntroSplashProps> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const PHASES = [
    'INITIALIZING NEON CORE...',
    'LOADING ANIME & MANGA VAULT...',
    'CONNECTING FIRESTORE CLOUD...',
    'SYSTEM ONLINE - WELCOME BACK!'
  ];

  // Helper for Web Audio API sound effects (no external mp3 files needed)
  const playSciFiSound = (type: 'blip' | 'burst' | 'click' | 'hum') => {
    if (isAudioMuted) return;
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          audioCtxRef.current = new AudioContextClass();
        }
      }

      const ctx = audioCtxRef.current;
      if (!ctx) return;

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;

      if (type === 'blip') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'click') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.06);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.06);
      } else if (type === 'burst') {
        // High impact sci-fi launch sound
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(150, now);
        osc1.frequency.exponentialRampToValueAtTime(1200, now + 0.4);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(300, now);
        osc2.frequency.exponentialRampToValueAtTime(600, now + 0.5);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.5);
        osc2.stop(now + 0.5);
      }
    } catch (e) {
      console.warn('AudioContext sound effect playback issue:', e);
    }
  };

  // Canvas 60FPS Particles Simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle pool
    const particleCount = 70;
    const particles = Array.from({ length: particleCount }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      radius: Math.random() * 2.5 + 1,
      color: Math.random() > 0.5 ? '#3b82f6' : Math.random() > 0.5 ? '#a855f7' : '#06b6d4',
      alpha: Math.random() * 0.7 + 0.3,
    }));

    let mouseX = width / 2;
    let mouseY = height / 2;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Background ambient gradient
      const grad = ctx.createRadialGradient(mouseX, mouseY, 10, width / 2, height / 2, Math.max(width, height));
      grad.addColorStop(0, 'rgba(15, 23, 42, 0.95)');
      grad.addColorStop(0.5, 'rgba(8, 12, 22, 0.98)');
      grad.addColorStop(1, 'rgba(3, 7, 18, 1)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Cyber Grid lines
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.04)';
      ctx.lineWidth = 1;
      const gridSize = 60;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw particle connections
      for (let i = 0; i < particleCount; i++) {
        for (let j = i + 1; j < particleCount; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(168, 85, 247, ${0.15 * (1 - dist / 110)})`;
            ctx.lineWidth = 0.7;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Update & render particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      });

      animFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animFrameId);
    };
  }, []);

  // Progress Bar & Phase State Machine
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsReady(true);
          playSciFiSound('blip');
          return 100;
        }
        const next = prev + 2;

        if (next >= 25 && next < 55 && currentPhase === 0) {
          setCurrentPhase(1);
          playSciFiSound('blip');
        } else if (next >= 55 && next < 85 && currentPhase === 1) {
          setCurrentPhase(2);
          playSciFiSound('blip');
        } else if (next >= 85 && currentPhase === 2) {
          setCurrentPhase(3);
          playSciFiSound('blip');
        }

        return next;
      });
    }, 40);

    return () => clearInterval(interval);
  }, [currentPhase]);

  const handleEnterApp = () => {
    playSciFiSound('burst');

    // Confetti explosion on enter
    try {
      confetti({
        particleCount: 80,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#a855f7', '#38bdf8', '#c084fc'],
      });
    } catch (e) {}

    setIsExiting(true);
    setTimeout(() => {
      onComplete();
    }, 600);
  };

  const handleSkip = () => {
    playSciFiSound('click');
    setIsExiting(true);
    setTimeout(() => {
      onComplete();
    }, 400);
  };

  return (
    <div
      className={`intro-splash-overlay ${isExiting ? 'intro-splash-fadeout' : ''}`}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff',
        fontFamily: "'Inter', sans-serif",
        overflow: 'hidden',
        background: '#030712',
      }}
    >
      {/* Background Interactive Canvas */}
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />

      {/* Top Bar Utilities */}
      <div
        style={{
          position: 'absolute',
          top: '24px',
          left: '24px',
          right: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.6)', background: 'rgba(15, 23, 42, 0.6)', padding: '6px 14px', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <Zap size={14} color="#38bdf8" className="intro-pulse-icon" />
          <span style={{ fontWeight: 600, letterSpacing: '0.05em' }}>WAST SYSTEM v2.5</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => {
              setIsAudioMuted(!isAudioMuted);
              playSciFiSound('click');
            }}
            style={{
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: isAudioMuted ? '#94a3b8' : '#38bdf8',
              borderRadius: '20px',
              padding: '6px 14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              transition: 'all 0.2s ease',
            }}
            title={isAudioMuted ? 'Unmute Sound FX' : 'Mute Sound FX'}
          >
            {isAudioMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            <span>{isAudioMuted ? 'Muted' : 'Audio On'}</span>
          </button>

          <button
            onClick={handleSkip}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              borderRadius: '20px',
              padding: '6px 16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              fontWeight: 600,
              backdropFilter: 'blur(10px)',
              transition: 'all 0.2s ease',
            }}
          >
            <FastForward size={14} />
            <span>Lewati</span>
          </button>
        </div>
      </div>

      {/* Main Center Animated Card */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          maxWidth: '560px',
          width: '90%',
          padding: '48px 36px',
          borderRadius: '28px',
          background: 'rgba(10, 15, 29, 0.75)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          boxShadow: '0 0 60px rgba(59, 130, 246, 0.2), inset 0 0 20px rgba(168, 85, 247, 0.1)',
        }}
      >
        {/* Animated Glowing Logo Frame */}
        <div className="intro-logo-glow-wrapper" style={{ marginBottom: '28px', position: 'relative' }}>
          <div className="intro-ring-orbit" />
          <div
            style={{
              width: '90px',
              height: '90px',
              borderRadius: '26px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #a855f7 50%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 45px rgba(59, 130, 246, 0.6), 0 0 90px rgba(168, 85, 247, 0.3)',
              position: 'relative',
              zIndex: 2,
            }}
          >
            <Film size={46} color="#ffffff" className="intro-logo-icon" />
          </div>
        </div>

        {/* Cyber Title with Glitch/Shimmer FX */}
        <h1
          className="intro-glitch-title"
          style={{
            fontSize: '3rem',
            fontWeight: 900,
            letterSpacing: '0.04em',
            lineHeight: 1.1,
            marginBottom: '10px',
            background: 'linear-gradient(135deg, #ffffff 30%, #38bdf8 70%, #c084fc 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 30px rgba(59, 130, 246, 0.4)',
          }}
        >
          WAST
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '28px' }}>
          <span style={{ fontSize: '0.9rem', color: '#94a3b8', letterSpacing: '0.15em', fontWeight: 600, textTransform: 'uppercase' }}>
            Anime &amp; Manga Vault
          </span>
          <span style={{ background: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59, 130, 246, 0.4)', color: '#38bdf8', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700 }}>
            TSX PRO
          </span>
        </div>

        {/* Phase Status Text Indicator */}
        <div
          style={{
            fontSize: '0.88rem',
            color: isReady ? '#4ade80' : '#cbd5e1',
            letterSpacing: '0.08em',
            marginBottom: '20px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 600,
          }}
        >
          {isReady ? (
            <CheckCircle2 size={16} color="#4ade80" />
          ) : (
            <Sparkles size={15} color="#38bdf8" className="intro-spin-sparkle" />
          )}
          <span>{PHASES[currentPhase]}</span>
        </div>

        {/* High-tech Progress Bar */}
        <div
          style={{
            width: '100%',
            height: '8px',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            overflow: 'hidden',
            marginBottom: '32px',
            position: 'relative',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #3b82f6 0%, #a855f7 50%, #38bdf8 100%)',
              borderRadius: '10px',
              boxShadow: '0 0 15px rgba(56, 189, 248, 0.8)',
              transition: 'width 0.1s linear',
            }}
          />
        </div>

        {/* Enter Action Button */}
        <button
          onClick={handleEnterApp}
          className={`intro-enter-btn ${isReady ? 'intro-btn-ready' : ''}`}
          style={{
            width: '100%',
            padding: '16px 28px',
            borderRadius: '16px',
            fontSize: '1.05rem',
            fontWeight: 800,
            letterSpacing: '0.05em',
            color: '#ffffff',
            background: isReady
              ? 'linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #0284c7 100%)'
              : 'rgba(255, 255, 255, 0.08)',
            border: isReady ? '1px solid rgba(147, 197, 253, 0.5)' : '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: isReady ? '0 0 35px rgba(59, 130, 246, 0.5)' : 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Play size={20} fill={isReady ? '#ffffff' : 'none'} color="#ffffff" />
          <span>{isReady ? 'MASUK KE WAST' : 'MEMUAT SISTEM...'}</span>
        </button>

        <p style={{ marginTop: '16px', fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.4)' }}>
          Klik tombol di atas untuk membuka aplikasi secara penuh
        </p>
      </div>
    </div>
  );
};
