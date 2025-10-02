import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { remove } from 'aws-amplify/storage';
import { generateClient } from 'aws-amplify/api';
import { type Schema } from '@/amplify/data/resource';
import ConfirmModal from '../utilities/ConfirmModal';
import BaseModal from '../BaseModal';
import { assetsEndpointPublic } from '@/../config';
import styles from '../styles.module.css';
import { getS3Url } from '@/utils/saveLoad';
import buttons from '@/styles/buttons.module.css';

interface SaveState {
	id: string;
	title: string;
	filePath: string;
	img?: string;
	createdAt: string;
	updatedAt: string;
	imgPreview?: string;
}

interface LoadStateModalProps {
	isOpen: boolean;
	onClose: () => void;
	saveStates: any[];
	onConfirm: (saveState: any) => void;
	onDelete: () => void;
}

const saveStateImageStyle = {
	width: "220px",
	height: "auto",
	borderRadius: "16px",
	border: "2px solid black"
}

function LoadStateModal({ isOpen, onClose, saveStates, onConfirm, onDelete }: LoadStateModalProps) {
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
							const key = state.img;
							const imgPreview = await getS3Url(key);
							return { ...state, imgPreview };
						} catch (error) {
							console.error(`Error downloading image for state ${state.img}:`, error);
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
				onDelete();
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
						{!state.imgPreview ?
							<Image src={`${assetsEndpointPublic}util/beta-sprite.png`} alt="Beta Sprite" width={220} height={220} style={saveStateImageStyle} />
							:
							<Image src={`${state.imgPreview}`} alt={state.title} loading="lazy" width={220} height={220} style={saveStateImageStyle} />
						}
						<h3 className={styles.saveStateTitle}>{state.title}</h3>
						<p className={styles.lastUpdateText}>{formatDate(state.createdAt, false)}</p>
						<p className={styles.lastUpdateText}>{formatDate(state.updatedAt)}</p>
						<div className={buttons.buttonGroup}>
							<button className={buttons.warningButton} onClick={(e) => {
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

'https://amplify-d3v4lw8yiqlumm-ma-jsgbcstoragebucket744c69-qqv34i54rxtv.s3.us-east-1.amazonaws.com/private/9438f4d8-9061-70ee-be62-dedecec6e7de/games/0395c833-075f-4217-a376-227e375845c3/saveStates/0f27da68-b183-487e-93c2-b91c4673ed27/screenshot.png?x-amz-content-sha256=e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=ASIA2LSIZQLLA4XR5QXB%2F20250310%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20250310T094203Z&X-Amz-SignedHeaders=host&X-Amz-Expires=900&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEEIaCXVzLWVhc3QtMSJHMEUCIDRfOFL7%2FoITpkhBK%2FbyE5tTsXootcA3QhR9qyYduIZmAiEA77opLgddInJ%2FWaC%2Bo43lQcxUo%2FEXlok2%2FLl0Ef9q6QQqzQQIi%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARADGgw3MTIwNDM0OTYxNTAiDBWs4gMAG0NB8U%2FRAiqhBBUuYREL8j4Gdx8U1mt0YPpjAkHul4oFB3NKSorSNM9Qx6ged4ikE94LnvhRBTpz9FQKgbfvLh5Rj3fju6I9qiXaGd5zTfmjNckzwy534IyopLQzwhQnFZHPi1Mn8jzMjdGUEQXkukM2f3Nl9NOCco%2FMmj4fUa96HBSYBxcsOI67NHXS86ET0gyccf9gB%2FtRhtlBXmn2vTKFl6abJFTmiMGp65tVza6uOJ2wPocu%2BXL1MswNi8tED0Y1VRMSG6OIlJlIYXV0ABn3aLIunHugypX1R0a7Gwm7Au7zTy6m0qYHlCI447VahymL%2FwuNpLJ5p6ZUpWQ2tcaU5rCgsDlnpPhriwrN%2F8g4idvQSVWZZGFwuXd44PL1teQtNM1SNoxOEuE9ICWyQSvE%2FWxa6RBrFeSEbjvOhIXeX6HKh6nO7g5uwHMZAsfTP2Rydxr9NbZz1q%2BZUdcrU2kBlclyqrFj1tQSo9sYjh0gu7tzwi1Nqjs6s2t%2FsOIfKi2CdKCXMT1PbrabaW9MDheH02tY%2B8IrKRI5AeKjoRXzcyTsR5mhc1Ne3%2FgDXkRT1hYfsxXTd6plYdQPvfixcofgc0Y5bJMK4y9JhV7O7HUZmis2G%2B5ez%2BFF7%2FpTeLszhBvvf6DwOiiM%2FPwl4q9V9wO0%2FwTGv8fM7SFAttuimcDwrM7Yav9S5u10RWScynAx1KuqwTG1rt28r%2B655rnec012W8Qx2Fg34pzLMIDlur4GOoUCG4DqrnrgmAJmqZYUwMXP4tfzYo%2Bn7jn%2Bv2EEJmXG18gX1ctCkd9sZKDmw3qJB9Pu2oxhtM4ySsG5l8hsNcviBoINfCCpKXRNawOW20%2BwJW17SI71uyy2y90HYM6nAm4hQNE2QFymr%2BnGrmrZqP603%2BgEpKZYdBkOyRp4K6KXzqwBj4G6itBxO0DiSfCdqNnN%2FHrY4uSzNlEgeep6AknJM6c0w9%2Bh9hvgvWk10qvgpLtshZ%2B%2FehoYQmWBhA8WDXp1OaigPwYIi0YfMjOgMzELMEY90BOqnyt0VJ8p8SXhyHCbS7Y0F6rQnxRRFLE71QVCEU%2FB74T%2B2RqVWu%2F10TouuoRBrsM%2F&X-Amz-Signature=725a3866d0a6e7002a1f372e96746e4e8d2d44195aabbeb0806688d00ec1d0cc'