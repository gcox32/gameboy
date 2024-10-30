import React from 'react';
import BaseModal from './BaseModal';
import { useSettings } from '@/contexts/SettingsContext';

const SettingsModal = ({ isOpen, onClose }) => {
    const { uiSettings, updateUISettings } = useSettings();
    const { speed, isSoundOn, skipConfirmation, mobileZoom } = uiSettings;

    const onSpeedChange = (e) => {
        const newSpeed = parseFloat(e.target.value);
        if (!isNaN(newSpeed) && newSpeed > 0) {
            updateUISettings({ speed: newSpeed });
        }
    };

    const onSoundToggle = () => {
        updateUISettings({ isSoundOn: !isSoundOn });
    };

    const onMobileZoomToggle = () => {
        updateUISettings({ mobileZoom: !mobileZoom });
    };

    const handleClose = () => {
        onClose();
    };

    return (
        <BaseModal isOpen={isOpen} onClose={handleClose} className="settings-modal">
            <h2>Settings</h2>
            <div className="setting">
                <label htmlFor="speed-control">Game Speed:</label>
                <input 
                    id="speed-control"
                    className="speed-control" 
                    type="number" 
                    min="0.1"
                    max="5"
                    step="0.1" 
                    value={speed} 
                    onChange={onSpeedChange}
                    title="game speed multiple" 
                />
            </div>
            <div className="setting">
                <label>Sound:</label>
                <button 
                    onClick={onSoundToggle}
                    className={isSoundOn ? 'active' : ''}
                >
                    {isSoundOn ? 'On' : 'Off'}
                </button>
            </div>
            <div className="setting mobile-only">
                <label>Mobile Zoom:</label>
                <button 
                    onClick={onMobileZoomToggle}
                    className={mobileZoom ? 'active' : ''}
                >
                    {mobileZoom ? 'On' : 'Off'}
                </button>
            </div>
        </BaseModal>
    );
};

export default SettingsModal;