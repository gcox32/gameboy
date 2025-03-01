import { generateClient } from 'aws-amplify/api';
import { uploadData } from 'aws-amplify/storage';
import { userPoolRegion } from '../../config';
import { v4 as uuidv4 } from 'uuid';
import { Amplify } from 'aws-amplify';
import outputs from '../../amplify_outputs.json';
import { getUrl, downloadData } from 'aws-amplify/storage';

Amplify.configure(outputs);
export async function saveGameToS3(savePackage, game, saveModalData, userId, previous = false) {
    try {
        // Serialize the entire savePackage object into JSON
        const jsonStr = JSON.stringify(savePackage);

        // Convert the JSON string to a Blob
        const blob = new Blob([jsonStr], { type: 'application/json' });
        console.log(blob);
        // Generate a unique saveStateId if not updating a previous save
        const saveStateId = previous ? saveModalData.id : uuidv4();

        // Construct the key based on the new directory structure
        const key = previous
            ? saveModalData.filePath
            : `private/${userPoolRegion}:${userId}/games/${game.id}/saveStates/${saveStateId}/${saveModalData.title}.sav`;
        console.log(key);
        console.log(typeof blob);
        const s3Response = await uploadData({ path: key, data: blob }).result;

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
export async function fetchUserSaveStates(userId, gameId) {
    try {
        const client = generateClient();
        const saveStateData = await client.models.SaveState.list({
            filter: {
                gameId: { eq: gameId },
                owner: { eq: userId }
            }
        });
        console.log('Save state data:', saveStateData);

        return saveStateData.data;

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

export async function loadInGameFile(filePath) {
    try {
        console.log('Loading in-game file:', filePath);
        const linkUrl = (await getUrl({ path: filePath })).url.href;
        console.log('Link URL:', linkUrl);
        const fileData = await downloadData({ path: filePath }).result;
        console.log('File data:', fileData);
        return fileData;
    } catch (error) {
        console.error('Error loading in-game file', error);
        throw error;
    }
};