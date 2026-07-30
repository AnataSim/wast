import React, { useRef, useState, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, X } from 'lucide-react';

interface ImageCropEditorProps {
  file: File;
  /** 'circle' for avatar, 'rect' for banner */
  shape: 'circle' | 'rect';
  onApply: (result: Blob) => void;
  onCancel: () => void;
}

export const ImageCropEditor: React.FC<ImageCropEditorProps> = ({
  file,
  shape,
  onApply,
  onCancel,
}) => {
  const isGif = file.type === 'image/gif';

  // useState initializer runs EXACTLY ONCE per mount — immune to React 18
  // Strict Mode's double-effect that would revoke the URL prematurely.
  const [objectUrl] = useState<string>(() => URL.createObjectURL(file));

  const [scale, setScale]             = useState(1);
  const [offset, setOffset]           = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging]   = useState(false);
  const [dragStart, setDragStart]     = useState({ x: 0, y: 0 });
  const [naturalSize, setNaturalSize] = useState({ w: 1, h: 1 });
  const [initialScale, setInitialScale] = useState(1);
  const [minScale, setMinScale]       = useState(0.1);
  const [loaded, setLoaded]           = useState(false);

  const imgRef = useRef<HTMLImageElement>(null);

  // Refs for always-fresh values inside event-handler closures
  const scaleRef        = useRef(1);
  const naturalSizeRef  = useRef({ w: 1, h: 1 });
  const minScaleRef     = useRef(0.1);
  const initialScaleRef = useRef(1);

  // Preview container dimensions
  const CONTAINER_W = 360;
  const CONTAINER_H = shape === 'circle' ? 360 : Math.round(360 * 9 / 16); // 202 px for 16:9 banner

  // Circle mask radius (px)
  const CIRCLE_R = CONTAINER_W * 0.44;   // = 158.4 px

  // ─── Clamp: keeps the crop zone always inside the image ──────────────────
  // offset = distance from container centre to image centre
  const clampOff = (
    ox: number,
    oy: number,
    sc: number,
    nat: { w: number; h: number },
  ): { x: number; y: number } => {
    const dw = nat.w * sc;
    const dh = nat.h * sc;
    // Maximum offset before the crop boundary touches the image edge
    const maxX = Math.max(0,
      shape === 'circle' ? dw / 2 - CIRCLE_R : (dw - CONTAINER_W) / 2,
    );
    const maxY = Math.max(0,
      shape === 'circle' ? dh / 2 - CIRCLE_R : (dh - CONTAINER_H) / 2,
    );
    return {
      x: Math.max(-maxX, Math.min(maxX, ox)),
      y: Math.max(-maxY, Math.min(maxY, oy)),
    };
  };

  // ─── On image load ────────────────────────────────────────────────────────
  const handleImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth: nw, naturalHeight: nh } = e.currentTarget;

    // Minimum scale = image must always cover the crop area at center position
    const cropW = shape === 'circle' ? CIRCLE_R * 2 : CONTAINER_W;
    const cropH = shape === 'circle' ? CIRCLE_R * 2 : CONTAINER_H;
    const minSc = Math.max(cropW / nw, cropH / nh);

    // Sync refs immediately (state updates are async)
    naturalSizeRef.current  = { w: nw, h: nh };
    scaleRef.current        = minSc;
    minScaleRef.current     = minSc;
    initialScaleRef.current = minSc;

    setNaturalSize({ w: nw, h: nh });
    setInitialScale(minSc);
    setScale(minSc);
    setMinScale(minSc);
    setOffset({ x: 0, y: 0 });
    setLoaded(true);
  };

  // ─── Drag – Mouse ────────────────────────────────────────────────────────
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  // ─── Drag – Touch ────────────────────────────────────────────────────────
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX - offset.x, y: touch.clientY - offset.y });
  };

  // Global move / up listeners (re-created only when isDragging/dragStart changes)
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const rawX = e.clientX - dragStart.x;
      const rawY = e.clientY - dragStart.y;
      setOffset(clampOff(rawX, rawY, scaleRef.current, naturalSizeRef.current));
    };
    const onMouseUp = () => setIsDragging(false);
    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      const touch = e.touches[0];
      const rawX = touch.clientX - dragStart.x;
      const rawY = touch.clientY - dragStart.y;
      setOffset(clampOff(rawX, rawY, scaleRef.current, naturalSizeRef.current));
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onMouseUp);
    };
  }, [isDragging, dragStart]);

  // ─── Scroll-to-zoom ───────────────────────────────────────────────────────
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.95 : 1.05;
    const newScale = Math.max(
      minScaleRef.current,
      Math.min(initialScaleRef.current * 6, scaleRef.current * factor),
    );
    scaleRef.current = newScale;
    setScale(newScale);
    // Re-clamp offset so the crop area stays inside the image after zoom
    setOffset(cur => clampOff(cur.x, cur.y, newScale, naturalSizeRef.current));
  };

  // ─── Reset ────────────────────────────────────────────────────────────────
  const handleReset = () => {
    const sc = initialScaleRef.current;
    scaleRef.current = sc;
    setScale(sc);
    setOffset({ x: 0, y: 0 });
  };

  // ─── Apply ────────────────────────────────────────────────────────────────
  const handleApply = () => {
    if (isGif) {
      // Canvas can't animate GIFs — upload the original file directly
      onApply(file);
      return;
    }

    const img = imgRef.current;
    if (!img || !loaded) return;

    const outputW = shape === 'circle' ? 256 : 640;
    const outputH = shape === 'circle' ? 256 : 360; // 16:9 for banner

    const canvas = document.createElement('canvas');
    canvas.width  = outputW;
    canvas.height = outputH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (shape === 'circle') {
      ctx.beginPath();
      ctx.arc(outputW / 2, outputH / 2, outputW / 2, 0, Math.PI * 2);
      ctx.clip();
    }

    const dw = naturalSize.w * scale;
    const dh = naturalSize.h * scale;
    const left = CONTAINER_W / 2 + offset.x - dw / 2;
    const top  = CONTAINER_H / 2 + offset.y - dh / 2;
    const sx = outputW / CONTAINER_W;
    const sy = outputH / CONTAINER_H;

    ctx.drawImage(img, left * sx, top * sy, dw * sx, dh * sy);

    // Match output format to the original file format
    const supportedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const outputType = supportedTypes.includes(file.type) ? file.type : 'image/webp';
    const quality = outputType === 'image/png' ? 0.95 : 0.85;

    canvas.toBlob(
      (blob) => { if (blob) onApply(blob); },
      outputType,
      quality,
    );
  };

  // ─── Computed render values ───────────────────────────────────────────────
  const dispW   = naturalSize.w * scale;
  const dispH   = naturalSize.h * scale;
  const imgLeft = CONTAINER_W / 2 + offset.x - dispW / 2;
  const imgTop  = CONTAINER_H / 2 + offset.y - dispH / 2;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 4000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        style={{
          background: '#0d1322',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '18px',
          padding: '24px',
          width: '412px',
          boxShadow: '0 28px 70px rgba(0,0,0,0.9), 0 0 30px rgba(59,130,246,0.18)',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
        }}
      >
        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem', margin: 0 }}>
              Edit Image
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem', margin: '3px 0 0' }}>
              {isGif
                ? '✨ Animated GIF — animasi akan dipertahankan'
                : shape === 'circle'
                ? 'Drag untuk posisi · scroll/slider untuk zoom'
                : 'Drag untuk posisi · scroll/slider untuk zoom banner'}
            </p>
          </div>
          <button
            onClick={onCancel}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '8px',
              padding: '6px',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.65)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Preview ──────────────────────────────────────────────────────── */}
        <div
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onWheel={handleWheel}
          style={{
            width: CONTAINER_W,
            height: CONTAINER_H,
            position: 'relative',
            overflow: 'hidden',
            cursor: isDragging ? 'grabbing' : 'grab',
            background: 'repeating-conic-gradient(#1a2240 0% 25%, #141c35 0% 50%) 0 0 / 20px 20px',
            borderRadius: shape === 'rect' ? '10px' : '0',
            margin: '0 auto',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            touchAction: 'none',
          }}
        >
          <img
            ref={imgRef}
            src={objectUrl}
            onLoad={handleImgLoad}
            alt="crop preview"
            draggable={false}
            style={{
              position: 'absolute',
              width: `${dispW}px`,
              height: `${dispH}px`,
              left: `${imgLeft}px`,
              top: `${imgTop}px`,
              pointerEvents: 'none',
              imageRendering: 'auto',
            }}
          />

          {/* Circle mask overlay */}
          {shape === 'circle' && (
            <svg
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                overflow: 'visible',
              }}
              viewBox={`0 0 ${CONTAINER_W} ${CONTAINER_H}`}
            >
              <defs>
                <mask id="ice-crop-mask">
                  <rect width={CONTAINER_W} height={CONTAINER_H} fill="white" />
                  <circle cx={CONTAINER_W / 2} cy={CONTAINER_H / 2} r={CIRCLE_R} fill="black" />
                </mask>
              </defs>
              <rect
                width={CONTAINER_W}
                height={CONTAINER_H}
                fill="rgba(0,0,0,0.62)"
                mask="url(#ice-crop-mask)"
              />
              <circle
                cx={CONTAINER_W / 2}
                cy={CONTAINER_H / 2}
                r={CIRCLE_R}
                fill="none"
                stroke="rgba(255,255,255,0.85)"
                strokeWidth="1.5"
                strokeDasharray="6 3"
              />
            </svg>
          )}

          {/* GIF badge */}
          {isGif && (
            <div
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                color: '#fff',
                fontSize: '0.62rem',
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: '6px',
                letterSpacing: '1.5px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
              }}
            >
              GIF
            </div>
          )}

          {/* Drag hint */}
          {loaded && !isDragging && (
            <div
              style={{
                position: 'absolute',
                bottom: 10,
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0,0,0,0.55)',
                backdropFilter: 'blur(6px)',
                color: 'rgba(255,255,255,0.6)',
                fontSize: '0.62rem',
                padding: '4px 10px',
                borderRadius: '20px',
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
                letterSpacing: '0.3px',
              }}
            >
              🖱 Drag to reposition · scroll to zoom
            </div>
          )}
        </div>

        {/* ── Zoom slider ──────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ZoomOut size={16} color="rgba(255,255,255,0.4)" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <input
              type="range"
              min={minScale}
              max={initialScale * 6}
              step={0.005}
              value={scale}
              onChange={(e) => {
                const newScale = parseFloat(e.target.value);
                scaleRef.current = newScale;
                setScale(newScale);
                setOffset(cur => clampOff(cur.x, cur.y, newScale, naturalSizeRef.current));
              }}
              style={{ width: '100%', accentColor: '#3b82f6', cursor: 'pointer' }}
            />
          </div>
          <ZoomIn size={16} color="rgba(255,255,255,0.4)" style={{ flexShrink: 0 }} />
          <button
            onClick={handleReset}
            title="Reset position & zoom"
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '7px',
              padding: '5px 8px',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.55)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <RotateCcw size={13} />
          </button>
        </div>

        {/* ── Action buttons ───────────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={handleReset}
            style={{
              background: 'none',
              border: 'none',
              color: '#60a5fa',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              padding: '6px 0',
            }}
          >
            Reset
          </button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onCancel}
              style={{
                padding: '8px 22px',
                borderRadius: '9px',
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.06)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              style={{
                padding: '8px 24px',
                borderRadius: '9px',
                border: 'none',
                background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 700,
                boxShadow: '0 4px 14px rgba(59,130,246,0.45)',
              }}
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
