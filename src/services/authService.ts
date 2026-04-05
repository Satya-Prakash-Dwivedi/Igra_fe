import api from './api';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  name: string; // Keep for convenience / legacy
  email: string;
  role: 'user' | 'admin' | 'client' | 'staff';
  avatar?: string;
  company?: {
    name: string;
  };
  youtubeChannel?: string;
  notificationPreferences?: {
    email: boolean;
    inApp: boolean;
  };
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
  password?: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password?: string;
}

export interface ProfileUpdateData {
  firstName?: string;
  lastName?: string;
  avatar?: string;
  companyName?: string;
  youtubeChannel?: string;
  notificationEmail?: boolean;
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

  async updateProfile(profileData: ProfileUpdateData): Promise<AuthResponse> {
    const { data } = await api.patch<AuthResponse>('/auth/profile', profileData);
    return data;
  },

  async refreshToken(): Promise<AuthResponse> {
    const { data } = await api.get<AuthResponse>('/auth/refresh');
    return data;
  },
};

export default authService;
