import React from 'react';
import Image from 'next/image';
import BaseModal from './BaseModal';

const ProfileModal = ({ isOpen, onClose, userProfile }) => {
    return (
        <BaseModal isOpen={isOpen} onClose={onClose} className="profile-modal">
            <div className="profile-modal-content">
                <h2>User Profile</h2>
                {userProfile && (
                    <>
                        <div className="profile-avatar-modal">
                            {userProfile.avatar ? (
                                <Image
                                    src={userProfile.avatar}
                                    alt={userProfile.username}
                                    width={100}
                                    height={100}
                                    className="avatar"
                                />
                            ) : (
                                <div className="avatar-placeholder-modal large">
                                    {userProfile.username.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div className="profile-details">
                            <p><strong>Username:</strong> {userProfile.username}</p>
                            <p><strong>Email:</strong> {userProfile.email}</p>
                            <p><strong>Bio:</strong> {userProfile.bio || 'No bio available'}</p>
                        </div>
                    </>
                )}
            </div>
        </BaseModal>
    );
};

export default ProfileModal;