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

export const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  width: 100%;
  height: 100vh;
  overflow: scroll;
`; 

export const Card = styled.div`
  background-color: ${({ theme }) => theme.colors.system.background};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

export const Section = styled.section`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

export const List = styled.ul`
  margin-bottom: ${({ theme }) => theme.spacing.md};
  padding-left: ${({ theme }) => theme.spacing.xl};
  & li {
    margin-bottom: ${({ theme }) => theme.spacing.xs}
  }
`;

export const OrderedList = styled.ol`
  margin-bottom: ${({ theme }) => theme.spacing.md};
  padding-left: ${({ theme }) => theme.spacing.xl};
  & li {
    margin-bottom: ${({ theme }) => theme.spacing.xs}
  }
`;