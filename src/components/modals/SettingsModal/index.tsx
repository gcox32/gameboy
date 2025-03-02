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

const SettingsModal = ({ isOpen, onClose }) => {
    const { uiSettings, updateUISettings } = useSettings();
    const { speed, isSoundOn, mobileZoom } = uiSettings;

    const onSpeedChange = (value) => {
        updateUISettings({ speed: value });
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
            background: 'https://assets.letmedemo.com/public/gameboy/images/fullscreen/default.jpeg'
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

                <label>Fullscreen Background</label>
                <div className={styles.backgroundOptions}>
                    {backgroundOptions.map((bg) => (
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
                    variation="secondary"
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