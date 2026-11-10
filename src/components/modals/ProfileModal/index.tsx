import { useState, useRef, useEffect, useCallback, ChangeEvent } from 'react';
import Image from 'next/image';
import clsx from 'clsx';
import BaseModal from '../BaseModal';
import {
    TextField,
    TextAreaField,
    Alert
} from '@/components/ui';
import { uploadBlob, deleteBlob } from '@/utils/blobUpload';
import { defaultAvatarUrl } from '@/lib/assets';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import caseStyles from '@/components/pokemon/GymBadgeCase/styles.module.css';
import styles from './styles.module.css';
import buttons from '@/styles/buttons.module.css';
import { ProfileModel } from '@/types';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ProfileModal = ({ isOpen, onClose }: ProfileModalProps) => {
    const auth = useAuth();
    const { profile: userProfile, refreshProfile } = useProfile();
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

    const defaultAvatar = defaultAvatarUrl;

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
        // Lets the same file be picked again after removing it
        event.target.value = '';
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
            if (userProfile?.avatar && userProfile.avatar !== newAvatar) {
                deleteBlob(userProfile.avatar).catch(console.error);
            }
            setPendingAvatarFile(null);
            setIsEditing(false);
            refreshProfile();
        } catch (err) {
            setError('Failed to update profile. Please try again.');
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            ariaLabel="Profile"
            className={`${styles.modalContent} ${styles.profileModal}`}
        >
            {userProfile && (
                <div className={styles.card}>
                    <div className={styles.photoPanel}>
                        <Image
                            src={imagePreview || defaultAvatar}
                            alt={userProfile.username}
                            width={248}
                            height={248}
                            sizes="248px"
                            className={styles.photo}
                        />
                        {isEditing && (
                            <div className={styles.photoActions}>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageSelect}
                                    accept="image/*"
                                    hidden
                                    aria-label="Upload profile picture"
                                />
                                <button type="button" className={styles.photoButton} onClick={() => fileInputRef.current?.click()}>
                                    Change photo
                                </button>
                                {imagePreview && (
                                    <button type="button" className={styles.photoButton} onClick={handleRemoveImage}>
                                        Remove
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    <div className={styles.info}>
                        <div className={styles.eyebrow}>Profile</div>

                        {error && <div className={styles.error}><Alert variation="error">{error}</Alert></div>}

                        {isEditing ? (
                            <div className={styles.fields}>
                                <TextField label="Username" value={formData.username} onChange={e => handleInputChange('username', e.target.value)} placeholder="Enter username" orientation="vertical" />
                                <TextAreaField label="Bio" value={formData.bio} onChange={e => handleInputChange('bio', e.target.value)} placeholder="Tell us about yourself" rows={3} orientation="vertical" />
                            </div>
                        ) : (
                            <>
                                <h2 className={styles.name}>{userProfile.username}</h2>
                                <p className={clsx(styles.bio, !userProfile.bio && styles.bioEmpty)}>{userProfile.bio || 'No bio yet'}</p>
                            </>
                        )}

                        <dl className={`${caseStyles.felt} ${styles.idPlate}`}>
                            <div>
                                <dt>OT ID</dt>
                                <dd className={styles.trainerId}>
                                    {userProfile.appTrainerId !== undefined
                                        ? userProfile.appTrainerId.toString().padStart(5, '0')
                                        : 'Not yet assigned'}
                                </dd>
                            </div>
                            <div>
                                <dt>Email</dt>
                                <dd>{userProfile.email}</dd>
                            </div>
                        </dl>

                        <div className={styles.actions}>
                            {isEditing ? (
                                <>
                                    <button type="button" className={`${buttons.retroButton} ${styles.actionButton}`} onClick={handleEditToggle} disabled={isSaving}>Cancel</button>
                                    <button type="button" className={`${buttons.retroButton} ${styles.actionButton}`} onClick={handleSubmit} disabled={isSaving || !formData.username.trim()}>
                                        {isSaving ? 'Saving…' : 'Save'}
                                    </button>
                                </>
                            ) : (
                                <button type="button" className={`${buttons.retroButton} ${styles.actionButton}`} onClick={handleEditToggle}>Edit</button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </BaseModal>
    );
};

export default ProfileModal;
