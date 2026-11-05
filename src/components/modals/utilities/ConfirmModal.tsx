import { ReactNode } from "react";
import BaseModal from "../BaseModal";
import { CheckboxField } from '@/components/ui';
import paper from '../paper.module.css';
import styles from './styles.module.css';

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
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            ariaLabel="Confirm"
            size="sm"
            className={`${paper.modalContent} ${paper.paperModal}`}
        >
            <h2 className={paper.modalTitle}>Confirm</h2>
            <div className={styles.body}>
                <p className={styles.message}>{children}</p>

                <CheckboxField
                    label="Don't ask me again"
                    name="skipConfirmation"
                    value="skip"
                    checked={skipConfirmation}
                    onChange={toggleSkipConfirmation}
                    alignItems="center"
                    labelPosition="end"
                />

                <div className={styles.actions}>
                    <button type="button" className={paper.secondaryButton} onClick={onClose}>Cancel</button>
                    <button type="button" className={paper.primaryButton} onClick={onConfirm}>Confirm</button>
                </div>
            </div>
        </BaseModal>
    );
}

export default ConfirmModal;
