/**
 * Authentication type definitions
 */

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  userType: 'Platform' | 'Partner';
  avatar?: string;
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Dummy user for testing
export const DUMMY_USER: User = {
  id: '1',
  email: 'john@wobot.ai',
  name: 'John',
  role: 'admin',
  userType: 'Platform',
  createdAt: new Date().toISOString(),
};

export const DUMMY_PASSWORD = 'password123';
