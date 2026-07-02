'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser } from '@/app/actions/auth';
import { useRouter, usePathname } from 'next/navigation';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Function to fetch the true state from the server's HTTP-Only cookie
  const refreshUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      return currentUser;
    } catch (e) {
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, [pathname]);

  // Sync state across multiple tabs using localStorage event listener
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'auth_sync') {
        refreshUser();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Broadcast auth change to other tabs
  const broadcastAuthChange = () => {
    localStorage.setItem('auth_sync', Date.now().toString());
  };

  return (
    <AuthContext.Provider value={{ user, setUser, isLoading, refreshUser, broadcastAuthChange }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
