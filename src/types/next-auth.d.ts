import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
    interface Session {
        user: {
            id: string;
            admin: boolean;
        } & DefaultSession['user'];
    }

    interface User {
        admin?: boolean;
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id: string;
        admin: boolean;
    }
}
