import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { OnboardingConfig } from '../types/onboarding';
import { DEFAULT_CONFIG } from '../types/onboarding';

interface OnboardingState {
  config: OnboardingConfig;
}

type OnboardingAction =
  | { type: 'UPDATE_CONFIG'; payload: Partial<OnboardingConfig> }
  | { type: 'LOAD_CONFIG'; payload: OnboardingConfig }
  | { type: 'RESET_CONFIG' }
  | { type: 'TOGGLE_FIELD'; field: keyof OnboardingConfig['fieldToggles'] };

interface OnboardingContextType {
  state: OnboardingState;
  dispatch: React.Dispatch<OnboardingAction>;
}

const OnboardingBuilderContext = createContext<OnboardingContextType | null>(null);

const STORAGE_KEY = 'onboarding-builder-state';

function onboardingReducer(state: OnboardingState, action: OnboardingAction): OnboardingState {
  switch (action.type) {
    case 'UPDATE_CONFIG':
      return {
        ...state,
        config: { ...state.config, ...action.payload },
      };
    case 'LOAD_CONFIG':
      return {
        ...state,
        config: action.payload,
      };
    case 'RESET_CONFIG':
      return {
        ...state,
        config: DEFAULT_CONFIG,
      };
    case 'TOGGLE_FIELD':
      return {
        ...state,
        config: {
          ...state.config,
          fieldToggles: {
            ...state.config.fieldToggles,
            [action.field]: !state.config.fieldToggles[action.field],
          },
        },
      };
    default:
      return state;
  }
}

function loadInitialState(): OnboardingState {
  try {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      const parsed = JSON.parse(savedState);
      return { config: parsed };
    }
  } catch (error) {
    console.error('Error loading saved state:', error);
  }
  return { config: DEFAULT_CONFIG };
}

export function OnboardingBuilderProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(onboardingReducer, null, loadInitialState);

  // Persist state to localStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.config));
    } catch (error) {
      console.error('Error saving state to localStorage:', error);
    }
  }, [state.config]);

  return (
    <OnboardingBuilderContext.Provider value={{ state, dispatch }}>
      {children}
    </OnboardingBuilderContext.Provider>
  );
}

export function useOnboardingBuilder() {
  const context = useContext(OnboardingBuilderContext);
  if (!context) {
    throw new Error('useOnboardingBuilder must be used within OnboardingBuilderProvider');
  }
  return context;
}
