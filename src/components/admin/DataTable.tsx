'use client';

import { CSSProperties, ReactNode, useMemo, useState } from 'react';
import { Text } from '@/components/ui';
import styles from '@/styles/admin.module.css';

type SortValue = string | number | boolean | null | undefined;
export type SortDirection = 'asc' | 'desc';
export interface TableSort { key: string; direction: SortDirection }

export interface Column<T> {
    key: string;
    header: ReactNode;
    render?: (item: T) => ReactNode;
    /** Makes the column sortable, by this value */
    sortValue?: (item: T) => SortValue;
    /** Server-sorted tables: the column can be sorted, by the server, under its key */
    sortable?: boolean;
    /** Which way a first click sorts; dates and counts read best biggest first */
    firstDirection?: SortDirection;
    /** A fixed width, e.g. '6rem'; columns without one share the rest */
    width?: string;
    /** Wraps onto more lines instead of cutting the text off, for sentences */
    wrap?: boolean;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    rowKey: (item: T) => string;
    loading?: boolean;
    emptyMessage?: string;
    /** Drops the minimum height, for a short table inside a card */
    compact?: boolean;
    /** Sorting done elsewhere (on the server): the current sort, and what to call when it changes. Rows are shown in the order given. */
    sort?: TableSort;
    onSortChange?: (sort: TableSort) => void;
}

const isEmpty = (v: SortValue) => v == null || v === '';

/**
 * The narrowest the table can get on a phone before it scrolls sideways instead: each fixed-width
 * column at its width, and room for a few words in each of the rest.
 */
function minWidthRem<T>(columns: Column<T>[]): number {
    return columns.reduce((sum, c) => sum + (c.width?.endsWith('rem') ? parseFloat(c.width) : 12), 0);
}

function compare(a: SortValue, b: SortValue): number {
    if (isEmpty(a)) return isEmpty(b) ? 0 : 1;
    if (isEmpty(b)) return -1;
    if (typeof a === 'string' && typeof b === 'string') return a.localeCompare(b, undefined, { sensitivity: 'base' });
    return a < b ? -1 : a > b ? 1 : 0;
}

export default function DataTable<T>({
    data, columns, rowKey, loading = false, emptyMessage = 'No data available', compact = false, sort: outerSort, onSortChange,
}: DataTableProps<T>) {
    const [localSort, setLocalSort] = useState<TableSort | null>(null);
    const controlled = !!onSortChange;
    const sort = controlled ? outerSort ?? null : localSort;
    const canSort = (c: Column<T>) => (controlled ? !!c.sortable : !!c.sortValue);

    const rows = useMemo(() => {
        if (controlled || !sort) return data;
        const column = columns.find((c) => c.key === sort.key);
        if (!column?.sortValue) return data;
        const value = column.sortValue;
        const sign = sort.direction === 'asc' ? 1 : -1;
        return [...data].sort((a, b) => {
            const va = value(a), vb = value(b);
            // Empties stay last whichever way it's sorted, so they're left out of the flip
            return isEmpty(va) || isEmpty(vb) ? compare(va, vb) : sign * compare(va, vb);
        });
    }, [data, columns, sort, controlled]);

    const toggleSort = (column: Column<T>) => {
        const direction: SortDirection = sort?.key === column.key
            ? (sort.direction === 'asc' ? 'desc' : 'asc')
            : column.firstDirection ?? 'asc';
        const next = { key: column.key, direction };
        if (controlled) onSortChange(next); else setLocalSort(next);
    };

    return (
        <div className={compact ? styles.tableContainerCompact : styles.tableContainer}>
            <table className={styles.dataTable} style={{ '--table-min-width': `${minWidthRem(columns)}rem` } as CSSProperties}>
                <thead>
                    <tr>
                        {columns.map((column) => {
                            const active = sort?.key === column.key;
                            return (
                                <th
                                    key={column.key}
                                    className={canSort(column) ? styles.sortable : undefined}
                                    style={column.width ? { width: column.width } : undefined}
                                    onClick={canSort(column) ? () => toggleSort(column) : undefined}
                                    aria-sort={active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : undefined}
                                >
                                    <div className={styles.headerContent}>
                                        {column.header}
                                        {active && (
                                            <span className={styles.sortIndicator}>{sort.direction === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </div>
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody>
                    {loading || rows.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length} className={styles.emptyState}>
                                <Text>{loading ? 'Loading…' : emptyMessage}</Text>
                            </td>
                        </tr>
                    ) : (
                        rows.map((item) => (
                            <tr key={rowKey(item)}>
                                {columns.map((column) => (
                                    <td key={column.key} className={column.wrap ? styles.wrapCell : undefined}>
                                        {column.render ? column.render(item) : String((item as Record<string, unknown>)[column.key] ?? '')}
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
