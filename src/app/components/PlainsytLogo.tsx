import { useState } from 'react';
import { useNavigate } from 'react-router';
import { LOGOS } from '../lib/supabase';
import { cn } from './Primitives';

export function PlainsytMark({ className }: { className?: string }) {
  const [src, setSrc] = useState<string>(LOGOS.icon);

  return (
    <img
      src={src}
      onError={() => {
        if (src !== LOGOS.cdnIcon) setSrc(LOGOS.cdnIcon);
      }}
      alt="Plainsyt BD"
      className={cn('shrink-0 rounded-lg object-contain', className)}
    />
  );
}

export function PlainsytWordmark({
  lang = 'bn',
  className,
}: {
  lang?: 'en' | 'bn';
  className?: string;
}) {
  const defaultSrc = lang === 'bn' ? LOGOS.banglaWhite : LOGOS.englishWhite;
  const cdnSrc = lang === 'bn' ? LOGOS.cdnBanglaWhite : LOGOS.cdnEnglishWhite;
  const [src, setSrc] = useState<string>(defaultSrc);

  return (
    <img
      src={src}
      onError={() => {
        if (src !== cdnSrc) setSrc(cdnSrc);
      }}
      alt={lang === 'bn' ? 'প্লেইনসাইট' : 'Plainsyt'}
      className={cn('h-8 w-auto object-contain select-none', className)}
    />
  );
}

export function PlainsytLogo({
  onNavigateHome,
  className,
}: {
  compact?: boolean;
  lang?: 'en' | 'bn';
  showBothWordmarks?: boolean;
  variant?: 'pill' | 'on-dark';
  onNavigateHome?: () => void;
  className?: string;
}) {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onNavigateHome?.();
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <a
      href="/"
      onClick={handleClick}
      className={cn('inline-flex items-center focus:outline-none transition-transform hover:opacity-95 active:scale-95 plainsyt-nav-logo dark:brightness-0 [html.dark_&]:brightness-0 transition-[filter]', className)}
      aria-label="Plainsyt Home"
    >
      {/* Mobile view: full Plainsyt text english logo */}
      <div className="flex items-center md:hidden">
        <PlainsytWordmark lang="en" className="h-7 w-auto select-none dark:brightness-0 [html.dark_&]:brightness-0 transition-[filter]" />
      </div>

      {/* Desktop view: Plainsyt English Logo */}
      <div className="hidden md:flex items-center">
        <PlainsytWordmark lang="en" className="h-8 lg:h-9 select-none dark:brightness-0 [html.dark_&]:brightness-0 transition-[filter]" />
      </div>
    </a>
  );
}
