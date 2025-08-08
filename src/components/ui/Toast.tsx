"use client";

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import styled, { DefaultTheme } from "styled-components";

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

const getToastColors = (theme: DefaultTheme, type: ToastType) => {
  switch (type) {
    case "success":
      return {
        bg: theme.colors.background.success,
        fg: theme.colors.text.success,
        border: theme.colors.border.success,
      };
    case "error":
      return {
        bg: theme.colors.background.error,
        fg: theme.colors.text.error,
        border: theme.colors.border.error,
      };
    default:
      return {
        bg: theme.colors.background.secondary,
        fg: theme.colors.text.primary,
        border: theme.colors.border.default,
      };
  }
};

const ToastStack = styled.div`
  position: fixed;
  left: 16px;
  bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 1000;

  @media (max-width: 768px) {
    left: 0;
    right: 0;
    bottom: 0;
    padding: 8px;
  }
`;

const ToastCard = styled.div<{ $type: ToastType }>`
  ${({ theme, $type }) => {
    const { bg, fg, border } = getToastColors(theme, $type);
    return `
      background: ${bg};
      color: ${fg};
      border-left: 4px solid ${border};
    `;
  }}
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  padding: 12px 14px;
  min-width: 260px;
  max-width: 360px;
  font-size: ${({ theme }) => theme.typography.fontSizes.sm};

  @media (max-width: 768px) {
    width: 100%;
    max-width: unset;
    border-radius: 8px 8px 0 0;
  }
`;

const ToastMessage = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const CloseButton = styled.button`
  appearance: none;
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font-size: 14px;
  padding: 4px 6px;
`;

export function ToastProvider({ children }: { children: React.ReactNode }) {
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
      <ToastStack role="status" aria-live="polite">
        {toasts.map((toast) => (
          <ToastCard key={toast.id} $type={toast.type}>
            <ToastMessage>
              <span>{toast.message}</span>
              <CloseButton aria-label="Dismiss notification" onClick={() => hide(toast.id)}>
                ×
              </CloseButton>
            </ToastMessage>
          </ToastCard>
        ))}
      </ToastStack>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}


