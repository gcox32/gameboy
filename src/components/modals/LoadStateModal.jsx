import React, { useEffect, useState } from 'react';
import { Storage } from 'aws-amplify';
import { deleteSaveState } from '../../graphql/mutations';
import { API, graphqlOperation } from 'aws-amplify';
import ConfirmModal from './ConfirmModal';
import BaseModal from './BaseModal';

function LoadStateModal({ isOpen, onClose, saveStates, onConfirm }) {
	const [updatedSaveStates, setUpdatedSaveStates] = useState([]);
	const [showConfirmModal, setShowConfirmModal] = useState(false);
	const [selectedStateForDeletion, setSelectedStateForDeletion] = useState(null);

	const formatDate = (dateString) => {
		const date = new Date(dateString);
		const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
		return `Last Save: ${date.toLocaleString('en-US', options)}`;
	};
	useEffect(() => {
		const fetchImageUrls = async () => {
			const statesWithImages = await Promise.all(saveStates.map(async (state) => {
				if (state.img) {
					const url = await Storage.get(state.img, { level: 'private' });
					return { ...state, imageUrl: url };
				}
				return state;
			}));
			setUpdatedSaveStates(statesWithImages);
		};

		if (isOpen) {
			fetchImageUrls();
		}
	}, [isOpen, saveStates]);

	const handleDeleteClick = (saveState) => {
		setSelectedStateForDeletion(saveState);
		setShowConfirmModal(true);
	}

	const handleDeleteConfirmed = async () => {
		if (selectedStateForDeletion) {
			try {
				// Call API to delete save state from DynamoDB
				await API.graphql(graphqlOperation(deleteSaveState, { input: { id: selectedStateForDeletion.id } }));

				// Delete associated data from S3 if it exists
				console.log('deleting S3 save file...')
				await Storage.remove(selectedStateForDeletion.filePath)
				if (selectedStateForDeletion.img) {
					console.log('deleting S3 saved associated image...')
					await Storage.remove(selectedStateForDeletion.img, { level: 'private' });
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
			<div className="save-state-list">
				{updatedSaveStates.map((state) => (
					<div className="save-state-block" key={state.id} onClick={() => onConfirm(state)}>
						{state.imageUrl && <img src={state.imageUrl} alt="Save State Screenshot" />}
						<h3 className="save-state-title">{state.title}</h3>
						<p className="last-update-text">{formatDate(state.updatedAt)}</p>
						<button className="delete-btn" onClick={(e) => {
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
			>
				Are you sure you want to delete this save state?
			</ConfirmModal>
		</BaseModal>
	);
}

export default LoadStateModal;
