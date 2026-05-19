'use client';

import { ChangeEvent, FC, ElementType, ReactNode, CSSProperties, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type TextVariation = 'primary' | 'secondary' | 'error' | 'success' | 'warning' | 'light' | 'dark';
type FontSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
type FontWeight = 'normal' | 'medium' | 'semibold' | 'bold';

const textVariationClasses: Record<TextVariation, string> = {
  primary: 'text-[var(--foreground-rgb)]',
  secondary: 'text-[#6c757d]',
  error: 'text-[#dc3545]',
  success: 'text-[#28a745]',
  warning: 'text-[#ffc107]',
  light: 'text-white',
  dark: 'text-black',
};

const fontSizeClasses: Record<FontSize, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
};

const fontWeightClasses: Record<FontWeight, string> = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

interface TextProps {
  variation?: TextVariation;
  fontSize?: FontSize;
  fontWeight?: FontWeight;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  as?: ElementType;
  className?: string;
  children?: ReactNode;
  style?: CSSProperties;
}

export const Text: FC<TextProps> = ({
  variation = 'primary',
  fontSize = 'md',
  fontWeight = 'normal',
  textAlign = 'left',
  as: Tag = 'span',
  className,
  children,
  ...props
}) => (
  <Tag
    className={cn(
      textVariationClasses[variation],
      fontSizeClasses[fontSize],
      fontWeightClasses[fontWeight],
      `text-${textAlign}`,
      className
    )}
    {...props}
  >
    {children}
  </Tag>
);

const inputBaseClasses = 'px-2 py-1 border border-[var(--border-color)] rounded text-base w-full outline outline-1 outline-[var(--border-color)] focus:outline-[var(--accent-color)] focus:border-[#6200ea]';

interface TextFieldProps {
  label?: string;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  placeholder?: string;
  type?: string;
  hasError?: boolean;
  errorMessage?: string;
  name?: string;
  readOnly?: boolean;
  disabled?: boolean;
  orientation?: 'horizontal' | 'vertical';
  flex?: string;
  className?: string;
}

export const TextField: FC<TextFieldProps> = ({
  label,
  value,
  onChange,
  required,
  placeholder,
  type = 'text',
  hasError,
  errorMessage,
  name,
  readOnly,
  disabled,
  flex,
  orientation = 'horizontal',
  className,
  ...props
}) => (
  <div className={cn('flex w-full gap-1', orientation === 'horizontal' ? 'flex-row' : 'flex-col')}>
    {label && (
      <label className="block mb-2 text-(--foreground-rgb) text-sm">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
    )}
    <input
      type={type}
      value={value}
      onChange={onChange}
      required={required}
      placeholder={placeholder}
      name={name}
      readOnly={readOnly}
      disabled={disabled}
      className={cn(inputBaseClasses, readOnly && 'bg-(--hover-background-color) cursor-default', className)}
      style={flex ? { flex } : undefined}
      {...props}
    />
    {hasError && errorMessage && (
      <span className="text-[#dc3545] text-xs mt-1">{errorMessage}</span>
    )}
  </div>
);

interface TextAreaFieldProps {
  label?: string;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  required?: boolean;
  placeholder?: string;
  hasError?: boolean;
  errorMessage?: string;
  rows?: number;
  name?: string;
  orientation?: 'horizontal' | 'vertical';
}

export const TextArea: FC<TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ className, ...props }) => (
  <textarea
    className={cn(inputBaseClasses, 'min-h-25 resize-y', className)}
    {...props}
  />
);

export const TextAreaField: FC<TextAreaFieldProps> = ({
  label,
  value,
  onChange,
  required,
  placeholder,
  hasError,
  errorMessage,
  rows = 3,
  name,
  orientation = 'horizontal',
  ...props
}) => (
  <div className={cn('flex w-full gap-1', orientation === 'horizontal' ? 'flex-row' : 'flex-col')}>
    {label && (
      <label className="block mb-2 text-(--foreground-rgb) text-sm">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
    )}
    <TextArea
      value={value}
      onChange={onChange}
      required={required}
      placeholder={placeholder}
      rows={rows}
      name={name}
      {...props}
    />
    {hasError && errorMessage && (
      <span className="text-[#dc3545] text-xs mt-1">{errorMessage}</span>
    )}
  </div>
);
