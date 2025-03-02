import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

import { GameSchema } from './schemas/GameSchema';
import { SaveStateSchema } from './schemas/SaveStateSchema';
import { ProfileSchema } from './schemas/ProfileSchema';

const schema = a.schema({
  Game: GameSchema,
  SaveState: SaveStateSchema,
  Profile: ProfileSchema,
})

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});