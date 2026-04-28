'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stop any in-progress animation
  const stopAnimation = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Whenever the route changes, finish the bar and hide it.
  useEffect(() => {
    stopAnimation();
    setProgress(100);

    // After a short delay, hide entirely
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 250);

    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams?.toString()]);

  // Hijack link clicks and form submits to start the bar
  useEffect(() => {
    const start = () => {
      stopAnimation();
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      setVisible(true);
      setProgress(15);
      let p = 15;
      intervalRef.current = setInterval(() => {
        p = Math.min(p + Math.random() * 8, 90);
        setProgress(p);
      }, 200);
    };

    const onClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest('a');
      if (!target) return;
      const href = target.getAttribute('href');
      if (!href || href.startsWith('#') || target.target === '_blank' || target.hasAttribute('download')) return;
      if (href.startsWith('http') && !href.includes(window.location.host)) return;
      start();
    };

    const onSubmit = () => start();

    document.addEventListener('click', onClick);
    document.addEventListener('submit', onSubmit);
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('submit', onSubmit);
      stopAnimation();
    };
  }, []);

  if (!visible) return null;

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
          transition: 'width 200ms ease-out, opacity 200ms ease-out',
          opacity: progress >= 100 ? 0 : 1,
        }}
      />
    </div>
  );
}
