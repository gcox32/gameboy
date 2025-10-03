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
import { GameModel } from '@/types/models';
import buttons from '@/styles/buttons.module.css';

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
    const [formData, setFormData] = useState(() => {
        // Parse metadata if it exists
        let metadata;
        try {
            metadata = game.metadata ? JSON.parse(game.metadata as string) : {};
        } catch (e) {
            console.error('Error parsing metadata:', e);
            metadata = {};
        }

        // Default memory watcher values
        const defaultWatchers = {
            activeParty: {
                baseAddress: '0xD163', // true blue is 0xD162
                offset: '0x00',
                size: '0x195'
            },
            gymBadges: {
                baseAddress: '0xD2F6',
                offset: '0x60', // true blue is 0x5F
                size: '0x1'
            },
            location: {
                baseAddress: '0xD2F6',
                offset: '0x68', // true blue is 0x67
                size: '0x1'
            }
        };

        return {
            title: game.title || '',
            description: metadata.description || '',
            series: metadata.series || '',
            generation: metadata.generation || '',
            releaseDate: metadata.releaseDate || '',
            memoryWatchers: metadata.memoryWatchers || defaultWatchers
        };
    });

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

    // Add this section after the existing form fields, before the buttons
    const renderWatcherFields = (
        watcher: 'activeParty' | 'gymBadges' | 'location',
        label: string
    ) => (
        <View $padding="1rem" $backgroundColor="rgba(0,0,0,0.05)" $borderRadius="medium">
            <Heading as="h6">{label} Memory Configuration</Heading>
            <Flex $direction="row" $gap="1rem">
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
            </Flex>
        </View>
    );

    return (
        <form onSubmit={handleSubmit}>
            <Flex $direction="column" $gap="1rem">
                <Flex $justifyContent="space-between" $alignItems="center">
                    <Heading as="h5">Edit Game Details</Heading>
                </Flex>

                {error && <Alert $variation="error">{error}</Alert>}

                <View $flexDirection="column" $alignItems="center">
                    <ImageUpload
                        value={gameImgRef}
                        onChange={(file) => setImageFile(file as File)}
                        label="Game Cover Image"
                    />
                </View>

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

                <Flex $direction="row" $gap="1rem">
                    <TextField
                        label="Series"
                        value={formData.series}
                        onChange={e => setFormData(prev => ({ ...prev, series: e.target.value }))}
                        orientation="vertical"
                        $flex="1"
                    />
                    <TextField
                        label="Generation"
                        value={formData.generation}
                        onChange={e => setFormData(prev => ({ ...prev, generation: e.target.value }))}
                        orientation="vertical"
                        $flex="1"
                    />
                    <TextField
                        label="Release Date"
                        type="date"
                        value={formData.releaseDate}
                        onChange={e => setFormData(prev => ({ ...prev, releaseDate: e.target.value }))}
                        orientation="vertical"
                        $flex="1"
                    />
                </Flex>

                <Heading as="h6">Memory Watchers</Heading>
                {renderWatcherFields('activeParty', 'Active Party')}
                {renderWatcherFields('gymBadges', 'Gym Badges')}
                {renderWatcherFields('location', 'Location')}

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
            </Flex>
        </form>
    );
} 