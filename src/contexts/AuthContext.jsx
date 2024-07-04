'use client';

import React, { createContext, useState, useEffect, useContext } from 'react';
import { getCurrentUser } from 'aws-amplify/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
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