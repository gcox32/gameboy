import { ReactNode } from "react";
import BaseModal from "../BaseModal";
import {
    Flex,
    CheckboxField,
    Text
} from '@/components/ui';
import buttons from '@/styles/buttons.module.css';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    children: ReactNode;
    skipConfirmation: boolean;
    toggleSkipConfirmation: () => void;
}

function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    children,
    skipConfirmation,
    toggleSkipConfirmation
}: ConfirmModalProps) {
    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title="Confirm" size="sm">
            <Flex $direction="column" $gap="1.5rem" $padding="1.5rem" $alignItems="center">
                <Text $textAlign="center">{children}</Text>

                <div className={buttons.buttonGroup} style={{ flexDirection: 'row', justifyContent: 'center' }}>
                    <button className={buttons.retroButton} onClick={onClose}>Cancel</button>
                    <button className={buttons.retroButton} onClick={onConfirm}>Confirm</button>
                </div>

                <CheckboxField
                    label="Don't ask me again"
                    name="skipConfirmation"
                    value="skip"
                    checked={skipConfirmation}
                    onChange={toggleSkipConfirmation}
                    $justifyContent="center"
                    $alignItems="center"
                    $labelPosition="end"
                />
            </Flex>
        </BaseModal>
    );
}

export default ConfirmModal;
