'use client';

import { ReactNode, useState } from 'react';
import { cn } from '@/lib/cn';
import { Button } from './Button';

type AlertVariation = 'error' | 'warning' | 'success' | 'info';

interface AlertProps {
  variation?: AlertVariation;
  isDismissible?: boolean;
  hasIcon?: boolean;
  heading?: string;
  children: ReactNode;
}

const variantClasses: Record<AlertVariation, string> = {
  error: 'bg-[#fde8e8] text-[#dc3545] border-[#dc3545]',
  warning: 'bg-[#fff8e1] text-[#ffc107] border-[#ffc107]',
  success: 'bg-[#e8f5e9] text-[#28a745] border-[#28a745]',
  info: 'bg-[var(--hover-background-color)] text-[var(--foreground-rgb)] border-[var(--border-color)]',
};

export function Alert({ variation = 'info', children, isDismissible = true, heading, hasIcon = true }: AlertProps) {
  const [isOpen, setIsOpen] = useState(true);
  if (!isOpen) return null;
  return (
    <div className={cn('p-4 rounded border text-sm leading-relaxed', variantClasses[variation])}>
      {heading && <h4 className="font-semibold m-0 mb-1">{heading}</h4>}
      {hasIcon && (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      )}
      {children}
      {isDismissible && (
        <Button variation="link" onClick={() => setIsOpen(false)}>Dismiss</Button>
      )}
    </div>
  );
}
