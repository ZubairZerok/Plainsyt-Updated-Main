import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCw, Check, X, RefreshCw } from 'lucide-react';
import { Modal } from './Primitives';

interface AvatarCropModalProps {
  open: boolean;
  imageSrc: string;
  onClose: () => void;
  onApply: (croppedDataUrl: string) => void;
}

export function AvatarCropModal({
  open,
  imageSrc,
  onClose,
  onApply,
}: AvatarCropModalProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0); // in degrees: 0, 90, 180, 270
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Reset state whenever new image is loaded
  useEffect(() => {
    if (open) {
      setZoom(1);
      setRotation(0);
      setPan({ x: 0, y: 0 });
    }
  }, [open, imageSrc]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    setZoom((prev) => Math.min(3.5, Math.max(1, +(prev + delta).toFixed(2))));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  };

  const handleCropAndSave = () => {
    const img = imgRef.current;
    if (!img) return;

    const outputSize = 400;
    const canvas = document.createElement('canvas');
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Viewport dimensions in modal (260px)
    const viewportSize = 260;
    const scaleFactor = outputSize / viewportSize;

    ctx.save();
    // Center of canvas
    ctx.translate(outputSize / 2, outputSize / 2);
    // Apply user translation scaled to output canvas
    ctx.translate(pan.x * scaleFactor, pan.y * scaleFactor);
    // Apply user rotation
    ctx.rotate((rotation * Math.PI) / 180);
    // Apply user zoom
    ctx.scale(zoom, zoom);

    // Draw the image centered
    // Compute base display dimensions in 260px viewport
    const imgAspect = img.naturalWidth / img.naturalHeight;
    let baseWidth = viewportSize;
    let baseHeight = viewportSize;
    if (imgAspect > 1) {
      baseWidth = viewportSize * imgAspect;
    } else {
      baseHeight = viewportSize / imgAspect;
    }

    const drawWidth = baseWidth * scaleFactor;
    const drawHeight = baseHeight * scaleFactor;

    ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    ctx.restore();

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    onApply(dataUrl);
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="crop-modal-title"
    >
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0 bg-black/75 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md my-auto overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#0b1e15] shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 px-5 py-3.5">
          <div>
            <h3 id="crop-modal-title" className="text-sm font-bold text-slate-900 dark:text-white font-sans">
              প্রোফাইল ছবি ক্রপ ও জুম
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              ছবিটি টেনে সরিয়ে বৃত্তের মাঝে বসান এবং জুম নিয়ন্ত্রণ করুন
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Viewport Area */}
        <div className="flex flex-col items-center justify-center p-6 bg-slate-50/60 dark:bg-[#06120d]/60">
          <div
            className="relative size-[260px] cursor-grab active:cursor-grabbing overflow-hidden rounded-full select-none shadow-inner border-2 border-[#03EF62]"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onWheel={handleWheel}
          >
            {/* The Image being transformed */}
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) rotate(${rotation}deg) scale(${zoom})`,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 100ms ease-out',
              }}
            >
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Crop preview"
                className="max-w-none select-none pointer-events-none object-contain"
                style={{
                  width: '260px',
                  height: '260px',
                  objectFit: 'cover',
                }}
                draggable={false}
              />
            </div>

            {/* Subtle alignment crosshair / guide */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-20">
              <div className="h-full w-px bg-white"></div>
              <div className="w-full h-px bg-white absolute"></div>
            </div>
          </div>

          <p className="mt-2 text-[10.5px] text-slate-400 dark:text-slate-500 font-sans">
            ছবি ড্র্যাগ করে পজিশন করুন অথবা হুইল ঘুরিয়ে জুম করুন
          </p>
        </div>

        {/* Controls Bar */}
        <div className="space-y-4 px-6 py-4 border-t border-slate-100 dark:border-white/10">
          {/* Zoom Control */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(1, +(z - 0.2).toFixed(2)))}
              aria-label="Zoom out"
              className="flex size-7 shrink-0 items-center justify-center rounded-full border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition"
            >
              <ZoomOut className="size-3.5" />
            </button>
            <div className="flex-1 flex items-center gap-2">
              <input
                type="range"
                min="1"
                max="3.5"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 dark:bg-white/20 accent-[#03EF62]"
              />
              <span className="w-9 text-right font-mono text-[11px] text-slate-500 dark:text-slate-400">
                {zoom.toFixed(1)}x
              </span>
            </div>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(3.5, +(z + 0.2).toFixed(2)))}
              aria-label="Zoom in"
              className="flex size-7 shrink-0 items-center justify-center rounded-full border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition"
            >
              <ZoomIn className="size-3.5" />
            </button>
          </div>

          {/* Action Tools: Rotate & Reset */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRotate}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-white/10 px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10 transition"
              >
                <RotateCw className="size-3" /> ৯০° ঘোরান
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-white/10 px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10 transition"
              >
                <RefreshCw className="size-3" /> রিসেট
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full px-4 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleCropAndSave}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#03EF62] px-4 py-1.5 text-xs font-bold text-[#061621] shadow-sm hover:bg-[#02d955] active:scale-95 transition"
              >
                <Check className="size-3.5" /> ক্রপ করুন
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
