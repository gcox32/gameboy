"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/cn";
import styles from "./toast.module.css";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  durationMs: number;
  /** How many times this same message was raised while it was showing */
  count: number;
  leaving: boolean;
  /** Faded out, and now closing the gap it leaves in the stack */
  collapsed: boolean;
}

interface ToastContextValue {
  /** Shows a toast and returns its id. Errors stay longer by default. */
  showToast: (message: string, type?: ToastType, durationMs?: number) => string;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const MAX_VISIBLE = 4;
// These match toast.module.css
const EXIT_MS = 180;
const COLLAPSE_MS = 160;

const defaultDurations: Record<ToastType, number> = {
  success: 4000,
  info: 4000,
  warning: 6000,
  error: 7000,
};

const icons: Record<ToastType, typeof Info> = {
  success: CircleCheck,
  error: CircleAlert,
  warning: TriangleAlert,
  info: Info,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  // The source of truth, so showToast can read the current list synchronously
  const listRef = useRef<ToastItem[]>([]);
  const commit = useCallback((next: ToastItem[]) => {
    listRef.current = next;
    setToasts(next);
  }, []);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(false);
  const removalTimers = useRef<Record<string, number>>({});

  // Timers pause while the tab is in the background, so nothing expires unseen
  useEffect(() => {
    const onVisibility = () => setHidden(document.visibilityState === "hidden");
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    const timers = removalTimers.current;
    return () => Object.values(timers).forEach((t) => window.clearTimeout(t));
  }, []);

  const scheduleRemoval = useCallback((ids: string[]) => {
    for (const id of ids) {
      if (removalTimers.current[id]) continue;
      // Fades out first, then closes up the space so the rest of the stack slides over
      removalTimers.current[id] = window.setTimeout(() => {
        commit(listRef.current.map((t) => (t.id === id ? { ...t, collapsed: true } : t)));
        removalTimers.current[id] = window.setTimeout(() => {
          delete removalTimers.current[id];
          commit(listRef.current.filter((t) => t.id !== id));
        }, COLLAPSE_MS);
      }, EXIT_MS);
    }
  }, [commit]);

  const dismissToast = useCallback(
    (id: string) => {
      commit(listRef.current.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
      scheduleRemoval([id]);
    },
    [commit, scheduleRemoval]
  );

  const showToast = useCallback(
    (message: string, type: ToastType = "info", durationMs?: number) => {
      const duration = durationMs ?? defaultDurations[type];
      const prev = listRef.current;

      // The same message again bumps its count and restarts its timer instead of stacking
      const repeat = prev.find((t) => !t.leaving && t.type === type && t.message === message);
      if (repeat) {
        commit(prev.map((t) => (t === repeat ? { ...t, count: t.count + 1, durationMs: duration } : t)));
        return repeat.id;
      }

      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const next = [...prev, { id, type, message, durationMs: duration, count: 1, leaving: false, collapsed: false }];
      const active = next.filter((t) => !t.leaving);
      const evicted = active.slice(0, Math.max(0, active.length - MAX_VISIBLE)).map((t) => t.id);
      commit(evicted.length ? next.map((t) => (evicted.includes(t.id) ? { ...t, leaving: true } : t)) : next);
      if (evicted.length) scheduleRemoval(evicted);
      return id;
    },
    [commit, scheduleRemoval]
  );

  const value = useMemo(() => ({ showToast, dismissToast }), [showToast, dismissToast]);
  const paused = hovered || focused || hidden;

  return (
    <ToastContext.Provider value={value}>
      {children}
      <section
        aria-label="Notifications"
        aria-live="polite"
        className={cn(styles.stack, paused && styles.paused)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
        }}
      >
        {toasts.map((toast) => (
          <div key={toast.id} className={cn(styles.slot, toast.collapsed && styles.collapsed)}>
            <ToastCard toast={toast} onDismiss={dismissToast} />
          </div>
        ))}
      </section>
    </ToastContext.Provider>
  );
}

const SWIPE_DISTANCE = 0.35; // share of the card's width that dismisses on release
const SWIPE_VELOCITY = 0.45; // px/ms, so a quick flick dismisses from a short drag

interface DragState {
  pointerId: number;
  startX: number;
  startY: number;
  lastX: number;
  lastT: number;
  velocity: number;
  dx: number;
  active: boolean;
}

/** One toast. Touch and pen can swipe it sideways to dismiss it. */
function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<DragState | null>(null);
  const [flung, setFlung] = useState<{ x: number } | null>(null);
  const Icon = icons[toast.type];

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" || toast.leaving) return;
    drag.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
      lastT: e.timeStamp,
      velocity: 0,
      dx: 0,
      active: false,
    };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    const el = ref.current;
    if (!d || !el || d.pointerId !== e.pointerId) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;

    if (!d.active) {
      // A mostly vertical move is a scroll, so let it go
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
        drag.current = null;
        return;
      }
      if (Math.abs(dx) < 8) return;
      d.active = true;
      el.setPointerCapture(e.pointerId);
      // A data attribute, since React would overwrite a class added here on its next render
      el.dataset.dragging = "";
      el.style.transition = "none";
    }

    const dt = e.timeStamp - d.lastT;
    if (dt > 0) d.velocity = (e.clientX - d.lastX) / dt;
    d.lastX = e.clientX;
    d.lastT = e.timeStamp;
    d.dx = dx;

    el.style.transform = `translateX(${dx}px)`;
    el.style.opacity = String(1 - Math.min(1, Math.abs(dx) / el.offsetWidth) * 0.7);
  };

  const onPointerEnd = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    const el = ref.current;
    if (!d || !el || d.pointerId !== e.pointerId) return;
    drag.current = null;
    if (!d.active) return;
    delete el.dataset.dragging;

    const width = el.offsetWidth;
    const flick = Math.abs(d.velocity) > SWIPE_VELOCITY && Math.sign(d.velocity) === Math.sign(d.dx);
    if (e.type === "pointerup" && (Math.abs(d.dx) > width * SWIPE_DISTANCE || flick)) {
      // Carries on in the swipe's direction rather than playing the usual exit
      setFlung({ x: Math.sign(d.dx) * (width + 32) });
      onDismiss(toast.id);
      return;
    }

    // Springs back into place
    el.style.transition = "transform 220ms cubic-bezier(0.2, 0.9, 0.3, 1.2), opacity 220ms ease";
    el.style.transform = "";
    el.style.opacity = "";
    window.setTimeout(() => {
      if (!drag.current) el.style.transition = "";
    }, 240);
  };

  return (
    <div
      ref={ref}
      role={toast.type === "error" ? "alert" : "status"}
      className={cn(styles.toast, styles[toast.type], toast.leaving && styles.leaving, flung && styles.flung)}
      style={
        flung
          ? { transform: `translateX(${flung.x}px)`, opacity: 0, transition: `transform ${EXIT_MS}ms ease-out, opacity ${EXIT_MS}ms ease-out` }
          : undefined
      }
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
    >
      <span className={styles.icon} aria-hidden>
        <Icon size={16} strokeWidth={2.5} />
      </span>
      <div className={styles.body}>
        <p className={styles.message}>
          {toast.message}
          {toast.count > 1 && <span className={styles.count}>×{toast.count}</span>}
        </p>
      </div>
      <button
        type="button"
        aria-label="Dismiss notification"
        className={styles.dismiss}
        onClick={() => onDismiss(toast.id)}
      >
        <X size={14} strokeWidth={2.5} />
      </button>
      {!toast.leaving && (
        <span
          // A new key restarts the bar when a repeat refreshes the timer
          key={toast.count}
          className={styles.timer}
          style={{ animationDuration: `${toast.durationMs}ms` }}
          onAnimationEnd={() => onDismiss(toast.id)}
          aria-hidden
        />
      )}
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
