'use client';

import { FC, ReactNode, ElementType } from 'react';
import { cn } from '@/lib/cn';

interface HeadingProps {
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  as?: ElementType;
  className?: string;
  children?: ReactNode;
}

export const Heading: FC<HeadingProps> = ({ textAlign = 'left', as: Tag = 'h2', className, children }) => (

  <Tag className={cn('font-semibold m-0', `text-${textAlign}`, className)}>
    {children}
  </Tag>
);

export const H1: FC<Omit<HeadingProps, 'as'>> = ({ className, ...props }) => (
  <Heading as="h1" className={cn('text-[2rem]', className)} {...props} />
);

export const H2: FC<Omit<HeadingProps, 'as'>> = ({ className, ...props }) => (
  <Heading as="h2" className={cn('text-xl', className)} {...props} />
);

export const H3: FC<Omit<HeadingProps, 'as'>> = ({ className, ...props }) => (
  <Heading as="h3" className={cn('text-xl', className)} {...props} />
);

export const H4: FC<Omit<HeadingProps, 'as'>> = ({ className, ...props }) => (
  <Heading as="h4" className={cn('text-lg', className)} {...props} />
);

export const H5: FC<Omit<HeadingProps, 'as'>> = ({ className, ...props }) => (
  <Heading as="h5" className={cn('text-base', className)} {...props} />
);

export const Paragraph: FC<{ className?: string; children?: ReactNode }> = ({ className, children }) => (
  <p className={cn('text-base leading-relaxed mb-4', className)}>{children}</p>
);
