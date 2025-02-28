import { a } from "@aws-amplify/backend";

export const ProfileSchema = a
    .model({
        id: a.id(),
        owner: a.string(),
        username: a.string(),
        email: a.string(),
        avatar: a.string(),
        bio: a.string(),
    })
    .authorization((allow) => [allow.guest()])