'use client';

import styled from 'styled-components';
import { Button } from './Button';
import { useState } from 'react';
import { H4 } from './typography';
import { DefaultTheme } from 'styled-components';

type AlertVariation = 'error' | 'warning' | 'success' | 'info';

interface AlertProps {
  $variation?: AlertVariation;
  isDismissible?: boolean;
  hasIcon?: boolean;
  heading?: string;
  children: React.ReactNode;
}

const getVariationStyles = (variation: AlertVariation = 'info') => {
  return {
    background: `${({ theme }: { theme: DefaultTheme }) => theme.colors.alert[variation].background}`,
    color: `${({ theme }: { theme: DefaultTheme }) => theme.colors.alert[variation].text}`,
    border: `${({ theme }: { theme: DefaultTheme }) => theme.colors.alert[variation].border}`
  };
};

const AlertContainer = styled.div<{ $variation: AlertVariation }>`
  padding: 1rem;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 1px solid ${({ $variation }) => getVariationStyles($variation).border};
  background-color: ${({ $variation }) => getVariationStyles($variation).background};
  color: ${({ $variation }) => getVariationStyles($variation).color};
  font-size: ${({ theme }) => theme.typography.fontSizes.sm};
  line-height: 1.5;
`;

export function Alert({ $variation = 'info', children, isDismissible = true, heading, hasIcon = true }: AlertProps) {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <AlertContainer $variation={$variation}>
      {isOpen && (
        <>
          {heading && <H4>{heading}</H4>}
          {hasIcon && (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          )}
          {children}
          {isDismissible && (
            <Button
          $variation="link"
          onClick={() => setIsOpen(false)}
        >
                Dismiss
            </Button>
          )}
        </>
      )}
    </AlertContainer>
  );
} 