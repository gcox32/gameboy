'use client';

import { RefObject, useEffect, useRef } from 'react';

const WHEEL_THRESHOLD = 350;
const TOUCH_THRESHOLD = 120;
const RESET_DELAY_MS = 700;
const MAX_DELTA_PER_EVENT = 40;

function normalizeWheelDelta(e: WheelEvent): number {
  if (e.deltaMode === 1) return Math.abs(e.deltaY) * 16;
  if (e.deltaMode === 2) return Math.abs(e.deltaY) * (window.innerHeight / 3);
  return Math.abs(e.deltaY);
}

export function useOverscrollUp(
  containerRef: RefObject<HTMLElement | null>,
  onThreshold: () => void,
): void {
  const accumulated = useRef(0);
  const resetTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const triggered = useRef(false);
  const touchStartY = useRef(0);

  useEffect(() => {
    function isAtBottom() {
      const el = containerRef.current;
      if (!el) return true;
      return el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
    }

    function reset() {
      accumulated.current = 0;
    }

    function handleWheel(e: WheelEvent) {
      if (triggered.current) return;
      if (!isAtBottom() || e.deltaY <= 0) {
        reset();
        return;
      }

      clearTimeout(resetTimer.current);
      const contribution = Math.min(normalizeWheelDelta(e), MAX_DELTA_PER_EVENT);
      accumulated.current = Math.min(accumulated.current + contribution, WHEEL_THRESHOLD);

      if (accumulated.current >= WHEEL_THRESHOLD) {
        triggered.current = true;
        onThreshold();
        return;
      }
      resetTimer.current = setTimeout(reset, RESET_DELAY_MS);
    }

    function handleTouchStart(e: TouchEvent) {
      touchStartY.current = e.touches[0].clientY;
    }

    function handleTouchMove(e: TouchEvent) {
      if (triggered.current) return;
      if (!isAtBottom()) { reset(); return; }

      const drag = e.touches[0].clientY - touchStartY.current;
      if (drag <= 0) { reset(); return; }

      if (drag >= TOUCH_THRESHOLD) {
        triggered.current = true;
        onThreshold();
      }
    }

    function handleTouchEnd() {
      if (!triggered.current) reset();
      triggered.current = false;
    }

    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      clearTimeout(resetTimer.current);
    };
  }, [containerRef, onThreshold]);
}
