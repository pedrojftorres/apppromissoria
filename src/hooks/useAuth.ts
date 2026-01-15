import { useState, useEffect, useCallback } from 'react';
import { User } from '@/types/promissory';
import { getUser, saveUser, clearUser } from '@/lib/storage';

// Simulated user credentials
const USERS = {
  debtor: { name: 'Pedro Henrique Torres', password: 'pedro123' },
  creditor: { name: 'Lindomar de Almeida Barbosa', password: 'lindomar123' },
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = getUser();
    if (savedUser) {
      setUser(savedUser);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((name: string, password: string): { success: boolean; error?: string } => {
    const lowerName = name.toLowerCase().trim();
    
    // Check debtor
    if (lowerName.includes('pedro') && password === USERS.debtor.password) {
      const newUser: User = {
        id: 'debtor',
        name: USERS.debtor.name,
        role: 'debtor',
      };
      saveUser(newUser);
      setUser(newUser);
      return { success: true };
    }

    // Check creditor
    if (lowerName.includes('lindomar') && password === USERS.creditor.password) {
      const newUser: User = {
        id: 'creditor',
        name: USERS.creditor.name,
        role: 'creditor',
      };
      saveUser(newUser);
      setUser(newUser);
      return { success: true };
    }

    return { success: false, error: 'Nome ou senha inválidos' };
  }, []);

  const logout = useCallback(() => {
    clearUser();
    setUser(null);
  }, []);

  const updatePixKey = useCallback((pixKey: string) => {
    if (user) {
      const updatedUser = { ...user, pixKey };
      saveUser(updatedUser);
      setUser(updatedUser);
    }
  }, [user]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    updatePixKey,
  };
};
