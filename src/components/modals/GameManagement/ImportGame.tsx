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
    View,
    Text
} from '@/components/ui';
import { ImageUpload } from '@/components/common/ImageUpload';
import FileUploadZone from '@/components/common/FileUploadZone';

const client = generateClient<Schema>();

interface ImportGameProps {
    userId: string | undefined;
    onSuccess: () => void;
    onCancel: () => void;
}

export default function ImportGame({ userId, onSuccess, onCancel }: ImportGameProps) {
    const [gameFile, setGameFile] = useState<File | null>(null);
    const [imageFile, setImageFile] = useState<File | string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        img: '',
        memoryWatchers: {
            activeParty: {
                baseAddress: '0xD163',
                offset: '0x00',
                size: '0x195'
            },
            gymBadges: {
                baseAddress: '0xD2F6',
                offset: '0x60',
                size: '0x1'
            },
            location: {
                baseAddress: '0xD2F6',
                offset: '0x68',
                size: '0x1'
            }
        }
    });

    const presetImages = [
        {
            id: 'green',
            url: 'https://assets.letmedemo.com/public/gameboy/images/cover-art/cover-art-green.jpg',
            label: 'Green'
        },
        {
            id: 'red',
            url: 'https://assets.letmedemo.com/public/gameboy/images/cover-art/cover-art-red.jpg',
            label: 'Red'
        },
        {
            id: 'blue',
            url: 'https://assets.letmedemo.com/public/gameboy/images/cover-art/cover-art-blue.jpg',
            label: 'Blue'
        },
        {
            id: 'yellow',
            url: 'https://assets.letmedemo.com/public/gameboy/images/cover-art/cover-art-yellow.jpg',
            label: 'Yellow'
        }
    ];

    const handleGameFileChange = (file: File) => {
        if (file && (file.name.toLowerCase().endsWith('.gbc') || file.name.toLowerCase().endsWith('.gb'))) {
            setGameFile(file);
            setError(null);

            // Auto-fill title from filename if empty
            if (!formData.title) {
                const title = file.name.split('.').slice(0, -1).join('.');
                setFormData(prev => ({ ...prev, title }));
            }
        } else {
            setError('Please select a valid .gb or .gbc file');
            setGameFile(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!gameFile) {
            setError('Please select a game file');
            return;
        }
        if (!formData.title.trim()) {
            setError('Please enter a title');
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
                    contentType: 'application/octet-stream',
                    onProgress: ({ transferredBytes, totalBytes }) => {
                        const progress = (transferredBytes / (totalBytes || 1)) * 100;
                        setUploadProgress(progress);
                    }
                }
            }).result;

            // Handle image upload if provided
            let imagePath = '';
            if (imageFile) {
                if (typeof imageFile === 'string') {
                    imagePath = imageFile;
                } else {
                    const fileType = imageFile.name.split('.').pop();
                    imagePath = `protected/${userId}/games/${gameId}/cover.${fileType}`;
                    
                    await uploadData({
                        path: imagePath,
                        data: imageFile,
                        options: {
                            contentType: imageFile.type
                        }
                    }).result;
                }
            }

            // Create game record in database
            await client.models.Game.create({
                id: gameId,
                owner: userId,
                title: formData.title,
                filePath: filePath,
                img: imagePath,
                metadata: JSON.stringify({
                    description: formData.description,
                    series: '',
                    generation: '',
                    releaseDate: '',
                    memoryWatchers: formData.memoryWatchers
                })
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
            <Flex $direction="column" $gap="1rem">
                {error && <Alert $variation="error">{error}</Alert>}

                <View $flexDirection="column" $alignItems="center">
                    <Text>Game ROM File</Text>
                    <FileUploadZone
                        onFileSelect={handleGameFileChange}
                        accept=".gb,.gbc"
                        error={error}
                    />
                </View>

                <ImageUpload
                    onChange={setImageFile}
                    label="Game Cover Image (Optional)"
                    presetImages={presetImages}
                />

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

                {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="upload-progress">
                        <div
                            className="progress-bar"
                            style={{ width: `${uploadProgress}%` }}
                        />
                    </div>
                )}

                <Flex $direction="row" $gap="1rem" $justifyContent="flex-end">
                    <Button
                        $variation="destructive"
                        onClick={onCancel}
                        type="button"
                    >
                        Cancel
                    </Button>
                    <Button
                        $variation="primary"
                        type="submit"
                        $isLoading={loading}
                    >
                        Import Game
                    </Button>
                </Flex>
            </Flex>
        </form>
    );
} 