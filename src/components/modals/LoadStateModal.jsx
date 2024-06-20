import React, { useEffect, useState } from 'react';
import { downloadData, remove } from 'aws-amplify/storage';
import { deleteSaveState } from '../../graphql/mutations';
import { generateClient } from 'aws-amplify/api';
import ConfirmModal from './ConfirmModal';
import BaseModal from './BaseModal';
import { assetsEndpoint, assetsEndpointPublic, userPoolRegion } from '../../../config';

function LoadStateModal({ isOpen, onClose, saveStates, onConfirm, userId }) {
	const [updatedSaveStates, setUpdatedSaveStates] = useState([]);
	const [showConfirmModal, setShowConfirmModal] = useState(false);
	const [selectedStateForDeletion, setSelectedStateForDeletion] = useState(null);

	const formatDate = (dateString, update=true) => {
		const date = new Date(dateString);
		const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
		return `${update ? 'Last Saved':'Created'}: ${date.toLocaleString('en-US', options)}`;
	};
	useEffect(() => {
		const fetchImageUrls = async () => {
			try {
				const statesWithImages = await Promise.all(saveStates.map(async (state) => {
					if (state.img) {
						try {
							const path = `private/${userPoolRegion}:${userId}/${state.img}`;
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
	

	const handleDeleteClick = (saveState) => {
		setSelectedStateForDeletion(saveState);
		setShowConfirmModal(true);
	}
	const handleDeleteConfirmed = async () => {
		if (selectedStateForDeletion) {
			const client = generateClient();
			try {
				// Call API to delete save state from DynamoDB
				await client.graphql({ query: deleteSaveState, variables: { input: { id: selectedStateForDeletion.id } }});

				// Delete associated data from S3 if it exists
				console.log('deleting S3 save file...')
				await remove(selectedStateForDeletion.filePath)
				if (selectedStateForDeletion.img) {
					console.log('deleting S3 saved associated image...')
					await remove(selectedStateForDeletion.img, { level: 'private' });
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
						{!state.imageUrl && <img src={`${assetsEndpointPublic}util/loading-gif.gif`} />}
						{state.imageUrl && <img src={state.imageUrl} alt={state.title} loading="lazy" />}
						<h3 className="save-state-title">{state.title}</h3>
						<p className="last-update-text">{formatDate(state.createdAt, false)}</p>
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
