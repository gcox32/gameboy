import React from 'react';
import BaseModal from './BaseModal';
import { useSettings } from '@/contexts/SettingsContext';
import {
    SliderField,
    SwitchField,
    Flex,
    Heading,
    Text,
    Button,
    Divider
} from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

const SettingsModal = ({ isOpen, onClose }) => {
    const { uiSettings, updateUISettings } = useSettings();
    const { speed, isSoundOn, mobileZoom } = uiSettings;

    const onSpeedChange = (value) => {
        updateUISettings({ speed: parseFloat(value) });
    };

    const onSoundToggle = () => {
        updateUISettings({ isSoundOn: !isSoundOn });
    };

    const onMobileZoomToggle = () => {
        updateUISettings({ mobileZoom: !mobileZoom });
    };

    const resetSettings = () => {
        updateUISettings({
            speed: 1,
            isSoundOn: true,
            mobileZoom: false
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
                    labelHelpText={`Current speed: ${speed}x`}
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