'use client';

import { useEffect, useState, useTransition } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Top-of-page progress bar. Renders a thin animated bar that:
 *   - Starts when a navigation begins (link click, form submit, redirect)
 *   - Completes when the new page renders
 *
 * Drop this in the root layout once. No props needed.
 */
export default function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  // Reset to 100% then hide whenever pathname/searchParams change
  // (i.e. after the new page has rendered)
  useEffect(() => {
    setProgress(100);
    const t = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 200);
    return () => clearTimeout(t);
  }, [pathname, searchParams]);

  // Hijack link clicks and form submits to start the bar immediately
  useEffect(() => {
    const start = () => {
      setVisible(true);
      setProgress(15);
      // Slow climb toward 90% so user sees motion even on long requests
      let p = 15;
      const interval = setInterval(() => {
        p = Math.min(p + Math.random() * 8, 90);
        setProgress(p);
      }, 200);
      return () => clearInterval(interval);
    };

    let stopFn: (() => void) | null = null;

    const onClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest('a');
      if (!target) return;
      const href = target.getAttribute('href');
      if (!href || href.startsWith('#') || target.target === '_blank' || target.hasAttribute('download')) return;
      // Skip external links
      if (href.startsWith('http') && !href.includes(window.location.host)) return;
      stopFn = start();
    };

    const onSubmit = () => {
      stopFn = start();
    };

    document.addEventListener('click', onClick);
    document.addEventListener('submit', onSubmit);
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('submit', onSubmit);
      stopFn?.();
    };
  }, []);

  if (!visible && progress === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        background: 'transparent',
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${progress}%`,
          background: 'var(--accent, #00ff88)',
          boxShadow: '0 0 6px var(--accent, #00ff88)',
          transition: progress >= 100 ? 'width 200ms ease-out, opacity 200ms ease-out' : 'width 200ms ease-out',
          opacity: progress >= 100 ? 0 : 1,
        }}
      />
    </div>
  );
}
