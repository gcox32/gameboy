import styled from 'styled-components';

export const Flex = styled.div<{
  $direction?: 'row' | 'column';
  $gap?: number | string;
  $padding?: number | string;
  $alignItems?: 'center' | 'flex-start' | 'flex-end' | 'stretch';
  $justifyContent?: 'center' | 'flex-start' | 'flex-end' | 'space-between' | 'space-around';
}>`
  display: flex;
  flex-direction: ${({ $direction = 'row' }) => $direction};
  gap: ${({ $gap = 0 }) => $gap};
  padding: ${({ $padding = 0 }) => $padding};
  align-items: ${({ $alignItems = 'stretch' }) => $alignItems};
  justify-content: ${({ $justifyContent = 'flex-start' }) => $justifyContent};
`;

export const View = styled.div<{
  $textAlign?: 'left' | 'center' | 'right' | 'justify';
  $padding?: number | string;
  $margin?: number | string;
  $width?: number | string;
  $height?: number | string;
  $backgroundColor?: string;
  $borderRadius?: number | string;
  $border?: string;
  $flexDirection?: 'row' | 'column';
  $alignItems?: 'center' | 'flex-start' | 'flex-end' | 'stretch';
  $justifyContent?: 'center' | 'flex-start' | 'flex-end' | 'space-between' | 'space-around';
}>`
  display: flex;
  text-align: ${({ $textAlign = 'left' }) => $textAlign};
  padding: ${({ $padding = 0 }) => $padding};
  margin: ${({ $margin = 0 }) => $margin};
  width: ${({ $width = 'auto' }) => $width};
  height: ${({ $height = 'auto' }) => $height};
  background-color: ${({ $backgroundColor = 'transparent' }) => $backgroundColor};
  border-radius: ${({ $borderRadius = 0 }) => $borderRadius};
  border: ${({ $border = 'none' }) => $border};
  flex-direction: ${({ $flexDirection = 'row' }) => $flexDirection};
  align-items: ${({ $alignItems = 'stretch' }) => $alignItems};
  justify-content: ${({ $justifyContent = 'flex-start' }) => $justifyContent};
`;

export const Divider = styled.hr`
  width: 100%;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  margin: 1rem 0;
`; 