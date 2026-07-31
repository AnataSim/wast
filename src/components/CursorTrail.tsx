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
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const maxDots = 120;
    const stepDistance = 2.8;
    const decayRate = 0.038;
    const dotRadius = 7.5;

    let animId: number | null = null;
    let dots: TrailDot[] = [];

    // Target pointer coordinates set by mouse/touch events
    let targetX = -100;
    let targetY = -100;
    // Current interpolated trail coordinates processed per animation frame
    let currX = -100;
    let currY = -100;

    let isPointerActive = false;
    let idleTimer: any = null;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Spawn osu! cursortrail orb INSTANTLY at exact coordinates
    const spawnDot = (x: number, y: number, initialRadius = dotRadius) => {
      dots.push({
        x,
        y,
        radius: initialRadius,
        alpha: 0.85,
        decay: decayRate,
        color: OSU_COLORS[Math.floor(Math.random() * OSU_COLORS.length)],
      });

      // Maintain a healthy dense trail even during high-speed flicks
      if (dots.length > maxDots) {
        dots.shift();
      }
    };

    // Instant zero-cost pointer target updater (no heavy processing in event handlers)
    const setPointerTarget = (x: number, y: number) => {
      isPointerActive = true;
      targetX = x;
      targetY = y;

      if (currX < 0) {
        currX = x;
        currY = y;
      }

      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        isPointerActive = false;
        currX = -100;
        currY = -100;
      }, 500);

      // Start render loop immediately if paused
      if (!animId) {
        animId = requestAnimationFrame(render);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      setPointerTarget(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        setPointerTarget(touch.clientX, touch.clientY);
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        currX = touch.clientX;
        currY = touch.clientY;
        setPointerTarget(touch.clientX, touch.clientY);
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });

    // Render Loop - Frame-synced ultra-dense gapless rendering (60/120/144 FPS)
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Smoothly glide currX/currY towards targetX/targetY every single frame tick
      if (isPointerActive && targetX >= 0) {
        const easeFactor = 0.45; // Smooth fluid spring factor
        const dx = targetX - currX;
        const dy = targetY - currY;
        const dist = Math.hypot(dx, dy);

        if (dist > 0.5) {
          const stepX = dx * easeFactor;
          const stepY = dy * easeFactor;
          const stepDist = Math.hypot(stepX, stepY);

          // Spawn 1 to 3 dots max per frame tick for liquid-smooth fluid motion
          const dotCount = Math.max(1, Math.min(Math.floor(stepDist / stepDistance), 3));
          for (let i = 1; i <= dotCount; i++) {
            const px = currX + (stepX / dotCount) * i;
            const py = currY + (stepY / dotCount) * i;
            spawnDot(px, py, dotRadius);
          }

          currX += stepX;
          currY += stepY;
        }
      }

      // 2. Render fading dense trail dots
      if (dots.length > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter'; // Neon additive blending

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
