import api from './api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'client';
  avatar?: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    access_token: string;
  };
  message?: string;
}

export interface LoginCredentials {
  email: string;
  password?: string; // Optional for Google OAuth or other flows
}

export interface RegisterData {
  name: string;
  email: string;
  password?: string;
}

const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login', credentials);
    return data;
  },

  async register(userData: RegisterData): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/register', userData);
    return data;
  },

  async logout(): Promise<{ success: boolean }> {
    const { data } = await api.post<{ success: boolean }>('/auth/logout');
    return data;
  },

  async getProfile(): Promise<AuthResponse> {
    const { data } = await api.get<AuthResponse>('/auth/profile');
    return data;
  },

  async refreshToken(): Promise<AuthResponse> {
    const { data } = await api.get<AuthResponse>('/auth/refresh');
    return data;
  },
};

export default authService;
