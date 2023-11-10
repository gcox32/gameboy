import React, { useEffect, useState } from 'react';
import { Storage } from 'aws-amplify';

function LoadStateModal({ isOpen, onClose, saveStates, onConfirm }) {
	const formatDate = (dateString) => {
		const date = new Date(dateString);
		const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
		return `Last Save: ${date.toLocaleString('en-US', options)}`;
	};
	const [updatedSaveStates, setUpdatedSaveStates] = useState([]);
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

	if (!isOpen) return null;

	return (
		<div className="modal">
			<div onClick={onClose} className="modal-overlay"></div>
			<div id="load-state-content" className="modal-content">
				<button onClick={onClose} className="close-modal">&times;</button>
				<h2>Select a Save State</h2>
				<div className="save-state-list">
					{updatedSaveStates.map((state) => (
						<div className="save-state-block" key={state.id} onClick={() => onConfirm(state)}>
							{state.imageUrl && <img src={state.imageUrl} alt="Save State Screenshot" />}
							<h3 className="save-state-title">{state.title}</h3>
							<p className="last-update-text">{formatDate(state.updatedAt)}</p>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

export default LoadStateModal;
