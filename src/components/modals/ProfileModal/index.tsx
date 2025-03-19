import React, { useState, useRef, useEffect } from 'react';
import { type Schema } from '@/amplify/data/resource';
import Image from 'next/image';
import BaseModal from '../BaseModal';
import { generateClient } from 'aws-amplify/api';
import { uploadData, remove } from 'aws-amplify/storage';
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
import styles from '../styles.module.css';

const client = generateClient<Schema>();

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    userProfile: any;
    onUpdate?: () => void;
}

const ProfileModal = ({ isOpen, onClose, userProfile, onUpdate }: ProfileModalProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [imagePreview, setImagePreview] = useState<string | null>(userProfile?.avatar || null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [formData, setFormData] = useState({
        username: userProfile?.username || '',
        email: userProfile?.email || '',
        bio: userProfile?.bio || '',
        avatar: userProfile?.avatar || ''
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
        setUploadProgress(0);
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleImageSelect = async (event: any) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file.');
            return;
        }

        // Validate file size (e.g., 5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            setError('Image size should be less than 5MB.');
            return;
        }

        try {
            setError(null);
            setUploadProgress(0);

            // Upload to S3
            const fileName = `protected/${userProfile.owner}/avatar/${Date.now()}-${file.name}`;
            await uploadData({
                path: fileName,
                data: file,
                options: {
                    contentType: file.type,
                    onProgress: ({ transferredBytes, totalBytes }) => {
                        if (!totalBytes) return;
                        const progress = (transferredBytes / totalBytes) * 100;
                        setUploadProgress(progress);
                    },
                }
            }).result;

            // Get the URL for preview
            const url = await getS3Url(fileName);
            setImagePreview(url);

            // Update form data with the S3 key
            setFormData(prev => ({
                ...prev,
                avatar: fileName
            }));

        } catch (err) {
            console.error('Error uploading image:', err);
            setError('Failed to upload image. Please try again.');
            const url = await getS3Url(userProfile.avatar);
            setImagePreview(url);
        }
    };

    const handleRemoveImage = async () => {
        try {
            if (formData.avatar) {
                // Remove from S3 if it exists
                await remove({ path: formData.avatar });
            }
            setFormData(prev => ({
                ...prev,
                avatar: ''
            }));
            setImagePreview(null);
        } catch (err) {
            console.error('Error removing image:', err);
            setError('Failed to remove image. Please try again.');
        }
    };

    const handleSubmit = async () => {
        try {
            setIsSaving(true);
            setError(null);

            await client.models.Profile.update({
                id: userProfile.id,
                username: formData.username,
                email: formData.email,
                bio: formData.bio,
                avatar: formData.avatar
            });

            setIsEditing(false);
            onUpdate?.();
        } catch (err) {
            setError('Failed to update profile. Please try again.');
            console.error('Error updating profile:', err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} className={styles.profileModal}>
            <Flex $direction="column" $gap="1.5rem" $padding="1.5rem">
                <Flex $justifyContent="space-between" $alignItems="center">
                    <Heading as="h4">User Profile</Heading>
                    <Button
                        variation={isEditing ? "destructive" : "primary"}
                        onClick={handleEditToggle}
                        size="small"
                    >
                        {isEditing ? 'Cancel' : 'Edit Profile'}
                    </Button>
                </Flex>

                {error && (
                    <Alert variation="error">
                        {error}
                    </Alert>
                )}

                {userProfile && (
                    <Flex $direction="column" $gap="1.5rem">
                        <View className={styles.profileAvatarSection}>
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
                                            <Button
                                                onClick={() => fileInputRef.current?.click()}
                                                size="small"
                                                variation="link"
                                                className={styles.uploadButton}
                                            >
                                                <svg 
                                                    width="24" 
                                                    height="24" 
                                                    viewBox="0 0 24 24" 
                                                    fill="none" 
                                                    stroke="currentColor" 
                                                    strokeWidth="2"
                                                >
                                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                    <polyline points="17 8 12 3 7 8" />
                                                    <line x1="12" y1="3" x2="12" y2="15" />
                                                </svg>
                                                <span>Upload New Image</span>
                                            </Button>
                                        </div>
                                        {imagePreview && (
                                            <Button
                                                onClick={handleRemoveImage}
                                                size="small"
                                                variation="destructive"
                                                className={styles.removeButton}
                                            >
                                                Remove
                                            </Button>
                                        )}
                                    </>
                                )}
                                {uploadProgress > 0 && uploadProgress < 100 && (
                                    <div className={styles.uploadProgress}>
                                        <div
                                            className={styles.progressBar}
                                            style={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                )}
                            </div>
                        </View>

                        {isEditing ? (
                            <Flex $direction="column" $gap="1rem">
                                <TextField
                                    label="Username"
                                    value={formData.username}
                                    onChange={e => handleInputChange('username', e.target.value)}
                                    placeholder="Enter username"
                                />
                                <TextField
                                    label="Email"
                                    value={formData.email}
                                    placeholder="Enter email"
                                    type="email"
                                    isReadOnly={true}
                                    isDisabled={true}
                                />
                                <TextAreaField
                                    label="Bio"
                                    value={formData.bio}
                                    onChange={e => handleInputChange('bio', e.target.value)}
                                    placeholder="Tell us about yourself"
                                    rows={3}
                                />
                                <Button
                                    onClick={handleSubmit}
                                    $isLoading={isSaving}
                                    loadingText="Saving..."
                                    variation="primary"
                                >
                                    Save Changes
                                </Button>
                            </Flex>
                        ) : (
                            <Flex $direction="column" $gap="1rem">
                                <View className={styles.profileDetail}>
                                    <Text variation="secondary">Username</Text>
                                    <Text>{userProfile.username}</Text>
                                </View>
                                <View className={styles.profileDetail}>
                                    <Text variation="secondary">Email</Text>
                                    <Text>{userProfile.email}</Text>
                                </View>
                                <View className={styles.profileDetail}>
                                    <Text variation="secondary">Bio</Text>
                                    <Text>{userProfile.bio || 'No bio available'}</Text>
                                </View>
                            </Flex>
                        )}
                    </Flex>
                )}
            </Flex>
        </BaseModal>
    );
};

export default ProfileModal;