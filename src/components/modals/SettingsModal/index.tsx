import clsx from 'clsx';
import BaseModal from '../BaseModal';
import CustomSwitch from '@/components/common/CustomSwitch';
import { defaultUISettings, useSettings } from '@/contexts/SettingsContext';
import { backgroundOptions } from './config';
import KeyMappingControl from './KeyMappingControl';
import styles from './styles.module.css';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// Changes apply and save as they're made
const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
    const { uiSettings, updateUISettings } = useSettings();
    const { background, isDynamicBackground, keyMappings, skipConfirmations } = uiSettings;

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            ariaLabel="Settings"
            className={`${styles.modalContent} ${styles.settingsModal}`}
        >
            <div className={styles.body}>
                <h2 className={styles.title}>Settings</h2>

                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h3 className={styles.sectionTitle}>Background</h3>
                        <button
                            type="button"
                            className={styles.resetButton}
                            onClick={() => updateUISettings({
                                background: defaultUISettings.background,
                                isDynamicBackground: defaultUISettings.isDynamicBackground,
                            })}
                        >
                            Reset
                        </button>
                    </div>
                    <div className={styles.backgroundOptions} role="radiogroup" aria-label="Background">
                        <button
                            type="button"
                            role="radio"
                            aria-checked={isDynamicBackground}
                            className={clsx(styles.backgroundOption, styles.dynamicOption, isDynamicBackground && styles.selected)}
                            onClick={() => updateUISettings({ isDynamicBackground: true })}
                        >
                            Dynamic Background
                        </button>
                        {backgroundOptions.map((option) => {
                            const isSelected = !isDynamicBackground && background === option.image;
                            return (
                                <button
                                    key={option.id}
                                    type="button"
                                    role="radio"
                                    aria-checked={isSelected}
                                    aria-label={`${option.id} background`}
                                    className={clsx(styles.backgroundOption, isSelected && styles.selected)}
                                    style={{ backgroundColor: option.color }}
                                    onClick={() => updateUISettings({ background: option.image, isDynamicBackground: false })}
                                />
                            );
                        })}
                    </div>
                </section>

                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h3 className={styles.sectionTitle}>Controls</h3>
                        <button
                            type="button"
                            className={styles.resetButton}
                            onClick={() => updateUISettings({ keyMappings: defaultUISettings.keyMappings })}
                        >
                            Reset
                        </button>
                    </div>
                    <KeyMappingControl
                        mappings={keyMappings}
                        onChange={(newMappings) => updateUISettings({ keyMappings: newMappings })}
                    />
                </section>

                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>Confirmations</h3>
                    <CustomSwitch
                        label="Ask before interrupting a running game"
                        isChecked={!skipConfirmations}
                        onChange={() => updateUISettings({ skipConfirmations: !skipConfirmations })}
                    />
                </section>
            </div>
        </BaseModal>
    );
};

export default SettingsModal;
