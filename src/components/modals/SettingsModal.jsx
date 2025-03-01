import React from 'react';
import BaseModal from './BaseModal';
import { useSettings } from '@/contexts/SettingsContext';
import {
    SliderField,
    SwitchField,
    Flex,
    Heading,
    Button,
    Divider
} from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

const SettingsModal = ({ isOpen, onClose }) => {
    const { uiSettings, updateUISettings } = useSettings();
    const { speed, isSoundOn, mobileZoom, background } = uiSettings;

    const baseBackground = 'https://assets.letmedemo.com/public/gameboy/images/fullscreen/';
    const backgroundOptions = [
        { id: 'default', color: '#000000', image: `${baseBackground}default.png` },
        { id: 'red', color: '#ff0000', image: `${baseBackground}red.png` },
        { id: 'blue', color: '#b3e0ff', image: `${baseBackground}blue.png` },
        { id: 'green', color: '#c8e6c9', image: `${baseBackground}green.png` },
        { id: 'yellow', color: '#fff9c4', image: `${baseBackground}yellow.png` }
    ];

    const onSpeedChange = (value) => {
        updateUISettings({ speed: parseFloat(value) });
    };

    const onSoundToggle = () => {
        updateUISettings({ isSoundOn: !isSoundOn });
    };

    const onMobileZoomToggle = () => {
        updateUISettings({ mobileZoom: !mobileZoom });
    };

    const onBackgroundSelect = (imageFile) => {
        updateUISettings({ background: imageFile });
    };

    const resetSettings = () => {
        updateUISettings({
            speed: 1,
            isSoundOn: true,
            mobileZoom: false,
            background: 'https://assets.letmedemo.com/public/gameboy/images/fullscreen/default.png'
        });
    };

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} className="settings-modal">
            <Flex direction="column" gap="1.5rem" padding="1rem">
                <Heading level={4}>Game Settings</Heading>

                <SliderField
                    label="Game Speed"
                    value={speed}
                    onChange={onSpeedChange}
                    min={0.1}
                    max={5}
                    step={0.1}
                />

                <Divider />

                <SwitchField
                    label="Sound"
                    isChecked={isSoundOn}
                    onChange={onSoundToggle}
                    labelPosition="start"
                />

                <Divider />

                <SwitchField
                    label="Mobile Zoom"
                    isChecked={mobileZoom}
                    onChange={onMobileZoomToggle}
                    labelPosition="start"
                />

                <Divider />

                <label>Fullscreen Background</label>
                <div className="selectBackgroundContainer">
                    <Flex direction="row" gap="1rem" justifyContent="space-between">
                        {backgroundOptions.map((bg) => (
                            <div
                                key={bg.id}
                                className={`background-option ${uiSettings.background === bg.image ? 'selected' : ''}`}
                                style={{
                                    backgroundColor: bg.color,
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    cursor: 'pointer',
                                    border: uiSettings.background === bg.image ? '3px solid var(--amplify-colors-brand-primary-80)' : '2px solid var(--amplify-colors-border-primary)',
                                    transition: 'all 0.2s ease-in-out'
                                }}
                                onClick={() => onBackgroundSelect(bg.image)}
                            />
                        ))}
                    </Flex>
                </div>

                <Divider />

                <Button
                    variation="secondary"
                    onClick={resetSettings}
                    size="small"
                >
                    Reset to Defaults
                </Button>
            </Flex>
        </BaseModal>
    );
};

export default SettingsModal;