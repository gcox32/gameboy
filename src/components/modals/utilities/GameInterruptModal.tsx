'use client';

import { useGame } from '@/contexts/GameContext';
import { Flex, Button } from '@/components/ui';
import BaseModal from '../BaseModal';

interface GameInterruptModalProps {
    isOpen: boolean;
    onClose: () => void;
    onContinue: () => void;
}

export default function GameInterruptModal({ isOpen, onClose, onContinue }: GameInterruptModalProps) {
    const { gameState } = useGame();

    return (
        <BaseModal isOpen={isOpen} onClose={onClose}>
            <Flex $direction="column" $gap="1.5rem" $padding="1rem">
                <h2>Active Game Warning</h2>
                <p>You have an active game of {gameState.activeGame?.title}. Continuing will turn off the emulator.</p>
                
                <Flex $direction="row" $gap="1rem" $justifyContent="flex-end">
                    <Button 
                        $variation="destructive"
                        onClick={onClose}
                    >
                        Return
                    </Button>
                    <Button
                        $variation="primary" 
                        onClick={onContinue}
                    >
                        Continue
                    </Button>
                </Flex>
            </Flex>
        </BaseModal>
    );
} 