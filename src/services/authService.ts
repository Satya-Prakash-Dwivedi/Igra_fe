import api from './api';

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  name: string; // Keep for convenience / legacy
  email: string;
  role: 'user' | 'admin' | 'client' | 'staff';
  avatar?: string;
  company?: {
    name: string;
  };
  credits?: number;
  organization?: string;
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

  async register(userData: RegisterData): Promise<{success: boolean; message: string}> {
    const { data } = await api.post<{success: boolean; message: string}>('/auth/register', userData);
    return data;
  },

  async verifyEmail(token: string): Promise<{success: boolean; message: string}> {
    const { data } = await api.post<{success: boolean; message: string}>('/auth/verify-email', { token });
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
  
  async resendVerification(email: string): Promise<{ success: boolean; message: string }> {
    const { data } = await api.post<{ success: boolean; message: string }>('/auth/resend-verification', { email });
    return data;
  },

  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    const { data } = await api.post<{ success: boolean; message: string }>('/auth/forgot-password', { email });
    return data;
  },

  async resetPassword(token: string, password?: string): Promise<{ success: boolean; message: string }> {
    const { data } = await api.post<{ success: boolean; message: string }>('/auth/reset-password', { token, password });
    return data;
  },
};

export default authService;
