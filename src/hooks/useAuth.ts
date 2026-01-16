import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  name: string;
  role: 'debtor' | 'creditor';
  pix_key?: string;
}

const STORAGE_KEY = 'promissoria_user';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load from localStorage first
    const savedUser = localStorage.getItem(STORAGE_KEY);
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (name: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const lowerName = name.toLowerCase().trim();
    
    try {
      // Query database for user
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .ilike('name', `%${lowerName.split(' ')[0]}%`);
      
      if (error) {
        console.error('Login error:', error);
        return { success: false, error: 'Erro ao conectar ao servidor' };
      }

      const matchedUser = users?.find(u => 
        u.password_hash === password
      );

      if (matchedUser) {
        const userData: User = {
          id: matchedUser.id,
          name: matchedUser.name,
          role: matchedUser.role as 'debtor' | 'creditor',
          pix_key: matchedUser.pix_key
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
        setUser(userData);
        return { success: true };
      }

      return { success: false, error: 'Nome ou senha inválidos' };
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, error: 'Erro ao fazer login' };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  const updatePixKey = useCallback(async (pixKey: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('users')
      .update({ pix_key: pixKey })
      .eq('id', user.id);

    if (!error) {
      const updatedUser = { ...user, pix_key: pixKey };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
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
