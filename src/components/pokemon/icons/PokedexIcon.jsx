import React from "react";

export function PokedexIcon(props) {
    return (
        <svg {...props} viewBox="0 0 24 24">
            <path d="M20 8h-3V5c0-1.1-.9-2-2-2h-6c-1.1 0-2 .9-2 2v3H4c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h3v3c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2v-3h3c1.1 0 2-.9 2-2v-4c0-1.1-.9-2-2-2zM13 5v3h-2V5h2zm0 14h-2v-3h2v3zm7-6h-3v-4h3v4z" />
        </svg>
    );
}

export default PokedexIcon;