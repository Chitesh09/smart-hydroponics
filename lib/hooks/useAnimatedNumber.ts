'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook to smoothly interpolate a numeric value over time.
 * Uses requestAnimationFrame with a quadratic ease-out curve.
 * 
 * @param target The target number to animate to.
 * @param duration Duration of the animation in milliseconds.
 * @returns The current interpolated value.
 */
export function useAnimatedNumber(target: number, duration: number = 400) {
  const [current, setCurrent] = useState(target);
  const startRef = useRef(target);
  const targetRef = useRef(target);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    // If target changed, reset starting point and animation timer
    startRef.current = current;
    targetRef.current = target;
    startTimeRef.current = null;
  }, [target, current]);

  useEffect(() => {
    let frameId: number;

    const tick = (now: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = now;
      }

      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing: easeOutQuad
      const easedProgress = progress * (2 - progress);

      const currentInterp = startRef.current + (targetRef.current - startRef.current) * easedProgress;
      setCurrent(currentInterp);

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [target, duration]);

  return current;
}
