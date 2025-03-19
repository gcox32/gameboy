import styled, { css } from 'styled-components';
import React, { JSX } from 'react';
import { theme } from '@/theme';

// Text variations
type TextVariation = 'primary' | 'secondary' | 'error' | 'success' | 'warning';

const getTextVariationStyles = (variation?: TextVariation) => {
  if (!variation) return '';
  
  const variations = {
    primary: css`
      color: ${({ theme }) => theme.colors.primary};
    `,
    secondary: css`
      color: ${({ theme }) => theme.colors.secondary};
    `,
    error: css`
      color: ${({ theme }) => theme.colors.error};
    `,
    success: css`
      color: ${({ theme }) => theme.colors.success};
    `,
    warning: css`
      color: ${({ theme }) => theme.colors.warning};
    `
  };
  return variations[variation];
};

// Base styled components
const StyledInput = styled.input<{ isReadOnly?: boolean }>`
  padding: 0.5rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  font-size: 1rem;
  width: 100%;
  background-color: ${({ isReadOnly, theme }) => 
    isReadOnly ? theme.colors.background.secondary : 'transparent'};
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
  
  &:read-only {
    cursor: default;
  }
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.875rem;
`;

interface TextProps {
  variation?: keyof typeof theme.colors.text;
  $fontSize?: keyof typeof theme.typography.fontSizes;
  $fontWeight?: keyof typeof theme.typography.fontWeights;
  $textAlign?: 'left' | 'center' | 'right' | 'justify';
  as?: keyof JSX.IntrinsicElements;
}

export const Text = styled.span<TextProps>`
  color: ${({ theme, variation = 'primary' }) => theme.colors.text[variation]};
  font-size: ${({ theme, $fontSize = 'md' }) => theme.typography.fontSizes[$fontSize]};
  font-weight: ${({ theme, $fontWeight = 'normal' }) => theme.typography.fontWeights[$fontWeight]};
  text-align: ${({ $textAlign }) => $textAlign || 'left'};
`;

const ErrorMessage = styled(Text).attrs({ variation: 'error' as TextVariation })`
  font-size: 0.75rem;
  margin-top: 0.25rem;
`;

const InputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  width: 100%;
`;

// Interface for TextField props
interface TextFieldProps {
  label?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  placeholder?: string;
  type?: string;
  hasError?: boolean;
  errorMessage?: string;
  name?: string;
  isReadOnly?: boolean;
  isDisabled?: boolean;
}

// TextField Component
export const TextField: React.FC<TextFieldProps> = ({
  label,
  value,
  onChange,
  required,
  placeholder,
  type = 'text',
  hasError,
  errorMessage,
  name,
  isReadOnly,
  isDisabled,
  ...props
}) => {
  return (
    <InputWrapper>
      {label && (
        <Label>
          {label}
          {required && <span style={{ color: 'red' }}> *</span>}
        </Label>
      )}
      <StyledInput
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        name={name}
        readOnly={isReadOnly}
        isReadOnly={isReadOnly}
        disabled={isDisabled}
        {...props}
      />
      {hasError && errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
    </InputWrapper>
  );
};

// TextArea components remain the same...
export const TextArea = styled.textarea`
  padding: 0.5rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  font-size: 1rem;
  width: 100%;
  min-height: 100px;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

interface TextAreaFieldProps {
  label?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  required?: boolean;
  placeholder?: string;
  hasError?: boolean;
  errorMessage?: string;
  rows?: number;
  name?: string;
}

export const TextAreaField: React.FC<TextAreaFieldProps> = ({
  label,
  value,
  onChange,
  required,
  placeholder,
  hasError,
  errorMessage,
  rows = 3,
  name,
  ...props
}) => {
  return (
    <InputWrapper>
      {label && (
        <Label>
          {label}
          {required && <span style={{ color: 'red' }}> *</span>}
        </Label>
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
      {hasError && errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
    </InputWrapper>
  );
}; 