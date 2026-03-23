import { useEffect, useState } from 'react';
import Image from 'next/image';
import ConfirmModal from '../utilities/ConfirmModal';
import BaseModal from '../BaseModal';
import { assetsEndpointPublic } from '@/../config';
import styles from '../styles.module.css';
import { getS3Url } from '@/utils/saveLoad';
import { deleteBlob } from '@/utils/blobUpload';
import buttons from '@/styles/buttons.module.css';
import { SaveStateModel } from '@/types';

interface LoadStateModalProps {
	isOpen: boolean;
	onClose: () => void;
	saveStates: SaveStateModel[];
	onConfirm: (saveState: SaveStateModel) => void;
	onDelete: () => void;
}

const saveStateImageStyle = {
	width: "220px",
	height: "auto",
	borderRadius: "16px",
	border: "2px solid black"
}

function LoadStateModal({ isOpen, onClose, saveStates, onConfirm, onDelete }: LoadStateModalProps) {
	const [updatedSaveStates, setUpdatedSaveStates] = useState<SaveStateModel[]>([]);
	const [showConfirmModal, setShowConfirmModal] = useState(false);
	const [selectedStateForDeletion, setSelectedStateForDeletion] = useState<SaveStateModel | null>(null);

	const formatDate = (dateString: string, update = true) => {
		const date = new Date(dateString);
		const options: Intl.DateTimeFormatOptions = {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		};
		return `${update ? 'Last Saved' : 'Created'}: ${date.toLocaleString('en-US', options)}`;
	};

	useEffect(() => {
		const fetchImageUrls = async () => {
			try {
				const statesWithImages = await Promise.all(saveStates.map(async (state) => {
					if (state.img) {
						try {
							const imgPreview = await getS3Url(state.img);
							return { ...state, img: imgPreview };
						} catch {
							return state;
						}
					}
					return state;
				}));
				setUpdatedSaveStates(statesWithImages);
			} catch (error) {
				console.error('Error fetching image URLs:', error);
			}
		};

		if (isOpen) fetchImageUrls();
	}, [isOpen, saveStates]);

	const handleDeleteClick = (saveState: SaveStateModel) => {
		setSelectedStateForDeletion(saveState);
		setShowConfirmModal(true);
	};

	const handleDeleteConfirmed = async () => {
		if (!selectedStateForDeletion) return;
		try {
			await fetch(`/api/save-states/${selectedStateForDeletion.id}`, { method: 'DELETE' });
			await Promise.allSettled([
				deleteBlob(selectedStateForDeletion.filePath),
				deleteBlob(selectedStateForDeletion.img ?? ''),
			]);
			setUpdatedSaveStates(prev => prev.filter(s => s.id !== selectedStateForDeletion.id));
			setShowConfirmModal(false);
			onDelete();
		} catch (error) {
			console.error('Error deleting save state:', error);
		}
	};

	if (!isOpen) return null;

	return (
		<BaseModal isOpen={isOpen} onClose={onClose} title="Load Save State" size="lg">

			<div className={styles.saveStateList}>
				{updatedSaveStates.map((state) => (
					<div className={styles.saveStateBlock} key={state.id} onClick={() => onConfirm(state)}>
						{!state.img
							? <Image src={`${assetsEndpointPublic}util/beta-sprite.png`} alt="Beta Sprite" width={220} height={220} style={saveStateImageStyle} />
							: <Image src={state.img} alt={state.title || ''} loading="lazy" width={220} height={220} style={saveStateImageStyle} />
						}
						<h3 className={styles.saveStateTitle}>{state.title}</h3>
						<p className={styles.lastUpdateText}>{state.createdAt ? formatDate(state.createdAt, false) : ''}</p>
						<p className={styles.lastUpdateText}>{state.updatedAt ? formatDate(state.updatedAt) : ''}</p>
						<div className={buttons.buttonGroup}>
							<button className={buttons.retroButton} onClick={(e) => {
								e.stopPropagation();
								handleDeleteClick(state);
							}}>Delete</button>
						</div>
					</div>
				))}
			</div>
			<ConfirmModal
				isOpen={showConfirmModal}
				onClose={() => setShowConfirmModal(false)}
				onConfirm={handleDeleteConfirmed}
				skipConfirmation={false}
				toggleSkipConfirmation={() => { }}
			>
				Are you sure you want to delete this save state?
			</ConfirmModal>
		</BaseModal>
	);
}

export default LoadStateModal;
