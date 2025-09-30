'use client';

import styled, { css } from 'styled-components';
import React from 'react';
import { Loader } from './Loader';

type ButtonVariation = 'primary' | 'secondary' | 'destructive' | 'link';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  $variation?: ButtonVariation;
  size?: ButtonSize;
  isDisabled?: boolean;
  $isLoading?: boolean;
  loadingText?: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  children: React.ReactNode;
  className?: string;
}

const getVariationStyles = (variation: ButtonVariation = 'primary') => {
  const variations = {
    primary: css`
      background-color: #6200ea;
      color: white;
      &:hover:not(:disabled) {
        background-color: #3700b3;
      }
    `,
    secondary: css`
      background-color: transparent;
      border: 1px solid #6200ea;
      color: #6200ea;
      &:hover:not(:disabled) {
        background-color: rgba(98, 0, 234, 0.1);
      }
    `,
    destructive: css`
      background-color: #dc3545;
      color: white;
      &:hover:not(:disabled) {
        background-color: #c82333;
      }
    `,
    link: css`
      background-color: transparent;
      border: none;
      color: #6200ea;
      padding: 0;
      &:hover:not(:disabled) {
        text-decoration: underline;
      }
    `
  };
  return variations[variation];
};

const getSizeStyles = (size: ButtonSize = 'medium') => {
  const sizes = {
    small: css`
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
    `,
    medium: css`
      padding: 0.75rem 1.5rem;
      font-size: 1rem;
    `,
    large: css`
      padding: 1rem 2rem;
      font-size: 1.125rem;
    `
  };
  return sizes[size];
};

const StyledButton = styled.button.attrs<ButtonProps>(props => ({
  type: props.type || 'button',
  disabled: props.isDisabled || props.$isLoading,
}))<ButtonProps>`
  /* Base styles */
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  
  /* Variation and size styles as a lower specificity */
  ${props => getVariationStyles(props.$variation)}
  ${props => getSizeStyles(props.size)}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(98, 0, 234, 0.2);
  }

  /* Custom className styles will take precedence */
  &.${props => props.className} {
    /* This ensures any styles from className override the default styles */
  }
`;

const LoaderWrapper = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

export const Button: React.FC<ButtonProps> = ({
  children,
  $isLoading,
  loadingText,
  isDisabled,
  ...props
}) => {
  return (
    <StyledButton
      $isLoading={$isLoading}
      isDisabled={isDisabled}
      {...props}
    >
      {$isLoading ? (
        <>
          <LoaderWrapper>
            <Loader />
          </LoaderWrapper>
          {loadingText || children}
        </>
      ) : (
        children
      )}
    </StyledButton>
  );
}; 