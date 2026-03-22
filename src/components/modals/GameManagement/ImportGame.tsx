import { useState, FormEvent } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
    Flex,
    TextField,
    TextAreaField,
    Alert,
    View,
    Text
} from '@/components/ui';
import { ImageUpload } from '@/components/common/ImageUpload';
import FileUploadZone from '@/components/common/FileUploadZone';
import { uploadBlob } from '@/utils/blobUpload';
import buttons from '@/styles/buttons.module.css';

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
        memoryWatchers: {
            activeParty: { baseAddress: '0xD163', offset: '0x00', size: '0x195' },
            gymBadges: { baseAddress: '0xD2F6', offset: '0x60', size: '0x1' },
            location: { baseAddress: '0xD2F6', offset: '0x68', size: '0x1' }
        }
    });

    const presetImages = [
        { id: 'green', url: 'https://assets.letmedemo.com/public/gameboy/images/cover-art/cover-art-green.jpg', label: 'Green' },
        { id: 'red', url: 'https://assets.letmedemo.com/public/gameboy/images/cover-art/cover-art-red.jpg', label: 'Red' },
        { id: 'blue', url: 'https://assets.letmedemo.com/public/gameboy/images/cover-art/cover-art-blue.jpg', label: 'Blue' },
        { id: 'yellow', url: 'https://assets.letmedemo.com/public/gameboy/images/cover-art/cover-art-yellow.jpg', label: 'Yellow' },
    ];

    const handleGameFileChange = (file: File) => {
        if (file && (file.name.toLowerCase().endsWith('.gbc') || file.name.toLowerCase().endsWith('.gb'))) {
            setGameFile(file);
            setError(null);
            if (!formData.title) {
                setFormData(prev => ({ ...prev, title: file.name.split('.').slice(0, -1).join('.') }));
            }
        } else {
            setError('Please select a valid .gb or .gbc file');
            setGameFile(null);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!gameFile) { setError('Please select a game file'); return; }
        if (!formData.title.trim()) { setError('Please enter a title'); return; }
        if (!userId) { setError('Not authenticated'); return; }

        setLoading(true);
        setError(null);
        setUploadProgress(0);

        try {
            const gameId = uuidv4();

            // Upload ROM file
            setUploadProgress(10);
            const romPath = `games/${userId}/${gameId}/${gameFile.name}`;
            const filePath = await uploadBlob(gameFile, romPath);
            setUploadProgress(60);

            // Upload cover image if provided
            let imgPath = '';
            if (imageFile) {
                if (typeof imageFile === 'string') {
                    // Preset URL — store directly
                    imgPath = imageFile;
                } else {
                    const ext = imageFile.name.split('.').pop() ?? 'jpg';
                    const coverPath = `games/${userId}/${gameId}/cover.${ext}`;
                    imgPath = await uploadBlob(imageFile, coverPath);
                }
            }
            setUploadProgress(90);

            // Create game record
            const res = await fetch('/api/games', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: formData.title,
                    filePath,
                    img: imgPath,
                    metadata: {
                        description: formData.description,
                        memoryWatchers: formData.memoryWatchers,
                    },
                }),
            });
            if (!res.ok) throw new Error('Failed to save game record');

            setUploadProgress(100);
            onSuccess();
        } catch (err) {
            console.error('Error importing game:', err);
            setError((err as Error).message || 'Failed to import game. Please try again.');
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
                    <FileUploadZone onFileSelect={handleGameFileChange} accept=".gb,.gbc" error={error} />
                </View>

                <ImageUpload onChange={setImageFile} label="Game Cover Image (Optional)" presetImages={presetImages} />

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
                        <div className="progress-bar" style={{ width: `${uploadProgress}%` }} />
                    </div>
                )}

                <div className={buttons.buttonGroup} style={{ marginTop: '1rem', flexDirection: 'row', justifyContent: 'center' }}>
                    <button className={buttons.retroButton} onClick={onCancel} type="button">Cancel</button>
                    <button className={buttons.retroButton} type="submit" disabled={loading}>
                        {loading ? 'Importing…' : 'Import Game'}
                    </button>
                </div>
            </Flex>
        </form>
    );
}
