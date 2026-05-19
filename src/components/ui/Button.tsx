'use client';

import { ReactNode, FC, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { Loader } from './Loader';

type ButtonVariation = 'primary' | 'secondary' | 'destructive' | 'link';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'> {
  variation?: ButtonVariation;
  size?: ButtonSize;
  disabled?: boolean;
  isLoading?: boolean;
  loadingText?: string;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariation, string> = {
  primary: 'bg-[#6200ea] text-white hover:bg-[#3700b3] border-none',
  secondary: 'bg-transparent border border-[#6200ea] text-[#6200ea] hover:bg-[rgba(98,0,234,0.1)]',
  destructive: 'bg-[#dc3545] text-white hover:bg-[#c82333] border-none',
  link: 'bg-transparent border-none text-[#6200ea] !p-0 hover:underline',
};

const sizeClasses: Record<ButtonSize, string> = {
  small: 'px-4 py-2 text-sm',
  medium: 'px-6 py-3 text-base',
  large: 'px-8 py-4 text-lg',
};

export const Button: FC<ButtonProps> = ({
  children,
  isLoading,
  loadingText,
  disabled,
  variation = 'primary',
  size = 'medium',
  className,
  type = 'button',
  ...props
}) => {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded font-medium transition-all cursor-pointer',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus:outline-none focus:ring-2 focus:ring-[#6200ea]/20',
        variation !== 'link' && sizeClasses[size],
        variantClasses[variation],
        className
      )}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="inline-flex items-center justify-center">
            <Loader />
          </span>
          {loadingText || children}
        </>
      ) : children}
    </button>
  );
};
