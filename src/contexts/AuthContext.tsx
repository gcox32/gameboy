'use client';

import React, { createContext, useState, useEffect, useContext } from 'react';
import { getCurrentUser } from 'aws-amplify/auth';
import { AuthUser } from 'aws-amplify/auth';

const AuthContext = createContext<{ user: AuthUser | null; setUser: (user: AuthUser | null) => void; loading: boolean } | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
  }, []);

  async function checkUser() {
    try {
      const user = await getCurrentUser()
      setUser(user)
    } catch (error) {
      setUser(null)
    } finally {
      setLoading(false)
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      {children}
    </AuthContext.Provider>
  )
};

export const useAuth = () => useContext(AuthContext);