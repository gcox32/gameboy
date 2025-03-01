import { useState } from 'react';
import {
    Button,
    Flex,
    TextField,
    TextAreaField,
    Alert,
    Heading,
    Icon,
} from '@aws-amplify/ui-react';

interface Game {
    id: string;
    title: string;
    description: string;
    series?: string;
    generation?: string;
    releaseDate?: string;
}

interface GameEditFormProps {
    game: Game;
    onSave: (gameData: Game) => void;
    onCancel: () => void;
    onDelete: (game: Game) => void;
}

export default function GameEditForm({ game, onSave, onCancel, onDelete }: GameEditFormProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        title: game.title || '',
        description: game.description || '',
        series: game.series || '',
        generation: game.generation || '',
        releaseDate: game.releaseDate || '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await onSave({
                ...game,
                ...formData,
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
                        variation="link"
                        onClick={() => onDelete(game)}
                        type="button"
                    >
                        Delete
                    </Button>
                </Flex>

                {error && <Alert variation="error">{error}</Alert>}

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