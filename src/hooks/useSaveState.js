// hooks/useSaveState.js
import { useState } from 'react';
import { uploadData } from 'aws-amplify/storage';
import { generateClient } from 'aws-amplify/api';
import { createSaveState, updateSaveState } from '../graphql/mutations';
import { v4 as uuidv4 } from 'uuid';
import { userPoolRegion } from '../../config';

export const useSaveState = (gameInstance, currentGame, userId) => {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const saveState = async (saveData, isUpdate) => {
    setIsSaving(true);
    setError(null);
    
    try {
      const saveStateId = isUpdate ? saveData.id : uuidv4();
      const MBCRam = gameInstance.saveSRAMState();
      
      if (MBCRam.length === 0) {
        throw new Error('No save data available');
      }

      // Save game state to S3
      const saveKey = isUpdate 
        ? saveData.filePath
        : `private/${userPoolRegion}:${userId}/games/${currentGame.id}/saveStates/${saveStateId}/${saveData.title}.sav`;
      
      const savePackage = { MBCRam };
      const blob = new Blob([JSON.stringify(savePackage)], { type: 'application/json' });
      await uploadData({ path: saveKey, data: blob }).result;

      // Handle screenshot/image if provided
      let imagePath = saveData.img || '';
      if (saveData.imgFile && saveData.imgFile.type.startsWith('image/')) {
        const fileType = saveData.imgFile.name.split('.').pop();
        imagePath = `private/${userPoolRegion}:${userId}/games/${currentGame.id}/saveStates/${saveStateId}/${saveData.title}.${fileType}`;
        
        await uploadData({
          path: imagePath,
          data: saveData.imgFile,
          options: {
            contentType: saveData.imgFile.type
          }
        }).result;
      }

      // Update DynamoDB
      const client = generateClient();
      const saveStateInput = {
        id: saveStateId,
        filePath: saveKey,
        title: saveData.title,
        description: saveData.description || '',
        img: imagePath,
        gameSaveStatesId: currentGame.id,
        owner: userId
      };

      const mutation = isUpdate ? updateSaveState : createSaveState;
      const response = await client.graphql({ 
        query: mutation, 
        variables: { input: saveStateInput } 
      });

      return response.data[isUpdate ? 'updateSaveState' : 'createSaveState'];
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    saveState,
    isSaving,
    error
  };
};