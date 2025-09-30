'use client';

import styled from 'styled-components';

interface CheckboxFieldProps {
  label: string;
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  $labelPosition?: 'start' | 'end';
  $justifyContent?: 'center' | 'flex-start' | 'flex-end';
  $alignItems?: 'center' | 'flex-start' | 'flex-end';
}

const Container = styled.div<{ 
  $justifyContent?: string;
  $alignItems?: string;
}>`
  display: flex;
  justify-content: ${({ $justifyContent = 'flex-start' }) => $justifyContent};
  align-items: ${({ $alignItems = 'center' }) => $alignItems};
  gap: 0.5rem;
`;

const Label = styled.label`
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.875rem;
  cursor: pointer;
`;

const Input = styled.input`
  cursor: pointer;
  width: 1rem;
  height: 1rem;
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
}: CheckboxFieldProps) {
  return (
    <Container $justifyContent={$justifyContent} $alignItems={$alignItems}>
      {$labelPosition === 'start' && <Label htmlFor={name}>{label}</Label>}
      <Input
        type="checkbox"
        id={name}
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
      />
      {$labelPosition === 'end' && <Label htmlFor={name}>{label}</Label>}
    </Container>
  );
} 