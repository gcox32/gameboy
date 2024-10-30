'use client'

import Link from 'next/link';
import '@/styles/auth.css';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export default function Home() {
  const { user, signOut } = useAuth();

  useEffect(() => {
      if (user) {
          fetchUserProfile();
      }
  }, [user]);

  return (
    <div className="container">
      <h1 className="title">Welcome to JS GBC</h1>
      <p className="description">Play classic Gameboy Color games in your browser!</p>
      {user === null ? (
        <div className="button-container">
          <Link href="/auth/login">
            <button className="button">Login</button>
          </Link>
          <Link href="/auth/signup">
            <button className="button">Sign Up</button>
          </Link>
      </div>
      ) : (
        <div className="button-container">
          <Link href="/play">
            <button className="button">Play</button>
          </Link>
        </div>
      )}
    </div>
  );
}