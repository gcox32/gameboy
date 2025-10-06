import React from 'react';
import BaseModal from '@/components/modals/BaseModal';
import { Button, Heading, Flex } from '@/components/ui';
import styles from '@/styles/admin.module.css';

interface AdminModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    onSave?: () => void;
    onCancel?: () => void;
    saveText?: string;
    cancelText?: string;
    loading?: boolean;
    size?: 'small' | 'medium' | 'large';
}

export default function AdminModal({
    isOpen,
    onClose,
    title,
    children,
    onSave,
    onCancel,
    saveText = 'Save',
    cancelText = 'Cancel',
    loading = false,
    size = 'medium'
}: AdminModalProps) {
    const handleSave = () => {
        if (onSave) {
            onSave();
        }
    };

    const handleCancel = () => {
        if (onCancel) {
            onCancel();
        }
        onClose();
    };

    const modalSizeClass = {
        small: styles.modalSmall,
        medium: styles.modalMedium,
        large: styles.modalLarge
    }[size];

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} className={`${styles.modal} ${modalSizeClass}`}>
            <Flex $direction="column" $gap="1.5rem" $padding="2rem">
                <Heading as="h3">{title}</Heading>

                <div className={styles.form}>
                    {children}
                </div>

                <Flex $justifyContent="flex-end" $gap="1rem" className={styles.formActions}>
                    <Button
                        $variation="secondary"
                        onClick={handleCancel}
                        $isDisabled={loading}
                    >
                        {cancelText}
                    </Button>
                    {onSave && (
                        <Button
                            $variation="primary"
                            onClick={handleSave}
                            $isDisabled={loading}
                        >
                            {loading ? 'Saving...' : saveText}
                        </Button>
                    )}
                </Flex>
            </Flex>
        </BaseModal>
    );
}
