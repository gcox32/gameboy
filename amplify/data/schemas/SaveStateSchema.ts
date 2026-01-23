import { a } from "@aws-amplify/backend";

export const SaveStateSchema = a
  .model({
    id: a.id(),
    owner: a.string().authorization((allow) => [
      allow.owner().to(['read', 'create', 'delete']),
    ]), // cognito sub
    gameId: a.id(),
    game: a.belongsTo('Game', 'gameId'),
    filePath: a.string(),
    title: a.string(),
    description: a.string(),
    img: a.string(),
  })
  .authorization((allow) => [
    allow.owner().to(['create', 'read', 'update', 'delete']),
    allow.group('admin').to(['create', 'read', 'update', 'delete']), // Admins can do everything
    allow.authenticated().to(['create', 'read', 'update', 'delete']),
    allow.guest().to(['read'])
  ]);