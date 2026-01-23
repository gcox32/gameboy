import React from 'react';
import { Text } from '@/components/ui';
import styles from '@/styles/admin.module.css';

interface Column<T> {
    key: keyof T | string;
    header: string;
    render?: (item: T) => React.ReactNode;
    sortable?: boolean;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    loading?: boolean;
    emptyMessage?: string;
    onSort?: (key: string, direction: 'asc' | 'desc') => void;
    currentSort?: { key: string; direction: 'asc' | 'desc' } | null;
}

export default function DataTable<T extends Record<string, any>>({
    data,
    columns,
    loading = false,
    emptyMessage = "No data available",
    onSort,
    currentSort
}: DataTableProps<T>) {
    // Always render the table structure to maintain consistent width
    return (
        <div className={styles.tableContainer} style={{ minHeight: '500px' }}>
            <table className={styles.dataTable}>
                <thead>
                    <tr>
                        {columns.map((column) => (
                            <th
                                key={String(column.key)}
                                className={column.sortable ? styles.sortable : ''}
                                onClick={() => {
                                    if (column.sortable && onSort) {
                                        const newDirection = currentSort?.key === column.key && currentSort.direction === 'asc' ? 'desc' : 'asc';
                                        onSort(String(column.key), newDirection);
                                    }
                                }}
                            >
                                <div className={styles.headerContent}>
                                    {column.header}
                                    {column.sortable && currentSort?.key === column.key && (
                                        <span className={styles.sortIndicator}>
                                            {currentSort.direction === 'asc' ? '↑' : '↓'}
                                        </span>
                                    )}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <></>
                    ) : data.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length} className={styles.emptyState}>
                                <div className={styles.emptyStateIcon}>📭</div>
                                <Text>{emptyMessage}</Text>
                            </td>
                        </tr>
                    ) : (
                        data.map((item, index) => (
                            <tr key={index}>
                                {columns.map((column) => (
                                    <td key={String(column.key)}>
                                        {column.render ? column.render(item) : String(item[column.key])}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
