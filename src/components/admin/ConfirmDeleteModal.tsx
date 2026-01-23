'use client';

import React from 'react';
import BaseModal from '@/components/modals/BaseModal';
import { Flex, Text } from '@/components/ui';
import styles from '@/styles/admin.module.css';

interface ConfirmDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    itemName?: string;
    loading?: boolean;
}

export default function ConfirmDeleteModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    itemName,
    loading = false
}: ConfirmDeleteModalProps) {
    return (
        <BaseModal isOpen={isOpen} onClose={onClose} className={styles.modalSmall}>
            <Flex $direction="column" $gap="1.5rem" $padding="1.5rem">
                <Flex $direction="column" $gap="0.5rem">
                    <Text $fontWeight="semibold" $fontSize="lg">{title}</Text>
                    <Text $variation="secondary">{message}</Text>
                    {itemName && (
                        <Text $fontWeight="medium" style={{
                            padding: '0.75rem',
                            background: 'var(--hover-background-color)',
                            borderRadius: '6px',
                            marginTop: '0.5rem'
                        }}>
                            {itemName}
                        </Text>
                    )}
                </Flex>

                <Flex $gap="0.75rem" $justifyContent="flex-end">
                    <button
                        className={styles.modalCancelButton}
                        onClick={onClose}
                        disabled={loading}
                        type="button"
                    >
                        Cancel
                    </button>
                    <button
                        className={styles.modalDeleteButton}
                        onClick={onConfirm}
                        disabled={loading}
                        type="button"
                    >
                        {loading ? 'Deleting...' : 'Delete'}
                    </button>
                </Flex>
            </Flex>
        </BaseModal>
    );
}
