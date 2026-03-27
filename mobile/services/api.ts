import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Get the backend URL - for local testing with Expo Go
// Priority:
// - EXPO_PUBLIC_API_URL
// - Android emulator: 10.0.2.2
// - iOS simulator: localhost
// - Device / PC network IP (example 192.168.56.1)
const DEFAULT_BACKEND_URL =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:4000/api'
    : Platform.OS === 'ios'
    ? 'http://localhost:4000/api'
    : 'http://192.168.56.1:4000/api';

const BACKEND_URL = process.env.EXPO_PUBLIC_API_URL || DEFAULT_BACKEND_URL;

console.log('[API] Backend URL configured:', BACKEND_URL);

const api: AxiosInstance = axios.create({
  baseURL: BACKEND_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('[API] Request with auth token to:', config.url);
  } else {
    console.log('[API] Request without auth token to:', config.url);
  }
  return config;
});

// Handle responses and refresh token on 401
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (refreshToken) {
          // Attempt to refresh the token
          const response = await axios.post(`${BACKEND_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken } = response.data;
          await AsyncStorage.setItem('accessToken', accessToken);

          // Retry the original request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } else {
          // No refresh token, clear auth
          await AsyncStorage.removeItem('accessToken');
          await AsyncStorage.removeItem('refreshToken');
          await AsyncStorage.removeItem('user');
        }
      } catch (refreshError) {
        // Refresh failed, clear auth
        await AsyncStorage.removeItem('accessToken');
        await AsyncStorage.removeItem('refreshToken');
        await AsyncStorage.removeItem('user');
      }
    }

    return Promise.reject(error);
  }
);

export default api;
