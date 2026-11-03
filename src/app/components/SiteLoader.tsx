import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export function SiteLoader({ onComplete }: { onComplete?: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const subTextRef = useRef<HTMLParagraphElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          gsap.to(containerRef.current, {
            opacity: 0,
            duration: 0.5,
            ease: 'power2.inOut',
            onComplete: () => {
              setVisible(false);
              onComplete?.();
            },
          });
        },
      });

      tl.fromTo(
        logoRef.current,
        { opacity: 0, scale: 0.94 },
        { opacity: 1, scale: 1, duration: 0.6, ease: 'power2.out' },
      )
        .fromTo(
          subTextRef.current,
          { opacity: 0, y: 6 },
          { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' },
          '-=0.2',
        )
        .fromTo(
          barRef.current,
          { opacity: 0, scaleX: 0 },
          { opacity: 1, scaleX: 1, duration: 0.7, ease: 'power2.inOut' },
          '-=0.2',
        )
        .to({}, { duration: 0.35 });
    }, containerRef);

    return () => ctx.revert();
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-[#fdfaf5] text-slate-800 transition-opacity"
      style={{ touchAction: 'none' }}
    >
      <div className="relative flex flex-col items-center px-4">
        {/* English Logo turned website lime green (#03EF62) via CSS mask */}
        <div
          ref={logoRef}
          className="relative flex items-center justify-center"
        >
          <div
            className="h-24 sm:h-32 w-80 sm:w-[460px] max-w-[92vw] bg-[#03EF62]"
            style={{
              maskImage: 'url(/logos/English.png)',
              WebkitMaskImage: 'url(/logos/English.png)',
              maskRepeat: 'no-repeat',
              WebkitMaskRepeat: 'no-repeat',
              maskSize: 'contain',
              WebkitMaskSize: 'contain',
              maskPosition: 'center',
              WebkitMaskPosition: 'center',
            }}
            role="img"
            aria-label="PLAiNSYT"
          />
        </div>

        {/* Subtitle tag */}
        <p
          ref={subTextRef}
          className="mt-4 font-mono text-[12px] sm:text-[13px] font-semibold tracking-[0.24em] text-slate-500 uppercase"
        >
          Agri-Tech Platform · Bangladesh
        </p>

        {/* Thicker, modern loading bar with clean styling and no glow */}
        <div className="mt-7 h-2.5 w-56 sm:w-72 overflow-hidden rounded-full bg-slate-200/90 border border-slate-300/60 p-0.5">
          <div
            ref={barRef}
            className="h-full w-full rounded-full bg-[#03EF62] origin-left"
          />
        </div>
      </div>
    </div>
  );
}
