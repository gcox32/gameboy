import React from 'react';
import BaseModal from './BaseModal';

const SettingsModal = ({ 
    isOpen, 
    onClose, 
    speed, 
    onSpeedChange, 
    isSoundOn, 
    onSoundToggle, 
    skipConfirmation, 
    onSkipConfirmationToggle,
    onMobileZoomToggle 
}) => {
    return (
        <BaseModal isOpen={isOpen} onClose={onClose} className="settings-modal">
            <h2>Settings</h2>
            <div className="setting">
                <label htmlFor="speed-control">Game Speed:</label>
                <input 
                    id="speed-control"
                    className="speed-control" 
                    type="number" 
                    step="0.5" 
                    value={speed} 
                    onChange={onSpeedChange}
                    title="game speed multiple" 
                />
            </div>
            <div className="setting">
                <label>Sound:</label>
                <button onClick={onSoundToggle}>
                    {isSoundOn ? 'On' : 'Off'}
                </button>
            </div>
            <div className="setting">
                <label>Skip Confirmations:</label>
                <input 
                    type="checkbox" 
                    checked={skipConfirmation} 
                    onChange={onSkipConfirmationToggle}
                />
            </div>
            <div className="setting mobile-only">
                <label>Mobile Zoom:</label>
                <button onClick={onMobileZoomToggle}>Toggle</button>
            </div>
        </BaseModal>
    );
};

export default SettingsModal;