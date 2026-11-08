import { useState } from 'react';
import type { Article } from '../types';
import { cn } from './Primitives';

const PLATE_PALETTE: Record<Article['imageType'], { bg: string; accent: string; tags: string[]; label: string }> = {
  drone: { bg: 'linear-gradient(135deg, #04301f 0%, #0f5e3e 55%, #1d4ed8 100%)', accent: '#38b17e', tags: ['UAV TELEMETRY', 'NDRE'], label: 'Agri-Tech & Drone Sensing' },
  lab: { bg: 'linear-gradient(135deg, #111827 0%, #065f46 55%, #10b981 100%)', accent: '#6ee7b7', tags: ['IN VITRO', 'ASSAY'], label: 'Laboratory Research' },
  solar: { bg: 'linear-gradient(135deg, #1f2937 0%, #04301f 50%, #f59e0b 100%)', accent: '#fbbf24', tags: ['SOLAR COLD CHAIN', 'kWp'], label: 'Solar Post-Harvest' },
  floating: { bg: 'linear-gradient(135deg, #021a11 0%, #17754f 55%, #f2c14e 100%)', accent: '#bbf0d8', tags: ['AGRONOMY', 'FIELD DATA'], label: 'Crops & Agronomy' },
  biotech: { bg: 'linear-gradient(135deg, #1e1b4b 0%, #064e3b 55%, #34d399 100%)', accent: '#a78bfa', tags: ['GENOMICS', 'BIOTECH'], label: 'Biotechnology' },
  sensor: { bg: 'linear-gradient(135deg, #042f2e 0%, #115e59 55%, #2dd4bf 100%)', accent: '#5eead4', tags: ['IoT SENSOR', 'LoRaWAN'], label: 'Precision Soil Sensor' },
  water: { bg: 'linear-gradient(135deg, #0c4a6e 0%, #065f46 55%, #38bdf8 100%)', accent: '#7dd3fc', tags: ['HYDROLOGY', 'SALINITY'], label: 'Climate & Hydrology' },
  fisheries: { bg: 'linear-gradient(135deg, #082f49 0%, #0f766e 55%, #f97316 100%)', accent: '#fdba74', tags: ['AQUACULTURE', 'ECOLOGY'], label: 'Fisheries & Aquaculture' },
};

export function ImageGraphic({
  type,
  coverImageUrl,
  title,
  className,
  plate,
  onClickPhoto,
}: {
  type: Article['imageType'];
  coverImageUrl?: string;
  title?: string;
  className?: string;
  plate?: string;
  onClickPhoto?: (src: string) => void;
}) {
  const m = PLATE_PALETTE[type] ?? PLATE_PALETTE.floating;

  const [imgFailed, setImgFailed] = useState(false);
  const showCover = Boolean(coverImageUrl) && !imgFailed;

  return (
    <div
      onClick={(e) => {
        if (showCover && onClickPhoto && coverImageUrl) {
          e.stopPropagation();
          onClickPhoto(coverImageUrl);
        }
      }}
      style={!showCover ? { background: m.bg } : undefined}
      className={cn(
        'relative overflow-hidden bg-pine-900',
        showCover && onClickPhoto && 'cursor-zoom-in',
        className,
      )}
    >
      {showCover ? (
        <img
          src={coverImageUrl}
          alt={title || m.label}
          onError={() => setImgFailed(true)}
          className="absolute inset-0 size-full object-cover transition duration-500 hover:scale-[1.02]"
        />
      ) : (
        <svg viewBox="0 0 600 320" className="absolute inset-0 size-full opacity-35" aria-hidden>
          <circle cx="480" cy="90" r="64" fill={m.accent} fillOpacity="0.35" />
          <path
            d="M0 240 Q 150 190 300 225 T 600 205 L 600 320 L 0 320 Z"
            fill={m.accent}
            fillOpacity="0.22"
          />
          <path
            d="M0 270 Q 180 230 360 260 T 600 245"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2"
            strokeOpacity="0.4"
          />
        </svg>
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#021a11]/75 via-transparent to-[#021a11]/15" />
      <svg className="pointer-events-none absolute inset-0 size-full opacity-20" aria-hidden>
        <defs>
          <pattern id={`g-${type}`} width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M48 0H0V48" fill="none" stroke="#fff" strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#g-${type})`} />
      </svg>
      <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-1.5">
        {m.tags.map((t) => (
          <span
            key={t}
            className="rounded-[4px] border border-white/40 bg-black/40 px-1.5 py-0.5 font-mono text-[11px] tracking-wide text-white backdrop-blur-sm"
          >
            {t}
          </span>
        ))}
      </div>
      {plate && (
        <span className="pointer-events-none absolute bottom-3 right-3 font-mono text-[11px] tracking-[0.16em] text-white/80">
          {plate}
        </span>
      )}
    </div>
  );
}
