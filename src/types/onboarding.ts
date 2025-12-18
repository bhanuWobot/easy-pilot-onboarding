export interface FieldToggles {
  contactPerson: boolean;
  welcomeMessage: boolean;
  backgroundImage: boolean;
  brandColor: boolean;
}

export interface BackgroundPreset {
  id: string;
  name: string;
  imageUrl: string;
  thumbnail: string;
}

export interface OnboardingConfig {
  pilotName: string;
  contactPerson: string;
  customerBusinessDetails: string; // Customer business context for AI image generation (not visible in preview)
  brandColor: string; // Brand color for buttons and accents
  welcomeMessage: string;
  backgroundImage: string;
  fieldToggles: FieldToggles;
}

// PilotRecord extends both Pilot fields and OnboardingConfig for customer-facing links
export interface PilotRecord extends OnboardingConfig {
  id: string;
  name: string;
  company: string;
  contactEmail: string;
  status: 'draft' | 'active' | 'completed';
  progress?: number; // 0-100, calculated from objectives
  cameraCount: string;
  location: string;
  locationName: string;
  startDate: string;
  customerId?: string;
  assignedUserIds: string[];
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export const DEFAULT_CONFIG: OnboardingConfig = {
  pilotName: '',
  contactPerson: '',
  customerBusinessDetails: '',
  brandColor: '#3b82f6',
  welcomeMessage: '',
  backgroundImage: '',
  fieldToggles: {
    contactPerson: true,
    welcomeMessage: true,
    backgroundImage: true,
    brandColor: true,
  },
};
