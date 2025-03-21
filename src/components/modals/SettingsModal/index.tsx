import React, { useEffect } from 'react';
import BaseModal from '../BaseModal';
import { useSettings } from '@/contexts/SettingsContext';
import CustomSlider from '@/components/common/CustomSlider';
import CustomSwitch from '@/components/common/CustomSwitch';
import {
    Flex,
    Heading,
    Button,
    Divider
} from '@/components/ui';
import { backgroundOptions } from './config';
import styles from './styles.module.css';
import KeyMappingControl from './KeyMappingControl';
import { KeyMapping, defaultKeyMappings } from '@/contexts/SettingsContext';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const defaultBackground = 'https://assets.letmedemo.com/public/gameboy/images/fullscreen/default.jpeg';

const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
    const { uiSettings, updateUISettings } = useSettings();
    const [tempSettings, setTempSettings] = React.useState(uiSettings);

    const onSpeedChange = (value: number) => {
        setTempSettings(prev => ({ ...prev, speed: value }));
    };

    const onSoundToggle = () => {
        setTempSettings(prev => ({ ...prev, isSoundOn: !prev.isSoundOn }));
    };

    const onMobileZoomToggle = () => {
        setTempSettings(prev => ({ ...prev, mobileZoom: !prev.mobileZoom }));
    };

    const onDynamicBackgroundToggle = () => {
        setTempSettings(prev => ({ ...prev, isDynamicBackground: !prev.isDynamicBackground }));
    };

    const onBackgroundSelect = (imageRef: string | null | undefined) => {
        setTempSettings(prev => ({ ...prev, background: imageRef || defaultBackground }));
    };

    const onKeyMappingChange = (newMappings: KeyMapping[]) => {
        setTempSettings(prev => ({ ...prev, keyMappings: newMappings }));
    };

    const applySettings = () => {
        updateUISettings(tempSettings);
        localStorage.setItem('gameSettings', JSON.stringify(tempSettings));
        onClose();
    };

    const resetSettings = () => {
        const defaultSettings = {
            speed: 1,
            isSoundOn: true,
            mobileZoom: false,
            background: defaultBackground,
            isDynamicBackground: false,
            keyMappings: defaultKeyMappings
        };
        setTempSettings(defaultSettings);
        updateUISettings(defaultSettings);
        localStorage.setItem('gameSettings', JSON.stringify(defaultSettings));
    };

    useEffect(() => {
        if (isOpen) {
            setTempSettings(uiSettings);
        }
    }, [isOpen, uiSettings]);

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} className={styles.settingsModal}>
            <Flex $direction="column" $gap="1.5rem" $padding="1.5rem">
                <Heading as="h4">Game Settings</Heading>

                <CustomSlider
                    label="Game Speed"
                    value={tempSettings.speed}
                    onChange={onSpeedChange}
                    min={0.25}
                    max={4}
                    step={0.25}
                />

                <Divider />

                <CustomSwitch
                    label="Sound"
                    isChecked={tempSettings.isSoundOn}
                    onChange={onSoundToggle}
                />

                <Divider />

                <CustomSwitch
                    label="Mobile Zoom"
                    isChecked={tempSettings.mobileZoom}
                    onChange={onMobileZoomToggle}
                />

                <Divider />

                <label>Background</label>

                <CustomSwitch
                    label="Dynamic"
                    isChecked={tempSettings.isDynamicBackground}
                    onChange={onDynamicBackgroundToggle}
                />

                <div className={styles.backgroundOptions}>
                    {!tempSettings.isDynamicBackground && backgroundOptions.map((bg) => (
                        <button
                            key={bg.id}
                            className={`${styles.backgroundOption} ${
                                tempSettings.background === bg.image ? styles.selected : ''
                            }`}
                            style={{ backgroundColor: bg.color }}
                            onClick={() => onBackgroundSelect(bg.image)}
                        />
                    ))}
                </div>

                <Divider />

                <label>Controls</label>
                <KeyMappingControl 
                    mappings={tempSettings.keyMappings}
                    onChange={onKeyMappingChange}
                />

                <Divider />

                <Flex $gap="1rem">
                    <Button
                        onClick={resetSettings}
                        size="small"
                        className={styles.resetButton}
                    >
                        Reset
                    </Button>
                    <Button
                        onClick={applySettings}
                        size="small"
                        className={styles.applyButton}
                    >
                        Apply
                    </Button>
                </Flex>
            </Flex>
        </BaseModal>
    );
};

export default SettingsModal;