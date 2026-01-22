import { useState } from 'react';
import {
    Flex,
    TextField,
    TextAreaField,
    Alert,
    Heading,
    View
} from '@/components/ui';
import { ImageUpload } from '@/components/common/ImageUpload';
import { GameModel } from '@/types';
import { MemoryWatcherConfig } from '@/types/states';
import { getPresetByRomTitle, getDefaultPreset } from '@/data/memoryPresets';
import MemoryScannerSection from './MemoryScannerSection';
import buttons from '@/styles/buttons.module.css';
import styles from './styles.module.css';

interface GameEditFormProps {
    game: GameModel;
    gameImgRef: string;
    onSave: (gameData: GameModel & { imageFile?: File | null }) => Promise<void>;
    onDelete: (game: GameModel) => void;
}

export default function GameEditForm({ game, gameImgRef, onSave, onDelete }: GameEditFormProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [watchersExpanded, setWatchersExpanded] = useState(false);
    const [formData, setFormData] = useState(() => {
        // Parse metadata if it exists
        let metadata;
        try {
            metadata = game.metadata ? JSON.parse(game.metadata as string) : {};
        } catch (e) {
            console.error('Error parsing metadata:', e);
            metadata = {};
        }

        // Try to get preset based on game title, fall back to defaults
        const preset = getPresetByRomTitle(game.title) || getDefaultPreset();
        const defaultWatchers = {
            activeParty: preset.activeParty,
            gymBadges: preset.gymBadges,
            location: preset.location,
        };

        return {
            title: game.title || '',
            description: metadata.description || '',
            series: metadata.series || '',
            generation: metadata.generation || String(preset.generation),
            releaseDate: metadata.releaseDate || '',
            memoryWatchers: metadata.memoryWatchers || defaultWatchers
        };
    });

    // Determine generation for scanning
    const generation = (parseInt(formData.generation) === 2 ? 2 : 1) as 1 | 2;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await onSave({
                ...game,
                title: formData.title,
                img: game.img,
                metadata: {
                    description: formData.description,
                    series: formData.series,
                    generation: formData.generation,
                    releaseDate: formData.releaseDate,
                    memoryWatchers: formData.memoryWatchers
                },
                imageFile
            });
        } catch (err) {
            console.error('Error saving game:', err);
            setError('Failed to save changes. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const updateWatcherConfig = (
        watcher: 'activeParty' | 'gymBadges' | 'location',
        field: 'baseAddress' | 'offset' | 'size',
        value: string
    ) => {
        setFormData(prev => ({
            ...prev,
            memoryWatchers: {
                ...prev.memoryWatchers,
                [watcher]: {
                    ...prev.memoryWatchers[watcher],
                    [field]: value
                }
            }
        }));
    };

    const handleScanResult = (
        watcher: 'activeParty' | 'gymBadges' | 'location',
        config: MemoryWatcherConfig
    ) => {
        setFormData(prev => ({
            ...prev,
            memoryWatchers: {
                ...prev.memoryWatchers,
                [watcher]: {
                    ...prev.memoryWatchers[watcher],
                    baseAddress: config.baseAddress,
                    offset: config.offset || '0x00',
                }
            }
        }));
    };

    // Render watcher config with scanner and manual fields
    const renderWatcherFields = (
        watcher: 'activeParty' | 'gymBadges' | 'location',
        label: string
    ) => (
        <MemoryScannerSection
            watcherType={watcher}
            label={label}
            currentConfig={formData.memoryWatchers[watcher]}
            generation={generation}
            onConfigFound={(config) => handleScanResult(watcher, config)}
        >
            <div className={styles.watcherConfigFields}>
                <TextField
                    label="Base Address"
                    value={formData.memoryWatchers[watcher].baseAddress}
                    onChange={e => updateWatcherConfig(watcher, 'baseAddress', e.target.value)}
                    orientation="vertical"
                />
                <TextField
                    label="Offset"
                    value={formData.memoryWatchers[watcher].offset}
                    onChange={e => updateWatcherConfig(watcher, 'offset', e.target.value)}
                    orientation="vertical"
                />
                <TextField
                    label="Size"
                    value={formData.memoryWatchers[watcher].size}
                    onChange={e => updateWatcherConfig(watcher, 'size', e.target.value)}
                    orientation="vertical"
                />
            </div>
        </MemoryScannerSection>
    );

    return (
        <form onSubmit={handleSubmit} className={styles.editForm}>
            {error && <Alert $variation="error">{error}</Alert>}

            <div className={styles.imageSection}>
                <ImageUpload
                    value={gameImgRef}
                    onChange={(file) => setImageFile(file as File)}
                    label="Game Cover Image"
                />
            </div>

            <div className={styles.formSection}>
                <TextField
                    label="Title"
                    required
                    value={formData.title}
                    onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    orientation="vertical"
                />

                <TextAreaField
                    label="Description"
                    value={formData.description}
                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    orientation="vertical"
                />

                <div className={styles.formRow}>
                    <TextField
                        label="Series"
                        value={formData.series}
                        onChange={e => setFormData(prev => ({ ...prev, series: e.target.value }))}
                        orientation="vertical"
                    />
                    <TextField
                        label="Generation"
                        value={formData.generation}
                        onChange={e => setFormData(prev => ({ ...prev, generation: e.target.value }))}
                        orientation="vertical"
                    />
                    <TextField
                        label="Release Date"
                        type="date"
                        value={formData.releaseDate}
                        onChange={e => setFormData(prev => ({ ...prev, releaseDate: e.target.value }))}
                        orientation="vertical"
                    />
                </div>
            </div>

            {/* Collapsible Memory Watchers Section */}
            <div className={styles.watchersSection}>
                <div
                    className={styles.watchersSectionHeader}
                    onClick={() => setWatchersExpanded(!watchersExpanded)}
                >
                    <h6>Memory Watchers</h6>
                    <span className={`${styles.watchersSectionToggle} ${watchersExpanded ? styles.expanded : ''}`}>
                        ▼
                    </span>
                </div>
                <div className={`${styles.watchersSectionContent} ${!watchersExpanded ? styles.collapsed : ''}`}>
                    {renderWatcherFields('activeParty', 'Active Party')}
                    {renderWatcherFields('gymBadges', 'Gym Badges')}
                    {renderWatcherFields('location', 'Location')}
                </div>
            </div>

            <div className={buttons.buttonGroup} style={{ marginTop: '1rem', flexDirection: 'row', justifyContent: 'space-between' }}>
                    <button
                        className={buttons.warningButton}
                        onClick={() => onDelete(game)}
                        type="button"
                    >
                        Delete Game
                    </button>
                    <button
                        className={buttons.primaryButton}
                        type="submit"
                        disabled={loading}
                    >
                        Save Changes
                    </button>
                </div>
        </form>
    );
}
