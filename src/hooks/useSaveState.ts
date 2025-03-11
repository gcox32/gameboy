// hooks/useSaveState.js
import { useState } from 'react';
import { generateClient } from 'aws-amplify/api';
import { type Schema } from '@/amplify/data/resource';
import { uploadData } from 'aws-amplify/storage';
import { v4 as uuidv4 } from 'uuid';

// Define types for the hook parameters and state
interface GameInstance {
  saveSRAMState: () => number[];
}

interface Game {
  id: string;
  title: string;
}

interface SaveData {
  id?: string;
  title: string;
  description?: string;
  img?: string;
  imgFile?: File;
  filePath?: string;
}

const client = generateClient<Schema>();

export const useSaveState = (gameInstance: GameInstance, currentGame: Game, userId: string) => {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const saveState = async (saveData: SaveData, isUpdate: boolean) => {
    setIsSaving(true);
    setError(null);
    
    try {
      const saveStateId = (isUpdate && saveData.id) ? saveData.id : uuidv4();
      const MBCRam = gameInstance.saveSRAMState();
      
      if (MBCRam.length === 0) {
        throw new Error('No save data available');
      }

      // Save game state to S3
      const saveKey = isUpdate && saveData.filePath 
        ? saveData.filePath
        : `private/${userId}/games/${currentGame.id}/saveStates/${saveStateId}/${saveData.title}.sav`;
      
      const savePackage = { MBCRam };
      const blob = new Blob([JSON.stringify(savePackage)], { type: 'application/json' });
      await uploadData({ 
        path: saveKey,
        data: blob,
        options: {}
      }).result;

      // Handle screenshot/image if provided
      let imagePath = saveData.img || '';
      if (saveData.imgFile && saveData.imgFile.type.startsWith('image/')) {
        const fileType = saveData.imgFile.name.split('.').pop();
        imagePath = `private/${userId}/games/${currentGame.id}/saveStates/${saveStateId}/screenshot.${fileType}`;
        
        await uploadData({
          path: imagePath,
          data: saveData.imgFile,
          options: {
            contentType: saveData.imgFile.type
          }
        }).result;
      }

      // Update DynamoDB using Gen 2 client
      const saveStateInput = {
        id: saveStateId,
        filePath: saveKey,
        title: saveData.title,
        description: saveData.description || '',
        img: imagePath,
        gameId: currentGame.id,
        owner: userId
      };

      const response = await (
        isUpdate ? 
          client.models.SaveState.update(saveStateInput) : 
          client.models.SaveState.create(saveStateInput))
          .then(response => {
            return response;
          });
      return response.data;

    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      setError(error);
      throw error;
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
