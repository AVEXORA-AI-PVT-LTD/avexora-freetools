"use client";

import { useEffect, useRef, useCallback, useState } from "react";

export interface DepthMotionOptions {
  perspective?: number;
  maxRotateX?: number;
  maxRotateY?: number;
  maxTilt?: number;
  scale?: number;
  disabled?: boolean;
}

export interface DepthMotionState {
  tx: number;
  ty: number;
  tz: number;
  rx: number;
  ry: number;
  ds: number;
  do: number;
}

const DEFAULT_STATE: DepthMotionState = {
  tx: 0,
  ty: 0,
  tz: 0,
  rx: 0,
  ry: 0,
  ds: 1,
  do: 1,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor;
}

export function useDepthMotion<T extends HTMLElement = HTMLDivElement>(
  options: DepthMotionOptions = {}
) {
  const {
    perspective = 1200,
    maxRotateX = 3,
    maxRotateY = 5,
    maxTilt = 2,
    scale = 1.02,
    disabled = false,
  } = options;

  const ref = useRef<T>(null);
  const [state, setState] = useState<DepthMotionState>(DEFAULT_STATE);
  const targetRef = useRef<DepthMotionState>(DEFAULT_STATE);
  const currentRef = useRef<DepthMotionState>(DEFAULT_STATE);
  const rafRef = useRef<number>(0);
  const isHoveringRef = useRef(false);

  const animate = useCallback(() => {
    const current = currentRef.current;
    const target = targetRef.current;
    const lerpFactor = 0.12;

    const next: DepthMotionState = {
      tx: lerp(current.tx, target.tx, lerpFactor),
      ty: lerp(current.ty, target.ty, lerpFactor),
      tz: lerp(current.tz, target.tz, lerpFactor),
      rx: lerp(current.rx, target.rx, lerpFactor),
      ry: lerp(current.ry, target.ry, lerpFactor),
      ds: lerp(current.ds, target.ds, lerpFactor),
      do: lerp(current.do, target.do, lerpFactor),
    };

    const isSettled =
      Math.abs(next.tx - target.tx) < 0.01 &&
      Math.abs(next.ty - target.ty) < 0.01 &&
      Math.abs(next.tz - target.tz) < 0.01 &&
      Math.abs(next.rx - target.rx) < 0.01 &&
      Math.abs(next.ry - target.ry) < 0.01 &&
      Math.abs(next.ds - target.ds) < 0.001 &&
      Math.abs(next.do - target.do) < 0.001;

    currentRef.current = isSettled ? target : next;

    if (ref.current) {
      const el = ref.current;
      el.style.setProperty("--tx", `${currentRef.current.tx}px`);
      el.style.setProperty("--ty", `${currentRef.current.ty}px`);
      el.style.setProperty("--tz", `${currentRef.current.tz}px`);
      el.style.setProperty("--rx", `${currentRef.current.rx}deg`);
      el.style.setProperty("--ry", `${currentRef.current.ry}deg`);
      el.style.setProperty("--ds", String(currentRef.current.ds));
      el.style.setProperty("--do", String(currentRef.current.do));
    }

    if (!isSettled) {
      rafRef.current = requestAnimationFrame(animate);
    }
  }, []);

  const startAnimation = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(animate);
  }, [animate]);

  const stopAnimation = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<T>) => {
      if (disabled || !ref.current) return;

      const rect = ref.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const mouseX = (e.clientX - centerX) / (rect.width / 2);
      const mouseY = (e.clientY - centerY) / (rect.height / 2);

      const clampedX = clamp(mouseX, -1, 1);
      const clampedY = clamp(mouseY, -1, 1);

      targetRef.current = {
        tx: clampedX * 8,
        ty: clampedY * 8,
        tz: 20,
        rx: -clampedY * maxRotateX,
        ry: clampedX * maxRotateY,
        ds: scale,
        do: 1,
      };

      isHoveringRef.current = true;
      startAnimation();
    },
    [disabled, maxRotateX, maxRotateY, scale, startAnimation]
  );

  const handleMouseLeave = useCallback(() => {
    if (disabled) return;

    targetRef.current = DEFAULT_STATE;
    isHoveringRef.current = false;
    startAnimation();
  }, [disabled, startAnimation]);

  useEffect(() => {
    return () => {
      stopAnimation();
    };
  }, [stopAnimation]);

  return {
    ref,
    state,
    style: {
      perspective: `${perspective}px`,
    } as React.CSSProperties,
    onMouseMove: handleMouseMove,
    onMouseLeave: handleMouseLeave,
  };
}

export function useScrollProgress<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const scrollableHeight = rect.height - window.innerHeight;
      if (scrollableHeight <= 0) {
        setProgress(0);
        return;
      }
      const scrolled = -rect.top;
      setProgress(clamp(scrolled / scrollableHeight, 0, 1));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return { ref, progress };
}

export function useIntersectionReveal<T extends HTMLElement = HTMLDivElement>(
  threshold = 0.15
) {
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -10% 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return reduced;
}

export function useIsTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch(
      "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        window.matchMedia("(pointer: coarse)").matches
    );
  }, []);

  return isTouch;
}

export function useIsSmallScreen(breakpoint = 1024): boolean {
  const [isSmall, setIsSmall] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    setIsSmall(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsSmall(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [breakpoint]);

  return isSmall;
}

export function useParallax<T extends HTMLElement = HTMLDivElement>(speed: number = 0.3, disabled: boolean = false) {
  const ref = useRef<T>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (disabled) return;

    let rafId: number;
    const handleScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const scrolled = window.innerHeight - rect.top;
        const total = window.innerHeight + rect.height;
        const progress = scrolled / total;
        setOffset(progress * speed * 100);
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, [speed, disabled]);

  return { ref, offset };
}
