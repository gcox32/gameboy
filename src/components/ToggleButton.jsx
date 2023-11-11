import React from 'react';

function ToggleButton({ onClick, isPanelVisible }) {
    return (
        <button 
            onClick={onClick} 
            className={`toggle-handle ${isPanelVisible ? '' : 'collapsed'}`}
        >
            {isPanelVisible ? 'Hide' : 'Show'}
        </button>
    );
}

export default ToggleButton;
