/** Formatting shared by the admin panels */

export const compact = new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 });
export const whole = new Intl.NumberFormat();
export const dateLabel = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });

export function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    const units = ['KB', 'MB', 'GB', 'TB'];
    let value = bytes / 1024, i = 0;
    while (value >= 1024 && i < units.length - 1) { value /= 1024; i++; }
    return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[i]}`;
}

export function daysAgo(iso: string | Date): string {
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
    return days <= 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`;
}

/** "today", "3d ago", "6mo ago", "2y ago": short enough for a table column */
export function shortAgo(iso: string | Date): string {
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
    if (days <= 0) return 'today';
    if (days < 60) return `${days}d ago`;
    if (days < 730) return `${Math.floor(days / 30)}mo ago`;
    return `${Math.floor(days / 365)}y ago`;
}

/** "in 12 minutes", "in 1 minute", for a time soon after now */
export function minutesUntil(iso: string | Date): string {
    const minutes = Math.max(1, Math.ceil((new Date(iso).getTime() - Date.now()) / 60_000));
    return `in ${plural(minutes, 'minute')}`;
}

export const plural = (n: number, one: string, many = `${one}s`) => `${whole.format(n)} ${n === 1 ? one : many}`;

/** "in 40m", "in 5h", "in 3d", for a time after now; "expired" once it's passed */
export function shortUntil(iso: string | Date): string {
    const minutes = Math.ceil((new Date(iso).getTime() - Date.now()) / 60_000);
    if (minutes <= 0) return 'expired';
    if (minutes < 60) return `in ${minutes}m`;
    if (minutes < 48 * 60) return `in ${Math.round(minutes / 60)}h`;
    return `in ${Math.round(minutes / (24 * 60))}d`;
}
