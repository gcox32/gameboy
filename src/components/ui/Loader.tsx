'use client';

import styled, { keyframes } from 'styled-components';

type LoaderVariation = 'circular' | 'linear';

interface LoaderProps {
  variation?: LoaderVariation;
  size?: 'small' | 'medium' | 'large';
}

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const slide = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
`;

const getLoaderSize = (size: LoaderProps['size'] = 'medium') => {
  const sizes = {
    small: '16px',
    medium: '24px',
    large: '32px'
  };
  return sizes[size];
};

const CircularLoader = styled.div<LoaderProps>`
  display: inline-block;
  width: ${props => getLoaderSize(props.size)};
  height: ${props => getLoaderSize(props.size)};
  border: 2px solid ${({ theme }) => theme.colors.border.primary};
  border-top-color: ${({ theme }) => theme.colors.button.primary.background};
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

const LinearLoaderContainer = styled.div`
  width: 100%;
  height: 4px;
  background-color: ${({ theme }) => theme.colors.background.secondary};
  overflow: hidden;
  position: relative;
`;

const LinearLoaderBar = styled.div`
  width: 30%;
  height: 100%;
  background-color: ${({ theme }) => theme.colors.button.primary.background};
  position: absolute;
  animation: ${slide} 1s infinite ease-in-out;
`;

export const Loader: React.FC<LoaderProps> = ({ variation = 'circular', size = 'medium' }) => {
  if (variation === 'linear') {
    return (
      <LinearLoaderContainer>
        <LinearLoaderBar />
      </LinearLoaderContainer>
    );
  }

  return <CircularLoader size={size} />;
}; 