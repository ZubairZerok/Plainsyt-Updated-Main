/** Compact YouTube logo + Shorts label (never the red pill badge). */
export function YouTubeMark({
  className = '',
  size = 'sm',
}: {
  className?: string;
  size?: 'sm' | 'md';
}) {
  const icon = size === 'md' ? 'size-4' : 'size-3.5';
  const text = size === 'md' ? 'text-[12px]' : 'text-[11px]';
  return (
    <span className={`inline-flex items-center gap-1 font-semibold text-white/95 ${className}`}>
      <svg className={`${icon} shrink-0 fill-[#FF0000]`} viewBox="0 0 24 24" aria-hidden>
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
      <span className={`${text} tracking-tight`}>Shorts</span>
    </span>
  );
}

export function buildYouTubeEmbedSrc(
  videoId: string,
  opts: { autoplay?: boolean; muted?: boolean; loop?: boolean } = {},
) {
  const { autoplay = true, muted = true, loop = true } = opts;
  const params = new URLSearchParams({
    autoplay: autoplay ? '1' : '0',
    mute: muted ? '1' : '0',
    controls: '0',
    modestbranding: '1',
    playsinline: '1',
    rel: '0',
    fs: '0',
    iv_load_policy: '3',
    disablekb: '1',
    enablejsapi: '1',
    origin: typeof window !== 'undefined' ? window.location.origin : '',
  });
  if (loop) {
    params.set('loop', '1');
    params.set('playlist', videoId);
  }
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}

export function ytPostCommand(iframe: HTMLIFrameElement | null, func: string, args: unknown[] = []) {
  iframe?.contentWindow?.postMessage(
    JSON.stringify({ event: 'command', func, args }),
    'https://www.youtube-nocookie.com',
  );
}

/** Parse "1:23" / "0:45" style duration labels into seconds. */
export function parseDurationLabel(label?: string): number {
  if (!label) return 30;
  const parts = label.split(':').map((p) => Number(p));
  if (parts.some((n) => Number.isNaN(n))) return 30;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 30;
}
