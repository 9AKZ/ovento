import api from './api';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: string;
  avatarUrl?: string;
  bio?: string;
}

export interface AuthPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
}

export interface AuthResponse {
  user: UserProfile;
  accessToken: string;
  refreshToken: string;
  message?: string;
}

export interface MeResponse {
  user: UserProfile;
}

export interface LogoutResponse {
  message: string;
}

export const authService = {
  async login({ email, password }: AuthPayload): Promise<AuthResponse> {
    try {
      const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
      return data;
    } catch (error) {
      throw error;
    }
  },

  async register({
    email,
    password,
    fullName,
  }: RegisterPayload): Promise<AuthResponse> {
    try {
      const { data } = await api.post<AuthResponse>('/auth/register', {
        email,
        password,
        fullName,
        role: 'USER',
      });
      return data;
    } catch (error) {
      throw error;
    }
  },

  async logout(): Promise<LogoutResponse> {
    try {
      const { data } = await api.post<LogoutResponse>('/auth/logout');
      return data;
    } catch (error) {
      throw error;
    }
  },

  async me(): Promise<MeResponse> {
    try {
      const { data } = await api.get<MeResponse>('/auth/me');
      return data;
    } catch (error) {
      throw error;
    }
  },
};
