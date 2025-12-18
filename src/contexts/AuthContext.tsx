/**
 * Authentication Context Provider
 * Manages global authentication state with localStorage persistence
 */

import React, { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import type { User, AuthState } from '../types/auth';
import { getAuthData, saveAuthData, clearAuthData, isTokenValid } from '../utils/auth';

type AuthAction =
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'RESTORE_SESSION'; payload: { user: User; token: string } | null };

interface AuthContextType {
  state: AuthState;
  dispatch: React.Dispatch<AuthAction>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'RESTORE_SESSION':
      if (action.payload) {
        return {
          ...state,
          user: action.payload.user,
          token: action.payload.token,
          isAuthenticated: true,
          isLoading: false,
        };
      }
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
    default:
      return state;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Restore session from localStorage on mount
  useEffect(() => {
    const restoreSession = () => {
      const authData = getAuthData();
      
      if (authData && isTokenValid(authData.token)) {
        // Migration: Add default userType if missing
        if (!authData.user.userType) {
          authData.user.userType = 'Platform';
        }
        dispatch({ type: 'RESTORE_SESSION', payload: authData });
      } else {
        // Clear invalid/expired data
        clearAuthData();
        dispatch({ type: 'RESTORE_SESSION', payload: null });
      }
    };

    restoreSession();
  }, []);

  // Persist auth data to localStorage when it changes
  useEffect(() => {
    if (state.user && state.token && state.isAuthenticated) {
      saveAuthData(state.user, state.token);
    } else if (!state.isAuthenticated && !state.isLoading) {
      clearAuthData();
    }
  }, [state.user, state.token, state.isAuthenticated, state.isLoading]);

  return (
    <AuthContext.Provider value={{ state, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
