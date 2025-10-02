'use client';

import { useGame } from '@/contexts/GameContext';
import { Flex, Button } from '@/components/ui';
import BaseModal from '../BaseModal';
import buttons from '@/styles/buttons.module.css';

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
                
                <div className={buttons.buttonGroup} style={{ marginTop: '1rem', flexDirection: 'row', justifyContent: 'center' }}>
                    <button 
                        className={buttons.warningButton}
                        onClick={onClose}
                    >
                        Return
                    </button>
                    <button
                        className={buttons.primaryButton} 
                        onClick={onContinue}
                    >
                        Continue
                    </button>
                </div>
            </Flex>
        </BaseModal>
    );
} 