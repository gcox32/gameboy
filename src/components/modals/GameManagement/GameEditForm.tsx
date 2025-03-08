import { useState } from 'react';
import {
    Button,
    Flex,
    TextField,
    TextAreaField,
    Alert,
    Heading,
    View
} from '@aws-amplify/ui-react';
import { ImageUpload } from '@/components/common/ImageUpload';

interface Game {
    id: string;
    title: string;
    img?: string;
    filePath: string;
    metadata?: {
        description?: string;
        series?: string;
        generation?: string;
        releaseDate?: string;
    };
}

interface GameEditFormProps {
    game: Game;
    gameImgRef: string;
    onSave: (gameData: Game & { imageFile?: File | null }) => Promise<void>;
    onCancel: () => void;
    onDelete: (game: Game) => void;
}

export default function GameEditForm({ game, gameImgRef, onSave, onCancel, onDelete }: GameEditFormProps) {
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

        return {
            title: game.title || '',
            description: metadata.description || '',
            series: metadata.series || '',
            generation: metadata.generation || '',
            releaseDate: metadata.releaseDate || '',
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
                img: game.img, // This will be handled by the parent component
                metadata: {
                    description: formData.description,
                    series: formData.series,
                    generation: formData.generation,
                    releaseDate: formData.releaseDate
                },
                imageFile // Pass the new image file if one was selected
            });
        } catch (err) {
            console.error('Error saving game:', err);
            setError('Failed to save changes. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <Flex direction="column" gap="1rem">
                <Flex justifyContent="space-between" alignItems="center">
                    <Heading level={5}>Edit Game Details</Heading>
                    <Button
                        variation="destructive"
                        onClick={() => onDelete(game)}
                        type="button"
                        size="small"
                    >
                        Delete Game
                    </Button>
                </Flex>

                {error && <Alert variation="error">{error}</Alert>}

                <View>
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
                />

                <TextAreaField
                    label="Description"
                    value={formData.description}
                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />

                <TextField
                    label="Series"
                    value={formData.series}
                    onChange={e => setFormData(prev => ({ ...prev, series: e.target.value }))}
                />

                <TextField
                    label="Generation"
                    value={formData.generation}
                    onChange={e => setFormData(prev => ({ ...prev, generation: e.target.value }))}
                />

                <TextField
                    label="Release Date"
                    type="date"
                    value={formData.releaseDate}
                    onChange={e => setFormData(prev => ({ ...prev, releaseDate: e.target.value }))}
                />

                <Flex direction="row" gap="1rem" justifyContent="flex-end">
                    <Button
                        variation="destructive"
                        onClick={onCancel}
                        type="button"
                    >
                        Cancel
                    </Button>
                    <Button
                        variation="primary"
                        type="submit"
                        isLoading={loading}
                    >
                        Save Changes
                    </Button>
                </Flex>
            </Flex>
        </form>
    );
} 