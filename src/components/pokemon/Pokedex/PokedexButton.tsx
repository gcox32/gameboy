import { ReactNode } from 'react';
import styles from './styles.module.css';

interface PokedexButtonProps {
    children?: ReactNode;
    className?: string;
    onClick: () => void;
}

export default function PokedexButton({ children, className, onClick }: PokedexButtonProps) {
    return (
        <div className={`${styles.dexButton} ${className}`} onClick={onClick}>
            {children}
        </div>
    );
}