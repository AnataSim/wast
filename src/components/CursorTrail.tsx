import React, { useEffect, useRef } from 'react';

interface TrailDot {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  decay: number;
  color: string;
}

// Iconic osu! Cyan & Neon Pink/Purple cursor trail colors
const OSU_COLORS = ['#38bdf8', '#ff66aa', '#3b82f6', '#f43f5e', '#c084fc'];

export const CursorTrail: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // On mobile touch devices, disable cursor trail to prevent touch-drag stutter and ensure silky-smooth 60/120fps scrolling
    const isTouchDevice = typeof window !== 'undefined' && (
      'ontouchstart' in window ||
      (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
      window.matchMedia('(pointer: coarse)').matches
    );

    if (isTouchDevice) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animId: number | null = null;
    let dots: TrailDot[] = [];
    let lastX = -100;
    let lastY = -100;
    let isPointerActive = false;
    let idleTimer: any = null;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Spawn osu! cursortrail orb INSTANTLY at exact coordinates
    const spawnDot = (x: number, y: number, initialRadius = 8) => {
      dots.push({
        x,
        y,
        radius: initialRadius,
        alpha: 0.85,
        decay: 0.038,
        color: OSU_COLORS[Math.floor(Math.random() * OSU_COLORS.length)],
      });

      // Maintain a healthy dense trail even during high-speed flicks
      if (dots.length > 120) {
        dots.shift();
      }
    };

    // Instant zero-delay 1:1 pointer tracking with ultra-dense interpolation
    const updatePointer = (x: number, y: number) => {
      isPointerActive = true;

      if (lastX < 0) {
        lastX = x;
        lastY = y;
      }

      const dx = x - lastX;
      const dy = y - lastY;
      const dist = Math.hypot(dx, dy);

      // Dense sub-pixel interpolation every 2.5px — NO GAPS even on super fast flicks!
      if (dist >= 2.5) {
        const steps = Math.floor(dist / 2.5);
        for (let i = 1; i <= steps; i++) {
          const px = lastX + dx * (i / steps);
          const py = lastY + dy * (i / steps);
          spawnDot(px, py, 7.5);
        }
      } else {
        spawnDot(x, y, 7.5);
      }

      lastX = x;
      lastY = y;

      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        isPointerActive = false;
        lastX = -100;
        lastY = -100;
      }, 600);

      // Start render loop immediately if paused
      if (!animId) {
        animId = requestAnimationFrame(render);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      updatePointer(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        updatePointer(touch.clientX, touch.clientY);
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        lastX = touch.clientX;
        lastY = touch.clientY;
        updatePointer(touch.clientX, touch.clientY);
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });

    // Render Loop - Ultra-dense gapless rendering
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (dots.length > 0 || isPointerActive) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter'; // Neon additive blending

        // 1. Render fading dense trail dots
        for (let i = dots.length - 1; i >= 0; i--) {
          const d = dots[i];
          d.alpha -= d.decay;
          d.radius *= 0.94; // Smooth shrink

          if (d.alpha <= 0 || d.radius <= 0.4) {
            dots.splice(i, 1);
            continue;
          }

          // Outer glowing orb
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
          ctx.fillStyle = d.color;
          ctx.globalAlpha = d.alpha * 0.75;
          ctx.fill();

          // Bright center core
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.radius * 0.45, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.globalAlpha = d.alpha * 0.95;
          ctx.fill();
        }

        ctx.restore();
      }

      // Auto-pause loop when completely idle and all dots faded out
      if (dots.length === 0 && !isPointerActive) {
        animId = null;
        return;
      }

      animId = requestAnimationFrame(render);
    };

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchstart', handleTouchStart);
      if (idleTimer) clearTimeout(idleTimer);
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 99999,
      }}
    />
  );
};
