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
    // The placeholder doubles as the label, since there's no visible one
    return (
        <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            aria-label={placeholder.replace(/\.+$/, '').replace('…', '')}
            className={`${styles.searchInput} ${className || ''}`}
        />
    );
}
