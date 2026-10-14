"use client";

import { useEffect, useState, useRef } from 'react';

export interface ScrollProgressValues {
  // raw progress from 0 (entering from bottom) to 1 (leaving at top)
  progress: number;
  // inView boolean
  inView: boolean;
  // transform offset for left element (px)
  leftTranslateX: number;
  // transform offset for right element (px)
  rightTranslateX: number;
  // opacity (0 to 1)
  opacity: number;
  // subtle scale
  scale: number;
}

export function useScrollProgress<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [scrollValues, setScrollValues] = useState<ScrollProgressValues>({
    progress: 0,
    inView: false,
    leftTranslateX: -100,
    rightTranslateX: 120,
    opacity: 0,
    scale: 0.95,
  });

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const element = ref.current;
          if (!element) {
            ticking = false;
            return;
          }

          const rect = element.getBoundingClientRect();
          const windowHeight = window.innerHeight;

          // When top of element hits bottom of screen: rect.top = windowHeight
          // When center of element is at center of screen: rect.top + rect.height/2 = windowHeight/2
          // When bottom of element leaves top of screen: rect.bottom = 0

          const totalDistance = windowHeight + rect.height;
          const currentDistance = windowHeight - rect.top;
          const rawProgress = currentDistance / totalDistance;
          const progress = Math.max(0, Math.min(1, rawProgress));

          // In-view check
          const inView = rect.top < windowHeight && rect.bottom > 0;

          // Phase 1: Entering (progress ~ 0 to 0.45)
          // Phase 2: Centered / Rest position (progress ~ 0.45 to 0.65)
          // Phase 3: Exiting as user scrolls down past (progress ~ 0.65 to 1.0)
          let leftX = 0;
          let rightX = 0;
          let opacity = 1;
          let scale = 1;

          if (progress < 0.45) {
            // Entering from sides
            const enterT = progress / 0.45; // 0 to 1
            leftX = (-100) * (1 - enterT);
            rightX = (120) * (1 - enterT);
            opacity = Math.max(0.1, enterT);
            scale = 0.94 + 0.06 * enterT;
          } else if (progress > 0.65) {
            // Exiting away as user scrolls further down
            const exitT = (progress - 0.65) / 0.35; // 0 to 1
            leftX = (-90) * exitT;
            rightX = (110) * exitT;
            opacity = Math.max(0, 1 - exitT * 1.1);
            scale = 1 - 0.05 * exitT;
          } else {
            // Sweet spot (centered in screen)
            leftX = 0;
            rightX = 0;
            opacity = 1;
            scale = 1;
          }

          setScrollValues({
            progress,
            inView,
            leftTranslateX: leftX,
            rightTranslateX: rightX,
            opacity,
            scale,
          });

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // run once on mount

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return { ref, ...scrollValues };
}
