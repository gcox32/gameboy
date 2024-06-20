import { generateClient } from 'aws-amplify/api';
import { uploadData } from 'aws-amplify/storage';
import { createSaveState, updateSaveState } from '../graphql/mutations';
import { listSaveStates } from '../graphql/queries';
import { assetsEndpointPrivate, userPoolRegion } from '../../config';

// saving functions
export async function saveGameToS3(savePackage, game, saveModalData, userId, s3ID, previous = false) {
    try {
        // Serialize the entire savePackage object into JSON
        const jsonStr = JSON.stringify(savePackage);

        // Convert the JSON string to a Blob
        const blob = new Blob([jsonStr], { type: 'application/json' });

        const key = previous ? saveModalData.filePath : `private/${userPoolRegion}:${userId}/${game.title}/${s3ID}/${saveModalData.title}.sav`;

        const s3Response = await uploadData({ path: key, data: blob }).result;

        return { result: s3Response, path: key };
    } catch (error) {
        console.error('Error saving to S3', error);
        throw error;
    }
}
export async function saveGameStateToDDB(s3Key, game, saveModalData, previous = false) {
    const tzoffset = (new Date()).getTimezoneOffset() * 60000; // offset in milliseconds
    const localISOTime = (new Date(Date.now() - tzoffset)).toISOString().slice(0, -1);

    const saveStateInput = {
        filePath: s3Key,
        title: saveModalData.title || `Save at ${localISOTime}`,
        description: saveModalData.description || '',
        img: saveModalData.img || '',
        gameSaveStatesId: game.id,
        owner: saveModalData.owner,
    };
    try {
        let ddbResponse;
        const client = generateClient();

        if (previous) {
            // If previous, update the existing save state
            saveStateInput.id = saveModalData.id; // Ensure that 'id' is set for updates
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

export async function saveSRAM(gameboyInstance, game, saveModalData, s3ID, previous = false) {
    const MBCRam = gameboyInstance.saveSRAMState();
    const savePackage = { 'MBCRam': MBCRam }
    if (MBCRam.length > 0) {
        console.log("Saving the SRAM...");
        const { result, path } = await saveGameToS3(savePackage, game, saveModalData, saveModalData.owner, s3ID, previous);
        const saveState = await saveGameStateToDDB(path, game, saveModalData, previous);
        return saveState;
    }
}

// loading functions

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
        const s3Response = uploadData({ filePath, file });
        return await s3Response.result;
    } catch (error) {
        console.error('Error uploading image to S3', error);
        throw error;
    }
}