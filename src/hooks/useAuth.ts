import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { UserProfile, AuthState } from '../types';
import { loginUser, logoutUser, onAuthChange } from '../services/userService';

export const useAuth = (): AuthState & {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<{ success: boolean; error?: string }>;
} => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange((user, profile) => {
      setUser(user);
      setUserProfile(profile);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    return await loginUser(email, password);
  };

  const logout = async () => {
    return await logoutUser();
  };

  return {
    user,
    userProfile,
    loading,
    login,
    logout
  };
};