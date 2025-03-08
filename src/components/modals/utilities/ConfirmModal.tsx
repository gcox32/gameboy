import React from "react";
import BaseModal from "../BaseModal";
import {
    Flex,
    Button,
    CheckboxField,
    Heading
} from '@aws-amplify/ui-react';

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
                direction="column"
                gap="1.5rem"
                padding="1.5rem"
                alignItems="center"
            >
                <Heading 
                    level={4}
                    textAlign="center"
                >
                    {children}
                </Heading>

                <Flex
                    direction="row"
                    gap="1rem"
                    justifyContent="center"
                >
                    <Button
                        variation="destructive"
                        onClick={onClose}
                        size="large"
                    >
                        Cancel
                    </Button>
                    <Button
                        variation="primary"
                        onClick={onConfirm}
                        size="large"
                    >
                        Confirm
                    </Button>
                </Flex>

                <CheckboxField
                    label="Don't ask me again"
                    name="skipConfirmation"
                    value="skip"
                    checked={skipConfirmation}
                    onChange={toggleSkipConfirmation}
                    justifyContent="center"
                    alignItems="center"
                    labelPosition="end"
                />
            </Flex>
        </BaseModal>
    );
}

export default ConfirmModal;
