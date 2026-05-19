'use client';

import { FC } from 'react';
import { cn } from '@/lib/cn';

interface LoaderProps {
  variation?: 'circular' | 'linear';
  size?: 'small' | 'medium' | 'large';
}

const sizeClasses = {
  small: 'w-4 h-4',
  medium: 'w-6 h-6',
  large: 'w-8 h-8',
};

export const Loader: FC<LoaderProps> = ({ variation = 'circular', size = 'medium' }) => {
  if (variation === 'linear') {
    return (
      <div className="w-full h-1 bg-gray-200 overflow-hidden relative">
        <div className="w-[30%] h-full bg-[#6200ea] absolute animate-[loader-slide_1s_infinite_ease-in-out]" />
      </div>
    );
  }

  return (
    <div className={cn('inline-block border-2 border-gray-300 border-t-[#6200ea] rounded-full animate-spin', sizeClasses[size])} />
  );
};
