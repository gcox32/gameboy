import React from 'react';
import BaseModal from '../BaseModal';
import { useSettings } from '@/contexts/SettingsContext';
import CustomSlider from '@/components/common/CustomSlider';
import CustomSwitch from '@/components/common/CustomSwitch';
import {
    Flex,
    Heading,
    Button,
    Divider
} from '@aws-amplify/ui-react';
import { backgroundOptions } from './config';
import styles from './styles.module.css';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const defaultBackground = 'https://assets.letmedemo.com/public/gameboy/images/fullscreen/default.jpeg';

const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
    const { uiSettings, updateUISettings } = useSettings();
    const { speed, isSoundOn, mobileZoom, isDynamicBackground } = uiSettings;

    const onSpeedChange = (value: number) => {
        updateUISettings({ speed: value });
    };

    const onSoundToggle = () => {
        updateUISettings({ isSoundOn: !isSoundOn });
    };

    const onMobileZoomToggle = () => {
        updateUISettings({ mobileZoom: !mobileZoom });
    };

    const onDynamicBackgroundToggle = () => {
        updateUISettings({ isDynamicBackground: !isDynamicBackground });
    };

    const onBackgroundSelect = (imageRef: string | null | undefined) => {
        updateUISettings({ background: imageRef || defaultBackground });
    };

    const resetSettings = () => {
        updateUISettings({
            speed: 1,
            isSoundOn: true,
            mobileZoom: false,
            background: defaultBackground,
            isDynamicBackground: false
        });
    };

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} className="settings-modal">
            <Flex direction="column" gap="1.5rem" padding="1.5rem">
                <Heading level={4}>Game Settings</Heading>

                <CustomSlider
                    label="Game Speed"
                    value={speed}
                    onChange={onSpeedChange}
                    min={0.25}
                    max={4}
                    step={0.25}
                />

                <Divider />

                <CustomSwitch
                    label="Sound"
                    isChecked={isSoundOn}
                    onChange={onSoundToggle}
                />

                <Divider />

                <CustomSwitch
                    label="Mobile Zoom"
                    isChecked={mobileZoom}
                    onChange={onMobileZoomToggle}
                />

                <Divider />

                <CustomSwitch
                    label="Dynamic Background"
                    isChecked={isDynamicBackground}
                    onChange={onDynamicBackgroundToggle}
                />

                <Divider />

                <label>Fullscreen Background</label>
                <div className={styles.backgroundOptions}>
                    {!isDynamicBackground && backgroundOptions.map((bg) => (
                        <button
                            key={bg.id}
                            className={`${styles.backgroundOption} ${
                                uiSettings.background === bg.image ? styles.selected : ''
                            }`}
                            style={{ backgroundColor: bg.color }}
                            onClick={() => onBackgroundSelect(bg.image)}
                        />
                    ))}
                </div>

                <Divider />

                <Button
                    onClick={resetSettings}
                    size="small"
                    className={styles.resetButton}
                >
                    Reset to Defaults
                </Button>
            </Flex>
        </BaseModal>
    );
};

export default SettingsModal;