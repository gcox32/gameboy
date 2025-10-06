import React from 'react';
import styles from '@/styles/admin.module.css';

interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export default function SearchInput({
    value,
    onChange,
    placeholder = "Search...",
    className
}: SearchInputProps) {
    return (
        <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={`${styles.searchInput} ${className || ''}`}
        />
    );
}
