import { a } from "@aws-amplify/backend";

export const NotificationSchema = a
    .model({
        id: a.id(),
        owner: a.string().authorization((allow) => [
            allow.owner().to(['read', 'create', 'delete']),
        ]), // cognito sub
        sender: a.string(),
        type: a.string(), // e.g. FRIEND_REQUEST, SYSTEM, INFO
        title: a.string(),
        body: a.string(),
        readAt: a.datetime()
    })
    .authorization((allow) => [
        allow.owner().to(['create', 'read', 'update', 'delete']),
        allow.group('admin').to(['create', 'read', 'update', 'delete']), // Admins can do everything
        allow.authenticated().to(['read']),
        allow.guest().to(['read'])
    ]);


