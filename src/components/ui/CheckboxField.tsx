'use client';

import styled, { css } from 'styled-components';
import { theme } from '@/theme';
import { FaCheck } from 'react-icons/fa';

type CheckboxSize = 'small' | 'medium' | 'large';
type CheckboxVariation = 'default' | 'primary' | 'success' | 'warning' | 'error';

interface CheckboxFieldProps {
  label: string;
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  $labelPosition?: 'start' | 'end';
  $justifyContent?: 'center' | 'flex-start' | 'flex-end';
  $alignItems?: 'center' | 'flex-start' | 'flex-end';
  size?: CheckboxSize;
  variation?: CheckboxVariation;
  disabled?: boolean;
  hasError?: boolean;
  errorMessage?: string;
  description?: string;
}

const getSizeStyles = (size: CheckboxSize = 'medium') => {
  const sizes = {
    small: css`
      width: 14px;
      height: 14px;
      font-size: 12px;
    `,
    medium: css`
      width: 18px;
      height: 18px;
      font-size: 14px;
    `,
    large: css`
      width: 22px;
      height: 22px;
      font-size: 16px;
    `
  };
  return sizes[size];
};

const getVariationStyles = (variation: CheckboxVariation = 'default', checked: boolean) => {
  const variations = {
    default: css`
      border-color: ${({ theme }) => theme.colors.border.primary};
      background-color: ${checked ? theme.colors.primary : 'transparent'};
      
      &:hover:not(:disabled) {
        border-color: ${({ theme }) => theme.colors.primary};
        background-color: ${checked ? theme.colors.primary : 'rgba(0, 123, 255, 0.1)'};
      }
    `,
    primary: css`
      border-color: ${({ theme }) => theme.colors.primary};
      background-color: ${checked ? theme.colors.primary : 'transparent'};
      
      &:hover:not(:disabled) {
        border-color: ${({ theme }) => theme.colors.accent};
        background-color: ${checked ? theme.colors.accent : 'rgba(0, 123, 255, 0.1)'};
      }
    `,
    success: css`
      border-color: ${({ theme }) => theme.colors.success};
      background-color: ${checked ? theme.colors.success : 'transparent'};
      
      &:hover:not(:disabled) {
        border-color: ${({ theme }) => theme.colors.success};
        background-color: ${checked ? theme.colors.success : 'rgba(40, 167, 69, 0.1)'};
      }
    `,
    warning: css`
      border-color: ${({ theme }) => theme.colors.warning};
      background-color: ${checked ? theme.colors.warning : 'transparent'};
      
      &:hover:not(:disabled) {
        border-color: ${({ theme }) => theme.colors.warning};
        background-color: ${checked ? theme.colors.warning : 'rgba(255, 193, 7, 0.1)'};
      }
    `,
    error: css`
      border-color: ${({ theme }) => theme.colors.danger};
      background-color: ${checked ? theme.colors.danger : 'transparent'};
      
      &:hover:not(:disabled) {
        border-color: ${({ theme }) => theme.colors.danger};
        background-color: ${checked ? theme.colors.danger : 'rgba(220, 53, 69, 0.1)'};
      }
    `
  };
  return variations[variation];
};

const Container = styled.div<{ 
  $justifyContent?: string;
  $alignItems?: string;
  $hasError?: boolean;
}>`
  display: flex;
  justify-content: ${({ $justifyContent = 'flex-start' }) => $justifyContent};
  align-items: ${({ $alignItems = 'center' }) => $alignItems};
  gap: ${({ theme }) => theme.spacing.sm};
  position: relative;
`;

