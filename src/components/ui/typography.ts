import styled from 'styled-components';

interface HeadingProps {
  $textAlign?: 'left' | 'center' | 'right' | 'justify';
}

export const Heading = styled.h2<HeadingProps>`
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: ${({ theme }) => theme.typography.fontWeights.semibold};
  margin: 0;
  text-align: ${({ $textAlign }) => $textAlign || 'left'};
`;

// variants
export const H1 = styled(Heading).attrs({ as: 'h1' })`
  font-size: ${({ theme }) => theme.typography.fontSizes['3xl']};
`;

export const H2 = styled(Heading).attrs({ as: 'h2' })`
  font-size: ${({ theme }) => theme.typography.fontSizes.xl};
`;

export const H3 = styled(Heading).attrs({ as: 'h3' })`
  font-size: ${({ theme }) => theme.typography.fontSizes.xl};
`; 

export const H4 = styled(Heading).attrs({ as: 'h4' })`
  font-size: ${({ theme }) => theme.typography.fontSizes.lg};
`;

export const H5 = styled(Heading).attrs({ as: 'h5' })`
  font-size: ${({ theme }) => theme.typography.fontSizes.md};
`;

export const Paragraph = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSizes.md};
  line-height: 1.6;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;