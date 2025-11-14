'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * BackgroundMiamiVideo — lightweight animated background for hero sections.
 * - Uses tiny WebM/MP4 pairs (mobile/desktop) from /public/media
 * - Colorizes grayscale shimmer to a Miami palette via blend modes (no color baked into files)
 * - Respects prefers-reduced-motion
 * - Auto-pauses when off-screen to save battery/GPU
 */

type SrcPair = { webm: string; mp4: string };

type Props = {
  poster: string;
  desktop: SrcPair; // 540p15
  mobile: SrcPair;  // 360p20
  opacity?: number; // default .6
  className?: string;
};

export default function BackgroundMiamiVideo({
  poster,
  desktop,
  mobile,
  opacity = 0.6,
  className = '',
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Decide mobile vs desktop and motion preferences
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mqMobile = window.matchMedia('(max-width: 640px)');
    const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMobile = () => setIsMobile(mqMobile.matches);
    const updateRM = () => setReducedMotion(mqReduce.matches);
    updateMobile(); updateRM();
    mqMobile.addEventListener?.('change', updateMobile);
    mqReduce.addEventListener?.('change', updateRM);
    return () => {
      mqMobile.removeEventListener?.('change', updateMobile);
      mqReduce.removeEventListener?.('change', updateRM);
    };
  }, []);

  // Pause when off-screen
  useEffect(() => {
    const el = videoRef.current;
    if (!el || reducedMotion || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) { el.play().catch(() => {}); } else { el.pause(); }
    }, { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, [reducedMotion]);

  const src = isMobile ? mobile : desktop;

  return (
    <div className={`absolute inset-0 ${className}`}>
      {/* Poster paints first for LCP */}
      <img src={poster || "/placeholder.svg"} alt="" className="absolute inset-0 h-full w-full object-cover" />

      {/* Respect reduced motion: hide video entirely */}
      {!reducedMotion && (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover pointer-events-none mix-blend-soft-light"
          style={{ opacity }}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={poster}
        >
          {/* WebM first (modern), MP4 fallback (Safari/older) */}
          <source src={src.webm} type="video/webm; codecs=vp9" />
          <source src={src.mp4} type="video/mp4" />
        </video>
      )}

      {/* Miami tint overlay */}
      <div
        className="absolute inset-0 pointer-events-none mix-blend-color"
        style={{
          background:
            'radial-gradient(120% 80% at 80% 20%, rgba(255,42,175,0.45), transparent 60%),' +
            'radial-gradient(120% 80% at 20% 80%, rgba(0,225,255,0.35), transparent 60%)'
        }}
        aria-hidden="true"
      />
    </div>
  );
}
