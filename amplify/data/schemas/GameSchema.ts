import { a } from "@aws-amplify/backend";

export const GameSchema = a
    .model({
        id: a.id(),
        owner: a.string(),
        title: a.string(),
        releaseDate: a.string(),
        description: a.string(),
        img: a.string(),
        filePath: a.string(),
        saveStates: a.hasMany('SaveState', 'gameId'),
        backgroundImg: a.string(),
        series: a.string(),
        generation: a.string(),
    })
    .authorization((allow) => [allow.guest()])