const CheckboxWrapper = styled.div<{ 
  size: CheckboxSize;
  $hasError?: boolean;
}>`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const HiddenInput = styled.input`
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
`;

const CustomCheckbox = styled.div<{
  checked: boolean;
  size: CheckboxSize;
  variation: CheckboxVariation;
  disabled?: boolean;
  $hasError?: boolean;
}>`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 2px solid;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  transition: all 0.2s ease;
  cursor: ${({ disabled }) => disabled ? 'not-allowed' : 'pointer'};
  opacity: ${({ disabled }) => disabled ? 0.6 : 1};
  
  ${({ size }) => getSizeStyles(size)}
  ${({ variation, checked }) => getVariationStyles(variation, checked)}
  
  ${({ $hasError, theme }) => $hasError && css`
    border-color: ${theme.colors.danger} !important;
    box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.2);
  `}
  
  &:focus-within {
    outline: none;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.2);
  }
  
  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const Checkmark = styled.div<{ checked: boolean; size: CheckboxSize }>`
  position: absolute;
  display: ${({ checked }) => checked ? 'block' : 'none'};
  color: white;
  font-weight: bold;
  transition: all 0.2s ease;
  
  ${({ size }) => {
    switch (size) {
      case 'small':
        return css`
          font-size: 10px;
          line-height: 1;
        `;
      case 'medium':
        return css`
          font-size: 12px;
          line-height: 1;
        `;
      case 'large':
        return css`
          font-size: 14px;
          line-height: 1;
        `;
    }
  }}
`;

const Label = styled.label<{ 
  size: CheckboxSize;
  disabled?: boolean;
  $hasError?: boolean;
}>`
  color: ${({ theme, $hasError, disabled }) => 
    $hasError ? theme.colors.danger : 
    disabled ? theme.colors.text.secondary : 
    theme.colors.text.primary};
  font-size: ${({ size }) => {
    switch (size) {
      case 'small': return '0.75rem';
      case 'medium': return '0.875rem';
      case 'large': return '1rem';
    }
  }};
  font-weight: ${({ theme }) => theme.typography.fontWeights.medium};
  cursor: ${({ disabled }) => disabled ? 'not-allowed' : 'pointer'};
  line-height: 1.4;
  user-select: none;
  transition: color 0.2s ease;
  padding-bottom: 0 !important;
`;

const Description = styled.div<{ size: CheckboxSize }>`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ size }) => {
    switch (size) {
      case 'small': return '0.6875rem';
      case 'medium': return '0.75rem';
      case 'large': return '0.875rem';
    }
  }};
  margin-top: 0.25rem;
  line-height: 1.3;
`;

const ErrorMessage = styled.div<{ size: CheckboxSize }>`
  color: ${({ theme }) => theme.colors.danger};
  font-size: ${({ size }) => {
    switch (size) {
      case 'small': return '0.6875rem';
      case 'medium': return '0.75rem';
      case 'large': return '0.875rem';
    }
  }};
  margin-top: 0.25rem;
  line-height: 1.3;
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
`;

export function CheckboxField({
  label,
  name,
  value,
  checked,
  onChange,
  $labelPosition = 'end',
  $justifyContent,
  $alignItems,
  size = 'medium',
  variation = 'default',
  disabled = false,
  hasError = false,
  errorMessage,
  description,
}: CheckboxFieldProps) {
  const checkboxId = `${name}-${value}`;
  
  return (
    <Container $justifyContent={$justifyContent} $alignItems={$alignItems} $hasError={hasError}>
      {$labelPosition === 'start' && (
        <ContentWrapper>
          <Label 
            htmlFor={checkboxId} 
            size={size} 
            disabled={disabled}
            $hasError={hasError}
          >
            {label}
          </Label>
          {description && <Description size={size}>{description}</Description>}
          {hasError && errorMessage && <ErrorMessage size={size}>{errorMessage}</ErrorMessage>}
        </ContentWrapper>
      )}
      
      <CheckboxWrapper size={size} $hasError={hasError}>
        <HiddenInput
          type="checkbox"
          id={checkboxId}
          name={name}
          value={value}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
        />
        <CustomCheckbox
          checked={checked}
          size={size}
          variation={variation}
          disabled={disabled}
          $hasError={hasError}
          onClick={() => !disabled && onChange()}
        >
          <Checkmark checked={checked} size={size}>
            <FaCheck />
          </Checkmark>
        </CustomCheckbox>
      </CheckboxWrapper>
      
      {$labelPosition === 'end' && (
        <ContentWrapper>
          <Label 
            htmlFor={checkboxId} 
            size={size} 
            disabled={disabled}
            $hasError={hasError}
          >
            {label}
          </Label>
          {description && <Description size={size}>{description}</Description>}
          {hasError && errorMessage && <ErrorMessage size={size}>{errorMessage}</ErrorMessage>}
        </ContentWrapper>
      )}
    </Container>
  );
} 