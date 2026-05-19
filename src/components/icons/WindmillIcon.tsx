import { SVGProps } from 'react';

export default function WindmillIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ width: 20, height: 20 }}
            {...props}
        >
            {/* Blades — two rects rotated ±45° around hub */}
            <g transform="rotate(45, 12, 8)">
                <rect x="11.1" y="0.5" width="1.8" height="15" rx="0.6" />
            </g>
            <g transform="rotate(-45, 12, 8)">
                <rect x="11.1" y="0.5" width="1.8" height="15" rx="0.6" />
            </g>
            {/* Tower body: pentagon with peak at hub, wide at base */}
            <path d="M5 22 L9 10.5 L12 8 L15 10.5 L19 22 Z" />
            {/* Hub — filled so it reads as a solid centre point */}
            <circle cx="12" cy="8" r="1.3" fill="currentColor" stroke="none" />
        </svg>
    );
}
