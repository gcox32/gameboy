import { a } from "@aws-amplify/backend";

export const GameSchema = a
    .model({
        id: a.id(),
        owner: a.string(), // cognito sub
        title: a.string(),
        img: a.string(),
        filePath: a.string(),
        saveStates: a.hasMany('SaveState', 'gameId'),
        metadata: a.json(), // series, generation, releaseDate, description
    })
    .authorization((allow) => [
        allow.owner().to(['create', 'read', 'update', 'delete']),
        allow.authenticated().to(['read']),
        allow.guest().to(['read'])
    ]);