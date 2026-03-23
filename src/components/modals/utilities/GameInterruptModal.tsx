'use client';

import { useGame } from '@/contexts/GameContext';
import { Flex, Text } from '@/components/ui';
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
        <BaseModal isOpen={isOpen} onClose={onClose} title="Active Game" size="sm">
            <Flex $direction="column" $gap="1.5rem" $padding="1.5rem">
                <Text $textAlign="center">
                    You have an active game of <strong>{gameState.activeGame?.title}</strong>. Continuing will turn off the emulator.
                </Text>

                <div className={buttons.buttonGroup} style={{ flexDirection: 'row', justifyContent: 'center' }}>
                    <button className={buttons.retroButton} onClick={onClose}>Return</button>
                    <button className={buttons.retroButton} onClick={onContinue}>Continue</button>
                </div>
            </Flex>
        </BaseModal>
    );
}
