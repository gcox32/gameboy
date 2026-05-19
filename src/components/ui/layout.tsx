'use client';

import { FC, HTMLAttributes, CSSProperties } from 'react';
import { cn } from '@/lib/cn';

interface FlexProps extends HTMLAttributes<HTMLDivElement> {
  $direction?: CSSProperties['flexDirection'];
  $gap?: string | number;
  $padding?: string | number;
  $alignItems?: CSSProperties['alignItems'];
  $justifyContent?: CSSProperties['justifyContent'];
}

export const Flex: FC<FlexProps> = ({
  $direction = 'row',
  $gap = 0,
  $padding = 0,
  $alignItems = 'stretch',
  $justifyContent = 'flex-start',
  style,
  className,
  children,
  ...props
}) => (
  <div
    className={cn('flex', className)}
    style={{ flexDirection: $direction, gap: $gap, padding: $padding, alignItems: $alignItems, justifyContent: $justifyContent, ...style }}
    {...props}
  >
    {children}
  </div>
);

interface ViewProps extends HTMLAttributes<HTMLDivElement> {
  $textAlign?: CSSProperties['textAlign'];
  $padding?: string | number;
  $margin?: string | number;
  $width?: string | number;
  $height?: string | number;
  $backgroundColor?: string;
  $borderRadius?: string | number;
  $border?: string;
  $flexDirection?: CSSProperties['flexDirection'];
  $alignItems?: CSSProperties['alignItems'];
  $justifyContent?: CSSProperties['justifyContent'];
}

export const View: FC<ViewProps> = ({
  $textAlign = 'left',
  $padding = 0,
  $margin = 0,
  $width = 'auto',
  $height = 'auto',
  $backgroundColor = 'transparent',
  $borderRadius = 0,
  $border = 'none',
  $flexDirection = 'row',
  $alignItems = 'stretch',
  $justifyContent = 'flex-start',
  style,
  className,
  children,
  ...props
}) => (
  <div
    className={cn('flex', className)}
    style={{ textAlign: $textAlign, padding: $padding, margin: $margin, width: $width, height: $height, backgroundColor: $backgroundColor, borderRadius: $borderRadius, border: $border, flexDirection: $flexDirection, alignItems: $alignItems, justifyContent: $justifyContent, ...style }}
    {...props}
  >
    {children}
  </div>
);

export const Divider: FC<HTMLAttributes<HTMLHRElement>> = ({ className, ...props }) => (

  <hr className={cn('w-full border-t border-(--border-color) my-4', className)} {...props} />
);
