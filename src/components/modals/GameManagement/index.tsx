import { useState } from 'react';
import BaseModal from '../BaseModal';
import {
    Button,
    Flex,
    Heading,
    Alert
} from '@aws-amplify/ui-react';
import styles from './styles.module.css';

interface GameManagementProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function GameManagement({ isOpen, onClose }: GameManagementProps) {
    const [error, setError] = useState<string | null>(null);

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} className={styles.modal}>
            <Flex direction="column" gap="1.5rem" padding="1.5rem">
                <Flex justifyContent="space-between" alignItems="center">
                    <Heading level={4}>Game Management</Heading>
                </Flex>

                {error && (
                    <Alert variation="error">
                        {error}
                    </Alert>
                )}

                <Flex direction="column" gap="1rem">
                    {/* Game list and management controls will go here */}
                </Flex>
            </Flex>
        </BaseModal>
    );
}