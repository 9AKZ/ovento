import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/authService';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: string;
  avatarUrl?: string;
}

export interface MutationState {
  isPending: boolean;
  error: Error | null;
}

export function useAuth() {
  const [user, setUser] = React.useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loginMutation, setLoginMutation] = React.useState<MutationState>({
    isPending: false,
    error: null,
  });
  const [registerMutation, setRegisterMutation] = React.useState<MutationState>({
    isPending: false,
    error: null,
  });
  const [logoutMutation, setLogoutMutation] = React.useState<MutationState>({
    isPending: false,
    error: null,
  });

  const loadSession = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const storedUser = await AsyncStorage.getItem('user');
      if (token && storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to load session:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadSession();
  }, [loadSession]);

  const login = React.useCallback(
    async (email: string, password: string) => {
      setLoginMutation({ isPending: true, error: null });
      try {
        const result = await authService.login({ email, password });
        await AsyncStorage.setItem('accessToken', result.accessToken);
        await AsyncStorage.setItem('refreshToken', result.refreshToken);
        await AsyncStorage.setItem('user', JSON.stringify(result.user));
        setUser(result.user);
        setLoginMutation({ isPending: false, error: null });
        return result.user;
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || 'Login failed';
        const mutationError = new Error(errorMessage);
        setLoginMutation({ isPending: false, error: mutationError });
        throw mutationError;
      }
    },
    []
  );

  const register = React.useCallback(
    async (email: string, password: string, fullName: string) => {
      setRegisterMutation({ isPending: true, error: null });
      try {
        const result = await authService.register({ email, password, fullName });
        await AsyncStorage.setItem('accessToken', result.accessToken);
        await AsyncStorage.setItem('refreshToken', result.refreshToken);
        await AsyncStorage.setItem('user', JSON.stringify(result.user));
        setUser(result.user);
        setRegisterMutation({ isPending: false, error: null });
        return result.user;
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
        const mutationError = new Error(errorMessage);
        setRegisterMutation({ isPending: false, error: mutationError });
        throw mutationError;
      }
    },
    []
  );

  const logout = React.useCallback(async () => {
    setLogoutMutation({ isPending: true, error: null });
    try {
      await authService.logout();
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('user');
      setUser(null);
      setLogoutMutation({ isPending: false, error: null });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Logout failed';
      const mutationError = new Error(errorMessage);
      setLogoutMutation({ isPending: false, error: mutationError });
      // Still clear local state even if server logout fails
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('user');
      setUser(null);
    }
  }, []);

  return {
    user,
    isLoading,
    loading: isLoading,
    error: loginMutation.error || registerMutation.error || logoutMutation.error,
    login,
    register,
    logout,
    loginMutation,
    registerMutation,
    logoutMutation,
    refresh: loadSession,
  };
}
