import { useEffect, useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import type { LightboxPayload } from '../types';
import { cn } from './Primitives';
import { toBengaliNumerals } from '../utils/pureLogic';

export function PhotoLightboxModal({
  payload,
  onClose,
  onNavigateProfile,
}: {
  payload: LightboxPayload | null;
  onClose: () => void;
  onNavigateProfile?: (userId: string) => void;
}) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (payload) {
      setIndex(payload.index || 0);
      setZoom(1);
      setImgError(false);
    }
  }, [payload]);

  useEffect(() => {
    if (!payload) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && payload.images.length > 1) {
        setIndex((i) => (i + 1) % payload.images.length);
        setZoom(1);
      }
      if (e.key === 'ArrowLeft' && payload.images.length > 1) {
        setIndex((i) => (i - 1 + payload.images.length) % payload.images.length);
        setZoom(1);
      }
      if (e.key === '+' || e.key === '=') setZoom((z) => Math.min(2.5, +(z + 0.25).toFixed(2)));
      if (e.key === '-') setZoom((z) => Math.max(0.75, +(z - 0.25).toFixed(2)));
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [payload, onClose]);

  if (!payload || payload.images.length === 0) return null;

  const currentSrc = payload.images[index] ?? payload.images[0];
  const total = payload.images.length;

  return (
    <div
      className="fixed inset-0 z-[110] flex flex-col bg-black/95 text-white backdrop-blur-md lightbox-ui"
      role="dialog"
      aria-modal="true"
      data-white-icon="true"
      aria-label={payload.title || 'Photo viewer'}
    >
      {/* Top Toolbar */}
      <div className="relative flex items-center justify-between border-b border-white/10 px-3 py-2 sm:px-4">
        {/* Left spacer for centering balance */}
        <div className="w-9 sm:w-10" />

        {/* Center: Zoom controls with Serial counter directly below, centered in middle alignment */}
        <div className="flex flex-col items-center justify-center gap-1">
          <div className="flex items-center gap-1 sm:gap-1.5">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.75, +(z - 0.25).toFixed(2)))}
              aria-label="Zoom out"
              className="flex size-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition"
            >
              <ZoomOut className="size-4" />
            </button>
            <span className="min-w-[42px] text-center font-bangla font-bold text-xs text-white/90">
              {toBengaliNumerals(Math.round(zoom * 100))}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(2.5, +(z + 0.25).toFixed(2)))}
              aria-label="Zoom in"
              className="flex size-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition"
            >
              <ZoomIn className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setZoom(1)}
              aria-label="Reset zoom"
              className="flex size-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition"
            >
              <RotateCcw className="size-4" />
            </button>
            <a
              href={currentSrc}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open original image in new tab"
              className="flex size-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition"
            >
              <ExternalLink className="size-4" />
            </a>
          </div>

          {/* Photo serial counter directly below zoom controls, centered in middle alignment */}
          <div className="flex items-center justify-center">
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-0.5 font-bangla text-xs font-bold text-white shadow-sm">
              {toBengaliNumerals(index + 1)} / {toBengaliNumerals(total)}
            </span>
          </div>
        </div>

        {/* Right: Close button */}
        <div className="flex items-center justify-end w-9 sm:w-10">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close photo popup"
            className="flex size-9 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 transition"
          >
            <X className="size-5" />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div
        className="relative flex flex-1 items-center justify-center overflow-auto p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {total > 1 && (
          <button
            type="button"
            onClick={() => {
              setIndex((i) => (i - 1 + total) % total);
              setZoom(1);
              setImgError(false);
            }}
            aria-label="Previous photo"
            className="absolute left-4 z-10 flex size-11 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white transition hover:bg-black/80"
          >
            <ChevronLeft className="size-6" />
          </button>
        )}

        <img
          src={imgError ? '/images/japan_cucumber_robot.jpg' : currentSrc}
          alt={payload.title || 'Full view'}
          onError={() => setImgError(true)}
          onClick={() => setZoom((z) => (z === 1 ? 1.5 : 1))}
          style={{ transform: `scale(${zoom})` }}
          className="max-h-[78vh] max-w-[92vw] cursor-zoom-in rounded-lg object-contain shadow-2xl transition-transform duration-200"
          decoding="async"
        />

        {total > 1 && (
          <button
            type="button"
            onClick={() => {
              setIndex((i) => (i + 1) % total);
              setZoom(1);
              setImgError(false);
            }}
            aria-label="Next photo"
            className="absolute right-4 z-10 flex size-11 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white transition hover:bg-black/80"
          >
            <ChevronRight className="size-6" />
          </button>
        )}
      </div>

      {/* Bottom Caption & Filmstrip */}
      <div className="border-t border-white/10 bg-black/70 px-4 py-3">
        <div className="mx-auto flex max-w-4xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            {payload.title && (
              <p className="truncate font-bangla text-[15px] font-semibold text-white">{payload.title}</p>
            )}
            {payload.subtitle && (
              <p className="line-clamp-1 font-bangla text-[12.5px] text-white/70">{payload.subtitle}</p>
            )}
          </div>
          {total > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              {payload.images.map((src, i) => (
                <button
                  key={src + i}
                  type="button"
                  onClick={() => {
                    setIndex(i);
                    setZoom(1);
                  }}
                  className={cn(
                    'size-12 shrink-0 overflow-hidden rounded-md border-2 transition',
                    i === index ? 'border-[#38b17e] scale-105' : 'border-transparent opacity-55 hover:opacity-90',
                  )}
                >
                  <img src={src} alt="" className="size-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
