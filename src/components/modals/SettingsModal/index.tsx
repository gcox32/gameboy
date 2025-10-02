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
import buttons from '@/styles/buttons.module.css';

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
            <Flex $direction="column" $gap="2rem" $padding="2rem">
                <Heading as="h3" className={styles.modalTitle}>Game Settings</Heading>

                <section className={styles.settingsSection}>
                    <Heading as="h4" className={styles.sectionTitle}>Game Speed</Heading>
                    <CustomSlider
                        label="Adjust game speed"
                        value={tempSettings.speed}
                        onChange={onSpeedChange}
                        min={0.25}
                        max={4}
                        step={0.25}
                    />
                </section>

                <Divider />

                <section className={styles.settingsSection}>
                    <Heading as="h4" className={styles.sectionTitle}>Audio & Display</Heading>
                    <Flex $direction="column" $gap="1rem">
                        <CustomSwitch
                            label="Sound Effects"
                            isChecked={tempSettings.isSoundOn}
                            onChange={onSoundToggle}
                        />
                        <CustomSwitch
                            label="Mobile Zoom"
                            isChecked={tempSettings.mobileZoom}
                            onChange={onMobileZoomToggle}
                        />
                    </Flex>
                </section>

                <Divider />

                <section className={styles.settingsSection}>
                    <Heading as="h4" className={styles.sectionTitle}>Background</Heading>
                    <CustomSwitch
                        label="Dynamic Background"
                        isChecked={tempSettings.isDynamicBackground}
                        onChange={onDynamicBackgroundToggle}
                        className={styles.dynamicSwitch}
                    />

                    <div className={styles.backgroundOptions}>
                        {backgroundOptions.map((bg) => (
                            <button
                                key={bg.id}
                                className={`${styles.backgroundOption} ${!tempSettings.isDynamicBackground && tempSettings.background === bg.image ? styles.selected : ''
                                    }`}
                                style={{ backgroundColor: bg.color }}
                                onClick={() => !tempSettings.isDynamicBackground && onBackgroundSelect(bg.image)}
                                disabled={tempSettings.isDynamicBackground}
                            />
                        ))}
                    </div>
                </section>

                <Divider />

                <section className={styles.settingsSection}>
                    <Heading as="h4" className={styles.sectionTitle}>Controls</Heading>
                    <KeyMappingControl
                        mappings={tempSettings.keyMappings}
                        onChange={onKeyMappingChange}
                    />
                </section>

                <Divider />

                <div className={buttons.buttonGroup} style={{ marginTop: '1rem' }}>
                    <button
                        onClick={applySettings}
                        className={buttons.primaryButton}
                    >
                        Apply Changes
                    </button>
                    <button
                        onClick={resetSettings}
                        className={buttons.warningButton}
                    >
                        Reset All
                    </button>
                </div>
            </Flex>
        </BaseModal>
    );
};

export default SettingsModal;