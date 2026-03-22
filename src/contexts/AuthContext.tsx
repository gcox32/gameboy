'use client';

import { createContext, useContext, ReactNode } from 'react';
import { SessionProvider, useSession } from 'next-auth/react';

export interface AppUser {
    userId: string;
    email: string;
    username: string;
    admin: boolean;
}

interface AuthContextValue {
    user: AppUser | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function AuthContextBridge({ children }: { children: ReactNode }) {
    const { data: session, status } = useSession();

    const user: AppUser | null = session?.user
        ? {
              userId: session.user.id,
              email: session.user.email ?? '',
              username: session.user.name ?? session.user.email ?? '',
              admin: session.user.admin ?? false,
          }
        : null;

    return (
        <AuthContext.Provider value={{ user, loading: status === 'loading' }}>
            {children}
        </AuthContext.Provider>
    );
}

export function AuthProvider({ children }: { children: ReactNode }) {
    return (
        <SessionProvider>
            <AuthContextBridge>{children}</AuthContextBridge>
        </SessionProvider>
    );
}

export const useAuth = () => useContext(AuthContext);
