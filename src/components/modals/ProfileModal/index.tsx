import { useState, useRef, useEffect, useCallback, ChangeEvent } from 'react';
import Image from 'next/image';
import BaseModal from '../BaseModal';
import {
    Flex,
    Button,
    TextField,
    TextAreaField,
    Text,
    View,
    Alert
} from '@/components/ui';
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
    // A chosen avatar is only uploaded, and the old one deleted, once the profile saves
    const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
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

    const resetDraft = useCallback(() => {
        setFormData({
            username: userProfile?.username || '',
            email: userProfile?.email || '',
            bio: userProfile?.bio || '',
            avatar: userProfile?.avatar || ''
        });
        setImagePreview(userProfile?.avatar || null);
        setPendingAvatarFile(null);
        setError(null);
    }, [userProfile]);

    // Closing the modal abandons an edit, the same as Cancel
    useEffect(() => {
        resetDraft();
        if (!isOpen) setIsEditing(false);
    }, [isOpen, resetDraft]);

    useEffect(() => {
        if (!imagePreview?.startsWith('blob:')) return;
        return () => URL.revokeObjectURL(imagePreview);
    }, [imagePreview]);

    const handleEditToggle = () => {
        if (isEditing) resetDraft();
        setIsEditing(!isEditing);
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleImageSelect = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event?.target?.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { setError('Please select an image file.'); return; }
        if (file.size > 5 * 1024 * 1024) { setError('Image size should be less than 5MB.'); return; }

        setError(null);
        setPendingAvatarFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const handleRemoveImage = () => {
        setPendingAvatarFile(null);
        setFormData(prev => ({ ...prev, avatar: '' }));
        setImagePreview(null);
    };

    const uploadPendingAvatar = async (file: File) => {
        const userId = auth?.user?.userId;
        if (!userId) throw new Error('Not authenticated');
        const ext = file.name.split('.').pop() ?? 'jpg';
        return uploadBlob(file, `avatars/${userId}/${Date.now()}.${ext}`);
    };

    const handleSubmit = async () => {
        try {
            setIsSaving(true);
            setError(null);
            const newAvatar = pendingAvatarFile ? await uploadPendingAvatar(pendingAvatarFile) : formData.avatar;
            const res = await fetch('/api/profiles', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: formData.username,
                    bio: formData.bio,
                    avatar: newAvatar,
                }),
            });
            if (!res.ok) {
                if (pendingAvatarFile && newAvatar) deleteBlob(newAvatar).catch(console.error);
                throw new Error('Update failed');
            }
            if (userProfile.avatar && userProfile.avatar !== newAvatar) {
                deleteBlob(userProfile.avatar).catch(console.error);
            }
            setPendingAvatarFile(null);
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
        <BaseModal isOpen={isOpen} onClose={onClose} title="User Profile" size="sm">
            <Flex $direction="column" $gap="1.5rem" $padding="1.5rem">
                {error && <Alert variation="error">{error}</Alert>}

                {userProfile && (
                    <Flex $direction="column" $gap="1.5rem">
                        <View className={styles.profileAvatarSection} $alignItems="center" $justifyContent="center">
                            <div className={styles.avatarContainer}>
                                <Image
                                    src={imagePreview || defaultAvatar}
                                    alt={userProfile.username}
                                    width={120}
                                    height={120}
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
                                            <Button onClick={() => fileInputRef.current?.click()} size="small" variation="link" className={styles.uploadButton}>
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                    <polyline points="17 8 12 3 7 8" />
                                                    <line x1="12" y1="3" x2="12" y2="15" />
                                                </svg>
                                                <span>Upload</span>
                                            </Button>
                                        </div>
                                        {imagePreview && (
                                            <Button onClick={handleRemoveImage} size="small" variation="destructive" className={styles.removeButton}>
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
                                <TextField label="Email" value={formData.email} placeholder="Enter email" type="email" readOnly={true} disabled={true} orientation="vertical" />
                                <TextAreaField label="Bio" value={formData.bio} onChange={e => handleInputChange('bio', e.target.value)} placeholder="Tell us about yourself" rows={3} orientation="vertical" />
                                <div className={buttons.buttonGroup} style={{ flexDirection: 'row', gap: '1rem' }}>
                                    <button className={buttons.retroButton} onClick={handleEditToggle}>Cancel</button>
                                    <button onClick={handleSubmit} className={buttons.retroButton} disabled={isSaving}>Save</button>
                                </div>
                            </Flex>
                        ) : (
                            <Flex $direction="column" $gap="1rem">
                                <View className={styles.profileDetail} $flexDirection="column" $alignItems="center">
                                    <Text variation="secondary">Username</Text>
                                    <Text>{userProfile.username}</Text>
                                </View>
                                <View className={styles.profileDetail} $flexDirection="column" $alignItems="center">
                                    <Text variation="secondary">Email</Text>
                                    <Text>{userProfile.email}</Text>
                                </View>
                                <View className={styles.profileDetail} $flexDirection="column" $alignItems="center">
                                    <Text variation="secondary">Bio</Text>
                                    <Text>{userProfile.bio || 'No bio yet'}</Text>
                                </View>
                                <View className={styles.profileDetail} $flexDirection="column" $alignItems="center">
                                    <Text variation="secondary">OT ID</Text>
                                    <Text>{userProfile.appTrainerId !== undefined ? userProfile.appTrainerId : 'Not yet assigned'}</Text>
                                </View>
                                <div className={buttons.buttonGroup}>
                                    <button className={buttons.retroButton} onClick={handleEditToggle}>Edit Profile</button>
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
