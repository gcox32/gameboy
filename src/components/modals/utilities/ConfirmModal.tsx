import React from "react";
import BaseModal from "../BaseModal";
import {
    Flex,
    CheckboxField,
    Heading
} from '@/components/ui';
import buttons from '@/styles/buttons.module.css';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    children: React.ReactNode;
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
        <BaseModal isOpen={isOpen} onClose={onClose}>
            <Flex
                $direction="column"
                $gap="1.5rem"
                $padding="1.5rem"
                $alignItems="center"
            >
                <Heading 
                    as="h4"
                    $textAlign="center"
                >
                    {children}
                </Heading>

                <div className={buttons.buttonGroup} style={{ marginTop: '1rem', flexDirection: 'row', justifyContent: 'flex-end' }}>
                    <button
                        className={buttons.warningButton}
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        className={buttons.primaryButton}
                        onClick={onConfirm}
                    >
                        Confirm
                    </button>
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
