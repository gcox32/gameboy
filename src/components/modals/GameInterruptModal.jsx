'use client';

import { useGame } from '@/contexts/GameContext';
import { useRouter } from 'next/navigation';
import { Button, Flex } from '@aws-amplify/ui-react';
import BaseModal from './BaseModal';

export default function GameInterruptModal({ isOpen, onClose, onContinue }) {
    const { gameState } = useGame();
    const router = useRouter();

    return (
        <BaseModal isOpen={isOpen} onClose={onClose}>
            <Flex direction="column" gap="1.5rem" padding="1rem">
                <h2>Active Game Warning</h2>
                <p>You have an active game of {gameState.activeGame?.title}. Continuing will turn off the emulator.</p>
                
                <Flex direction="row" gap="1rem" justifyContent="flex-end">
                    <Button 
                        variation="destructive"
                        onClick={onClose}
                    >
                        Return
                    </Button>
                    <Button
                        variation="primary" 
                        onClick={onContinue}
                    >
                        Continue
                    </Button>
                </Flex>
            </Flex>
        </BaseModal>
    );
} 