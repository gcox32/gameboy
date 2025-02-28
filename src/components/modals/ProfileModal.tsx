import React, { useState, useRef } from 'react';
import { type Schema } from '@/amplify/data/resource';
import Image from 'next/image';
import BaseModal from './BaseModal';
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
} from '@aws-amplify/ui-react';

const client = generateClient<Schema>();

const ProfileModal = ({ isOpen, onClose, userProfile }: { isOpen: boolean, onClose: () => void, userProfile: any }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [imagePreview, setImagePreview] = useState(userProfile?.avatar || null);
    const fileInputRef = useRef(null);
    const [formData, setFormData] = useState({
        username: userProfile?.username || '',
        email: userProfile?.email || '',
        bio: userProfile?.bio || '',
        avatar: userProfile?.avatar || ''
    });

    const handleEditToggle = () => {
        if (isEditing) {
            // Reset form data if canceling edit
            setFormData({
                username: userProfile?.username || '',
                email: userProfile?.email || '',
                bio: userProfile?.bio || '',
                avatar: userProfile?.avatar || ''
            });
            setImagePreview(userProfile?.avatar || null);
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

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);

        try {
            setError(null);
            setUploadProgress(0);

            // Upload to S3
            const fileName = `avatars/${userProfile.id}/${Date.now()}-${file.name}`;
            const result = await uploadData({
                key: fileName,
                data: file,
                options: {
                    contentType: file.type,
                    onProgress: ({ transferredBytes, totalBytes }) => {
                        const progress = (transferredBytes / totalBytes) * 100;
                        setUploadProgress(progress);
                    },
                }
            }).result;

            // Update form data with the new S3 URL
            const avatarUrl = result.key; // You might need to construct the full URL depending on your setup
            setFormData(prev => ({
                ...prev,
                avatar: avatarUrl
            }));
            
        } catch (err) {
            console.error('Error uploading image:', err);
            setError('Failed to upload image. Please try again.');
            setImagePreview(userProfile?.avatar || null);
        }
    };

    const handleRemoveImage = async () => {
        try {
            if (formData.avatar) {
                // Remove from S3 if it exists
                await remove({ key: formData.avatar });
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
            // You might want to refresh the user profile data here
        } catch (err) {
            setError('Failed to update profile. Please try again.');
            console.error('Error updating profile:', err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} className="profile-modal">
            <Flex direction="column" gap="1.5rem" padding="1.5rem">
                <Flex justifyContent="space-between" alignItems="center">
                    <Heading level={4}>User Profile</Heading>
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
                    <Flex direction="column" gap="1.5rem">
                        <View className="profile-avatar-section">
                            <div className="avatar-container">
                                {imagePreview || userProfile.avatar ? (
                                    <Image
                                        src={imagePreview || userProfile.avatar}
                                        alt={userProfile.username}
                                        fill
                                        className="profile-avatar"
                                        sx={{ objectFit: "contain"}}
                                    />
                                ) : (
                                    <div className="avatar-placeholder-modal large">
                                        {userProfile.username.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                {isEditing && (
                                    <div className="avatar-controls">
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleImageSelect}
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                        />
                                        <Button
                                            onClick={() => fileInputRef.current?.click()}
                                            size="small"
                                            variation="primary"
                                        >
                                            Upload
                                        </Button>
                                        {imagePreview && (
                                            <Button
                                                onClick={handleRemoveImage}
                                                size="small"
                                                variation="destructive"
                                            >
                                                Remove
                                            </Button>
                                        )}
                                    </div>
                                )}
                                {uploadProgress > 0 && uploadProgress < 100 && (
                                    <div className="upload-progress">
                                        <div 
                                            className="progress-bar"
                                            style={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                )}
                            </div>
                        </View>

                        {isEditing ? (
                            <Flex direction="column" gap="1rem">
                                <TextField
                                    label="Username"
                                    value={formData.username}
                                    onChange={e => handleInputChange('username', e.target.value)}
                                    placeholder="Enter username"
                                />
                                <TextField
                                    label="Email"
                                    value={formData.email}
                                    onChange={e => handleInputChange('email', e.target.value)}
                                    placeholder="Enter email"
                                    type="email"
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
                                    isLoading={isSaving}
                                    loadingText="Saving..."
                                    variation="primary"
                                >
                                    Save Changes
                                </Button>
                            </Flex>
                        ) : (
                            <Flex direction="column" gap="1rem">
                                <View className="profile-detail">
                                    <Text variation="secondary">Username</Text>
                                    <Text>{userProfile.username}</Text>
                                </View>
                                <View className="profile-detail">
                                    <Text variation="secondary">Email</Text>
                                    <Text>{userProfile.email}</Text>
                                </View>
                                <View className="profile-detail">
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