import { useState } from 'react';
import { uploadData } from 'aws-amplify/storage';
import { generateClient } from 'aws-amplify/api';
import { type Schema } from '@/amplify/data/resource';
import { v4 as uuidv4 } from 'uuid';
import {
    Button,
    Flex,
    TextField,
    TextAreaField,
    Alert,
    SelectField,
} from '@aws-amplify/ui-react';

const client = generateClient<Schema>();

interface ImportGameProps {
    userId: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export default function ImportGame({ userId, onSuccess, onCancel }: ImportGameProps) {
    const [gameFile, setGameFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        series: '',
        generation: '',
        releaseDate: '',
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.name.toLowerCase().endsWith('.gbc')) {
            setGameFile(file);
            setError(null);
        } else {
            setError('Please select a valid .gbc file');
            setGameFile(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!gameFile) {
            setError('Please select a game file');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const gameId = uuidv4();
            const filePath = `protected/${userId}/games/${gameId}/${gameFile.name}`;

            // Upload game file to S3
            await uploadData({
                path: filePath,
                data: gameFile,
                options: {
                    contentType: 'application/octet-stream'
                }
            }).result;

            // Create game record in database
            await client.models.Game.create({
                id: gameId,
                owner: userId,
                filePath,
                ...formData
            });

            onSuccess();
        } catch (err) {
            console.error('Error importing game:', err);
            setError('Failed to import game. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <Flex direction="column" gap="1rem">
                {error && <Alert variation="error">{error}</Alert>}
                
                <input
                    type="file"
                    accept=".gbc, .gb"
                    onChange={handleFileChange}
                    style={{ marginBottom: '1rem' }}
                />

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
                        Import Game
                    </Button>
                </Flex>
            </Flex>
        </form>
    );
} 