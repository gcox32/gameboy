'use client';

import { cn } from '@/lib/cn';
import { FaCheck } from 'react-icons/fa';

type CheckboxSize = 'small' | 'medium' | 'large';
type CheckboxVariation = 'default' | 'primary' | 'success' | 'warning' | 'error';

interface CheckboxFieldProps {
  label: string;
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  labelPosition?: 'start' | 'end';
  justifyContent?: 'center' | 'flex-start' | 'flex-end';
  alignItems?: 'center' | 'flex-start' | 'flex-end';
  size?: CheckboxSize;
  variation?: CheckboxVariation;
  disabled?: boolean;
  hasError?: boolean;
  errorMessage?: string;
  description?: string;
}

const checkboxSizeClasses: Record<CheckboxSize, { box: string; icon: string; label: string; sub: string }> = {
  small: { box: 'w-3.5 h-3.5', icon: 'text-[10px]', label: 'text-xs', sub: 'text-[0.6875rem]' },
  medium: { box: 'w-[18px] h-[18px]', icon: 'text-[12px]', label: 'text-sm', sub: 'text-xs' },
  large: { box: 'w-[22px] h-[22px]', icon: 'text-sm', label: 'text-base', sub: 'text-sm' },
};

const variationCheckedBg: Record<CheckboxVariation, string> = {
  default: '#007bff',
  primary: '#007bff',
  success: '#28a745',
  warning: '#ffc107',
  error: '#dc3545',
};

const variationBorder: Record<CheckboxVariation, string> = {
  default: 'var(--border-color)',
  primary: '#007bff',
  success: '#28a745',
  warning: '#ffc107',
  error: '#dc3545',
};

export function CheckboxField({
  label,
  name,
  value,
  checked,
  onChange,
  labelPosition = 'end',
  justifyContent,
  alignItems,
  size = 'medium',
  variation = 'default',
  disabled = false,
  hasError = false,
  errorMessage,
  description,
}: CheckboxFieldProps) {
  const checkboxId = `${name}-${value}`;
  const sizes = checkboxSizeClasses[size];
  const checkedBg = variationCheckedBg[variation];
  const borderColor = hasError ? '#dc3545' : variationBorder[variation];

  const justifyClass = justifyContent === 'center' ? 'justify-center' : justifyContent === 'flex-end' ? 'justify-end' : 'justify-start';
  const alignClass = alignItems === 'flex-start' ? 'items-start' : alignItems === 'flex-end' ? 'items-end' : 'items-center';

  const labelContent = (
    <div className="flex flex-col gap-0.5">
      <label
        htmlFor={checkboxId}
        className={cn(sizes.label, 'font-medium leading-[1.4] select-none transition-colors cursor-pointer pb-0', disabled && 'cursor-not-allowed', hasError ? 'text-[#dc3545]' : disabled ? 'text-[#6c757d]' : 'text-(--foreground-rgb)')}
      >
        {label}
      </label>
      {description && <div className={cn(sizes.sub, 'text-[#6c757d] leading-[1.3]')}>{description}</div>}
      {hasError && errorMessage && <div className={cn(sizes.sub, 'text-[#dc3545] leading-[1.3]')}>{errorMessage}</div>}
    </div>
  );

  return (
    <div className={cn('flex gap-2 relative', justifyClass, alignClass)}>
      {labelPosition === 'start' && labelContent}

      <div className="relative inline-flex items-center justify-center">
        <input
          type="checkbox"
          id={checkboxId}
          name={name}
          value={value}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="absolute opacity-0 cursor-pointer h-0 w-0"
        />
        <div
          className={cn(
            sizes.box,
            'relative inline-flex items-center justify-center border-2 rounded-sm transition-all cursor-pointer',
            disabled && 'cursor-not-allowed opacity-60',
            hasError && 'shadow-[0_0_0_2px_rgba(220,53,69,0.2)]'
          )}
          style={{
            borderColor: hasError ? '#dc3545' : borderColor,
            backgroundColor: checked ? checkedBg : 'transparent',
          }}
          onClick={() => !disabled && onChange()}
        >
          {checked && (
            <span className={cn('text-white font-bold leading-none', sizes.icon)}>
              <FaCheck />
            </span>
          )}
        </div>
      </div>

      {labelPosition === 'end' && labelContent}
    </div>
  );
}
