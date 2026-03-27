import React, { createContext, useContext, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, UserProfile, AuthPayload, RegisterPayload } from '../services/authService';

export type AuthContextType = {
  user: UserProfile | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: ReturnType<typeof useLoginMutation>;
  registerMutation: ReturnType<typeof useRegisterMutation>;
  logoutMutation: ReturnType<typeof useLogoutMutation>;
};

const AuthContext = createContext<AuthContextType | null>(null);

function useLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: AuthPayload) => {
      const result = await authService.login(credentials);
      await AsyncStorage.setItem('accessToken', result.accessToken);
      await AsyncStorage.setItem('refreshToken', result.refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(result.user));
      return result;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['auth', 'me'], { user: data.user });
    },
    onError: (error: Error) => {
      console.error('Login error:', error);
    },
  });
}

function useRegisterMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: RegisterPayload) => {
      const result = await authService.register(payload);
      await AsyncStorage.setItem('accessToken', result.accessToken);
      await AsyncStorage.setItem('refreshToken', result.refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(result.user));
      return result;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['auth', 'me'], { user: data.user });
    },
    onError: (error: Error) => {
      console.error('Register error:', error);
    },
  });
}

function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await authService.logout();
    },
    onSuccess: async () => {
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('user');
      queryClient.setQueryData(['auth', 'me'], null);
    },
    onError: async (error: Error) => {
      // Still clear local state even if server logout fails
      console.error('Logout error:', error);
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('user');
      queryClient.setQueryData(['auth', 'me'], null);
    },
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const token = await AsyncStorage.getItem('accessToken');
      const storedUser = await AsyncStorage.getItem('user');

      if (token && storedUser) {
        try {
          // Verify token is still valid
          await authService.me();
          return { user: JSON.parse(storedUser) };
        } catch (err) {
          // Token might be expired, clear it
          await AsyncStorage.removeItem('accessToken');
          await AsyncStorage.removeItem('refreshToken');
          await AsyncStorage.removeItem('user');
          return null;
        }
      }
      return null;
    },
    retry: false,
  });

  const user = data?.user ?? null;
  const loginMutation = useLoginMutation();
  const registerMutation = useRegisterMutation();
  const logoutMutation = useLogoutMutation();

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error: error as Error | null,
        loginMutation,
        registerMutation,
        logoutMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
