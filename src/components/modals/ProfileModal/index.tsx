import { useState, useRef, useEffect, ChangeEvent } from 'react';
import Image from 'next/image';
import BaseModal from '../BaseModal';
import {
    Flex,
    Heading,
    Button,
    TextField,
    TextAreaField,
    Text,
    View,
    Alert
} from '@/components/ui';
import { getS3Url } from '@/utils/saveLoad';
import { uploadBlob, deleteBlob } from '@/utils/blobUpload';
import { useAuth } from '@/contexts/AuthContext';
import styles from '../styles.module.css';
import buttons from '@/styles/buttons.module.css';
import { ProfileModel } from '@/types';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    userProfile: ProfileModel;
    onUpdate?: () => void;
}

const ProfileModal = ({ isOpen, onClose, userProfile, onUpdate }: ProfileModalProps) => {
    const auth = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(userProfile?.avatar || null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [formData, setFormData] = useState<ProfileModel>({
        username: userProfile?.username || '',
        email: userProfile?.email || '',
        bio: userProfile?.bio || '',
        avatar: userProfile?.avatar || '',
        createdAt: userProfile?.createdAt || '',
        updatedAt: userProfile?.updatedAt || ''
    });

    const defaultAvatar = 'https://assets.letmedemo.com/public/gameboy/images/users/default-avatar.png';

    useEffect(() => {
        setFormData({
            username: userProfile?.username || '',
            email: userProfile?.email || '',
            bio: userProfile?.bio || '',
            avatar: userProfile?.avatar || ''
        });
    }, [userProfile]);

    useEffect(() => {
        const loadAvatarUrl = async () => {
            if (userProfile?.avatar) {
                const url = await getS3Url(userProfile.avatar);
                setImagePreview(url);
            }
        };
        loadAvatarUrl();
    }, [userProfile?.avatar]);

    const handleEditToggle = async () => {
        if (isEditing) {
            const avatarUrl = await getS3Url(userProfile?.avatar);
            setImagePreview(avatarUrl);
        }
        setIsEditing(!isEditing);
        setError(null);
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleImageSelect = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event?.target?.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { setError('Please select an image file.'); return; }
        if (file.size > 5 * 1024 * 1024) { setError('Image size should be less than 5MB.'); return; }

        try {
            setError(null);
            const userId = auth?.user?.userId;
            if (!userId) throw new Error('Not authenticated');
            const ext = file.name.split('.').pop() ?? 'jpg';
            const path = `avatars/${userId}/${Date.now()}.${ext}`;
            const url = await uploadBlob(file, path);
            setImagePreview(url);
            setFormData(prev => ({ ...prev, avatar: url }));
        } catch (err) {
            console.error('Error uploading avatar:', err);
            setError('Failed to upload image. Please try again.');
        }
    };

    const handleRemoveImage = async () => {
        try {
            if (formData.avatar) await deleteBlob(formData.avatar);
        } catch (err) {
            console.error('Error removing avatar:', err);
        }
        setFormData(prev => ({ ...prev, avatar: '' }));
        setImagePreview(null);
    };

    const handleSubmit = async () => {
        try {
            setIsSaving(true);
            setError(null);
            const res = await fetch('/api/profiles', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: formData.username,
                    bio: formData.bio,
                    avatar: formData.avatar,
                }),
            });
            if (!res.ok) throw new Error('Update failed');
            setIsEditing(false);
            onUpdate?.();
        } catch (err) {
            setError('Failed to update profile. Please try again.');
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} className={styles.profileModal}>
            <Flex $direction="column" $gap="1.5rem" $padding="1.5rem">
                <div className={buttons.buttonGroup} style={{ marginTop: '1rem', flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Heading as="h4">User Profile</Heading>
                </div>

                {error && <Alert $variation="error">{error}</Alert>}

                {userProfile && (
                    <Flex $direction="column" $gap="1.5rem">
                        <View className={styles.profileAvatarSection} $alignItems="center" $justifyContent="center">
                            <div className={styles.avatarContainer}>
                                <Image
                                    src={imagePreview || defaultAvatar}
                                    alt={userProfile.username}
                                    width={100}
                                    height={100}
                                    className={styles.profileAvatar}
                                    style={{ objectFit: "cover" }}
                                />
                                {isEditing && (
                                    <>
                                        <div className={styles.avatarOverlay}>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleImageSelect}
                                                accept="image/*"
                                                style={{ display: 'none' }}
                                                aria-label="Upload profile picture"
                                            />
                                            <Button onClick={() => fileInputRef.current?.click()} size="small" $variation="link" className={styles.uploadButton}>
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                    <polyline points="17 8 12 3 7 8" />
                                                    <line x1="12" y1="3" x2="12" y2="15" />
                                                </svg>
                                                <span>Upload New Image</span>
                                            </Button>
                                        </div>
                                        {imagePreview && (
                                            <Button onClick={handleRemoveImage} size="small" $variation="destructive" className={styles.removeButton}>
                                                Remove
                                            </Button>
                                        )}
                                    </>
                                )}
                            </div>
                        </View>

                        {isEditing ? (
                            <Flex $direction="column" $gap="1.5rem">
                                <TextField label="Username" value={formData.username} onChange={e => handleInputChange('username', e.target.value)} placeholder="Enter username" orientation="vertical" />
                                <TextField label="Email" value={formData.email} placeholder="Enter email" type="email" $isReadOnly={true} $isDisabled={true} orientation="vertical" />
                                <TextAreaField label="Bio" value={formData.bio} onChange={e => handleInputChange('bio', e.target.value)} placeholder="Tell us about yourself" rows={3} orientation="vertical" />
                                <div className={buttons.buttonGroup} style={{ marginTop: '1rem', flexDirection: 'row', gap: '1rem' }}>
                                    <button className={buttons.retroButton} onClick={handleEditToggle}>Cancel</button>
                                    <button onClick={handleSubmit} className={buttons.retroButton} disabled={isSaving}>Save Changes</button>
                                </div>
                            </Flex>
                        ) : (
                            <Flex $direction="column" $gap="1rem">
                                <View className={styles.profileDetail} $flexDirection="column" $alignItems="center">
                                    <Text $variation="secondary">Username</Text>
                                    <Text>{userProfile.username}</Text>
                                </View>
                                <View className={styles.profileDetail} $flexDirection="column" $alignItems="center">
                                    <Text $variation="secondary">Email</Text>
                                    <Text>{userProfile.email}</Text>
                                </View>
                                <View className={styles.profileDetail} $flexDirection="column" $alignItems="center">
                                    <Text $variation="secondary">Bio</Text>
                                    <Text>{userProfile.bio || 'No bio available'}</Text>
                                </View>
                                <div className={buttons.buttonGroup} style={{ marginTop: '1rem', flexDirection: 'column', gap: '1rem' }}>
                                    <button className={buttons.retroButton} onClick={handleEditToggle}>Edit</button>
                                </div>
                            </Flex>
                        )}
                    </Flex>
                )}
            </Flex>
        </BaseModal>
    );
};

export default ProfileModal;
