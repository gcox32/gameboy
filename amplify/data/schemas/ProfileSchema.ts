import { a } from "@aws-amplify/backend";

export const ProfileSchema = a
    .model({
        id: a.id(),
        owner: a.string(), // cognito sub
        username: a.string(),
        email: a.string(),
        avatar: a.string(),
        bio: a.string(),
        admin: a.boolean(),
    })
    .authorization((allow) => [
        allow.owner().to(['create', 'read', 'update', 'delete']),
        allow.authenticated().to(['read']),
        allow.guest().to(['read'])
    ]);