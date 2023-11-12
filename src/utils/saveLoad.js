import { Storage, API, graphqlOperation } from 'aws-amplify';
import { createSaveState, updateSaveState } from '../graphql/mutations';
import { listSaveStates } from '../graphql/queries';

// saving functions
export async function saveGameToS3(savePackage, game, saveModalData, previous = false) {
    try {
        // Serialize the entire savePackage object into JSON
        const jsonStr = JSON.stringify(savePackage);

        // Convert the JSON string to a Blob
        const blob = new Blob([jsonStr], { type: 'application/json' });

        const s3ID = crypto.randomUUID();
        const key = previous ? saveModalData.filePath : `${game.title}/saves/${s3ID}.sav`;

        const s3Response = await Storage.put(key, blob, {
            contentType: 'application/json',
            level: 'private',
        });

        return s3Response.key;
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
        if (previous) {
            // If previous, update the existing save state
            saveStateInput.id = saveModalData.id; // Ensure that 'id' is set for updates
            ddbResponse = await API.graphql(graphqlOperation(updateSaveState, { input: saveStateInput }));
        } else {
            // Otherwise, create a new save state
            ddbResponse = await API.graphql(graphqlOperation(createSaveState, { input: saveStateInput }));
        }
        return ddbResponse.data[previous ? 'updateSaveState' : 'createSaveState'];
    } catch (error) {
        console.error('Error saving to DynamoDB', error);
        throw error;
    }
}
export async function saveSRAM(gameboyInstance, game, saveModalData, previous = false) {
    const MBCRam = gameboyInstance.saveSRAMState();
    const savePackage = { 'MBCRam': MBCRam }
    if (MBCRam.length > 0) {
        console.log("Saving the SRAM...");
        const s3Key = await saveGameToS3(savePackage, game, saveModalData, previous);
        const saveState = await saveGameStateToDDB(s3Key, game, saveModalData, previous);
        return saveState;
    }
}

// loading functions

export async function fetchUserSaveStates(userId, gameId) {
    try {
        const saveStateData = await API.graphql(graphqlOperation(listSaveStates, {
            filter: {
                gameSaveStatesId: {
                    eq: gameId,
                },
                owner: {
                    eq: userId,
                }
            }
        }));
        return saveStateData.data.listSaveStates.items;
    } catch (error) {
        console.error('Error fetching save states:', error);
        throw error;
    }
};
export async function uploadImageToS3(file, filePath) {
    try {
        const s3Response = await Storage.put(filePath, file, {
            contentType: file.type,
            level: 'private',
        });
        return s3Response.key;
    } catch (error) {
        console.error('Error uploading image to S3', error);
        throw error;
    }
}
// download and run