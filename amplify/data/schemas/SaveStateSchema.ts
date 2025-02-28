import { a } from "@aws-amplify/backend";

export const SaveStateSchema = a
    .model({
      id: a.id(),
      owner: a.string(),
      gameId: a.id(),
      game: a.belongsTo('Game', 'gameId'),
      filePath: a.string(),
      title: a.string(),
      description: a.string(),
      img: a.string(),
    })
    .authorization((allow) => [allow.guest()])