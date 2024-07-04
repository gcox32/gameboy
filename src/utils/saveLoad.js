import { generateClient } from 'aws-amplify/api';
import { uploadData } from 'aws-amplify/storage';
import { createSaveState, updateSaveState } from '../graphql/mutations';
import { listGames, listSaveStates } from '../graphql/queries';
import { userPoolRegion } from '../../config';
import { v4 as uuidv4 } from 'uuid';

export async function saveGameToS3(savePackage, game, saveModalData, userId, previous = false) {
    try {
        // Serialize the entire savePackage object into JSON
        const jsonStr = JSON.stringify(savePackage);

        // Convert the JSON string to a Blob
        const blob = new Blob([jsonStr], { type: 'application/json' });

        // Generate a unique saveStateId if not updating a previous save
        const saveStateId = previous ? saveModalData.id : uuidv4();

        // Construct the key based on the new directory structure
        const key = previous
            ? saveModalData.filePath
            : `private/${userPoolRegion}:${userId}/games/${game.id}/saveStates/${saveStateId}/${saveModalData.title}.sav`;

        const s3Response = await uploadData({ path: key, file: blob }).result;

        let imagePath = saveModalData.img || '';
        if (saveModalData.imgFile && saveModalData.imgFile.type.startsWith('image/')) {
            const fileType = saveModalData.imgFile.name.split('.').pop();
            imagePath = `private/${userPoolRegion}:${userId}/games/${game.id}/saveStates/${saveStateId}/${saveModalData.title}.${fileType}`;
            await uploadData({ path: imagePath, file: saveModalData.imgFile }).result;
        }

        return { result: s3Response, path: key, imagePath, saveStateId };
    } catch (error) {
        console.error('Error saving to S3', error);
        throw error;
    }
}

export async function saveGameStateToDDB(s3Key, game, saveModalData, saveStateId, imagePath, previous = false) {
    const tzoffset = (new Date()).getTimezoneOffset() * 60000; // offset in milliseconds
    const localISOTime = (new Date(Date.now() - tzoffset)).toISOString().slice(0, -1);

    const saveStateInput = {
        id: saveStateId,
        filePath: s3Key,
        title: saveModalData.title || `Save at ${localISOTime}`,
        description: saveModalData.description || '',
        img: imagePath || '',
        gameSaveStatesId: game.id,
        owner: saveModalData.owner,
    };
    try {
        let ddbResponse;
        const client = generateClient();

        if (previous) {
            // If previous, update the existing save state
            ddbResponse = await client.graphql({ query: updateSaveState, variables: { input: saveStateInput } });
        } else {
            // Otherwise, create a new save state
            ddbResponse = await client.graphql({ query: createSaveState, variables: { input: saveStateInput } });
        }
        return ddbResponse.data[previous ? 'updateSaveState' : 'createSaveState'];
    } catch (error) {
        console.error('Error saving to DynamoDB', error);
        throw error;
    }
}

export async function saveSRAM(gameboyInstance, game, saveModalData, previous = false) {
    const MBCRam = gameboyInstance.saveSRAMState();
    const savePackage = { 'MBCRam': MBCRam };

    if (MBCRam.length > 0) {
        console.log("Saving the SRAM...");
        const { result, path, imagePath, saveStateId } = await saveGameToS3(savePackage, game, saveModalData, saveModalData.owner, previous);
        const saveState = await saveGameStateToDDB(path, game, saveModalData, saveStateId, imagePath, previous);
        return saveState;
    }
}

// loading functions

export async function fetchUserGames(userId) {
    try {
        const client = generateClient();
        const gameData = await client.graphql(
            {
                query: listGames,
                variables: {
                    filter: {
                        owner: {
                            eq: userId,
                        }
                    }
                }
            });

        return gameData.data.listGames.items;

    } catch (error) {
        console.error('Error fetching save states:', error);
        throw error;
    }
};

export async function fetchUserSaveStates(userId, gameId) {
    try {
        const client = generateClient();
        const saveStateData = await client.graphql(
            {
                query: listSaveStates,
                variables: {
                    filter: {
                        gameSaveStatesId: {
                            eq: gameId,
                        },
                        owner: {
                            eq: userId,
                        }
                    }
                }
            });

        return saveStateData.data.listSaveStates.items;

    } catch (error) {
        console.error('Error fetching save states:', error);
        throw error;
    }
};
export async function uploadImageToS3(file, filePath) {
    try {
        const s3Response = uploadData({ path: filePath, data: file });
        return await s3Response.result;
    } catch (error) {
        console.error('Error uploading image to S3', error);
        throw error;
    }
}