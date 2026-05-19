"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, ReactNode } from "react";
import { cn } from "@/lib/cn";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, durationMs?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const toastTypeClasses: Record<ToastType, string> = {
  success: "bg-[#e8f5e9] text-[#28a745] border-l-[#28a745]",
  error: "bg-[#fde8e8] text-[#dc3545] border-l-[#dc3545]",
  info: "bg-[var(--hover-background-color)] text-[var(--foreground-rgb)] border-l-[var(--border-color)]",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Record<string, number>>({});

  const hide = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timers = timersRef.current;
    if (timers[id]) {
      window.clearTimeout(timers[id]);
      delete timers[id];
    }
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "info", durationMs = 4000) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setToasts((prev) => [...prev, { id, type, message }]);
      timersRef.current[id] = window.setTimeout(() => hide(id), durationMs);
    },
    [hide]
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="fixed left-4 bottom-4 flex flex-col gap-2 z-100 max-sm:left-0 max-sm:right-0 max-sm:bottom-0 max-sm:p-2"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "shadow-[0_4px_16px_rgba(0,0,0,0.15)] rounded-lg p-3 min-w-65 max-w-90 text-sm border-l-4",
              "max-sm:w-full max-sm:max-w-none max-sm:rounded-t-lg max-sm:rounded-b-none",
              toastTypeClasses[toast.type]
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <span>{toast.message}</span>
              <button
                aria-label="Dismiss notification"
                onClick={() => hide(toast.id)}
                className="appearance-none border-none bg-transparent text-inherit cursor-pointer text-sm px-1.5 py-1"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
