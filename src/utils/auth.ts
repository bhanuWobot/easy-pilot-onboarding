/**
 * Authentication utility functions
 */

import type { LoginCredentials, AuthResponse, User } from '../types/auth';
import { DUMMY_USER, DUMMY_PASSWORD } from '../types/auth';

const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_USER_KEY = 'auth_user';

/**
 * Validate login credentials (dummy implementation)
 * @param credentials - User login credentials
 * @returns Promise resolving to auth response or null if invalid
 */
export async function validateLogin(
  credentials: LoginCredentials
): Promise<AuthResponse | null> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Dummy validation
  if (
    credentials.email === DUMMY_USER.email &&
    credentials.password === DUMMY_PASSWORD
  ) {
    const token = generateToken();
    return {
      user: DUMMY_USER,
      token,
    };
  }

  return null;
}

/**
 * Generate a dummy JWT token
 * @returns Random token string
 */
function generateToken(): string {
  return `token_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Save auth data to localStorage
 * @param user - User object
 * @param token - Auth token
 */
export function saveAuthData(user: User, token: string): void {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

/**
 * Get saved auth data from localStorage
 * @returns User and token if exists, null otherwise
 */
export function getAuthData(): { user: User; token: string } | null {
  const userStr = localStorage.getItem(AUTH_USER_KEY);
  const token = localStorage.getItem(AUTH_TOKEN_KEY);

  if (!userStr || !token) {
    return null;
  }

  try {
    const user = JSON.parse(userStr) as User;
    return { user, token };
  } catch {
    return null;
  }
}

/**
 * Clear all auth data from localStorage
 */
export function clearAuthData(): void {
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

/**
 * Check if token is valid (dummy implementation)
 * @param token - Auth token to validate
 * @returns true if valid, false otherwise
 */
export function isTokenValid(token: string): boolean {
  // In production, this would validate JWT expiration, signature, etc.
  return token.startsWith('token_');
}
