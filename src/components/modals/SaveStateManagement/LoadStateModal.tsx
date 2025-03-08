import React, { useEffect, useState } from 'react';
import { downloadData, remove } from 'aws-amplify/storage';
import { generateClient } from 'aws-amplify/api';
import { type Schema } from '@/amplify/data/resource';
import ConfirmModal from '../utilities/ConfirmModal';
import BaseModal from '../BaseModal';
import { assetsEndpoint, assetsEndpointPublic } from '../../../../config';
import styles from '../styles.module.css';

interface SaveState {
    id: string;
    title: string;
    filePath: string;
    img?: string;
    imageUrl?: string;
    createdAt: string;
    updatedAt: string;
}

interface LoadStateModalProps {
    isOpen: boolean;
    onClose: () => void;
    saveStates: any[];
    onConfirm: (saveState: any) => void;
    userId: string;
}

const saveStateImageStyle = {
	width: "220px",
	height: "auto",
	borderRadius: "16px"
}

function LoadStateModal({ isOpen, onClose, saveStates, onConfirm, userId }: LoadStateModalProps) {
	const [updatedSaveStates, setUpdatedSaveStates] = useState<SaveState[]>([]);
	const [showConfirmModal, setShowConfirmModal] = useState(false);
	const [selectedStateForDeletion, setSelectedStateForDeletion] = useState<SaveState | null>(null);

	const formatDate = (dateString: string, update = true) => {
		const date = new Date(dateString);
		const options: Intl.DateTimeFormatOptions = {
			year: 'numeric' as const,
			month: 'short' as const,
			day: 'numeric' as const,
			hour: '2-digit' as const,
			minute: '2-digit' as const
		};
		return `${update ? 'Last Saved' : 'Created'}: ${date.toLocaleString('en-US', options)}`;
	};
	useEffect(() => {
		const fetchImageUrls = async () => {
			try {
				const statesWithImages = await Promise.all(saveStates.map(async (state) => {
					if (state.img) {
						try {
							const path = state.img;
							const result = downloadData({ path: path });
							const eTag = await result.result; // Ensure the correct way to access the result
							const imgPath = `${assetsEndpoint}${eTag.path}`;

							return { ...state, imageUrl: imgPath };
						} catch (error) {
							console.error(`Error downloading image for state ${state.img}:`, error);
							return state; // Return state without imageUrl if download fails
						}
					}
					return state;
				}));
				setUpdatedSaveStates(statesWithImages);
			} catch (error) {
				console.error('Error fetching image URLs:', error);
			}
		};
	
		if (isOpen) {
			fetchImageUrls();
		}
	}, [isOpen, saveStates]);
	
	const handleDeleteClick = (saveState: any) => {
		setSelectedStateForDeletion(saveState);
		setShowConfirmModal(true);
	}
	const handleDeleteConfirmed = async () => {
		if (selectedStateForDeletion) {
			const client = generateClient<Schema>();
			try {
				// Call API to delete save state from DynamoDB
				console.log('deleting DynamoDB save state...')
				await client.models.SaveState.delete({ id: selectedStateForDeletion.id });

				// Delete associated data from S3 if it exists
				console.log('deleting S3 save file...')
				await remove({ path: selectedStateForDeletion.filePath })
				if (selectedStateForDeletion.img) {
					console.log('deleting S3 saved associated image...')
					await remove({ path: selectedStateForDeletion.img });
				}

				// Update local state to reflect the deletion
				const updatedStates = updatedSaveStates.filter(state => state.id !== selectedStateForDeletion.id);
				setUpdatedSaveStates(updatedStates);
				setShowConfirmModal(false);
			} catch (error) {
				console.error('Error deleting save state:', error);
			}
		}
	};

	if (!isOpen) return null;

	return (
		<BaseModal isOpen={isOpen} onClose={onClose}>
			<h2>Select a Save State</h2>
			<div className={styles.saveStateList}>
				{updatedSaveStates.map((state) => (
					<div className={styles.saveStateBlock} key={state.id} onClick={() => onConfirm(state)}>
						{!state.imageUrl && <img src={`${assetsEndpointPublic}util/beta-sprite.png`} style={saveStateImageStyle} />}
						{state.imageUrl && <img src={state.imageUrl} alt={state.title} loading="lazy" style={saveStateImageStyle} />}
						<h3 className={styles.saveStateTitle}>{state.title}</h3>
						<p className={styles.lastUpdateText}>{formatDate(state.createdAt, false)}</p>
						<p className={styles.lastUpdateText}>{formatDate(state.updatedAt)}</p>
						<button className={styles.deleteBtn} onClick={(e) => {
							e.stopPropagation();
							handleDeleteClick(state);
						}}>Delete</button>
					</div>
				))}
			</div>
			<ConfirmModal
				isOpen={showConfirmModal}
				onClose={() => setShowConfirmModal(false)}
				onConfirm={handleDeleteConfirmed}
				skipConfirmation={false}
				toggleSkipConfirmation={() => {}}
			>
				Are you sure you want to delete this save state?
			</ConfirmModal>
		</BaseModal>
	);
}

export default LoadStateModal;
