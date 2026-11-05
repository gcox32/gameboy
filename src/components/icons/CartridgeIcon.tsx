// Drawn to match the lucide icons around it: 24px grid, 2px rounded strokes
export default function CartridgeIcon({ size = 24 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            {/* Shell */}
            <path d="M6 3h12a1 1 0 0 1 1 1v17H5V4a1 1 0 0 1 1-1z" />
            {/* Label */}
            <rect x="8.5" y="7" width="7" height="7" rx="1" />
            {/* Contacts */}
            <path d="M9 21v-3" />
            <path d="M12 21v-3" />
            <path d="M15 21v-3" />
        </svg>
    );
}
