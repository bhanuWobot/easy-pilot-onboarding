export interface CameraFrame {
  id: string;
  file: File;
  preview: string;
  location: string;
}

export type CameraCount = 'less-than-5' | '5-to-10' | '11-to-20' | '21-to-50' | 'more-than-50';

export interface CameraLocation {
  id: string;
  label: string;
}

export interface CameraDetails {
  hasCameras: boolean | null; // null = not answered yet, true = installed, false = planning
  cameraCount: CameraCount | null;
  canProvideFrames: boolean | null;
  frames: CameraFrame[];
  plannedLocations: CameraLocation[]; // For users planning to install cameras
}

// New types for pilot camera management
export type CameraStatus = 'planned' | 'installed' | 'configured' | 'active' | 'issue';

export interface StoredCameraFrame {
  id: string;
  fileName: string;
  fileUrl: string; // Base64 encoded image
  fileSize: number;
  uploadedAt: string;
  isPrimary: boolean;
}

export interface Camera {
  id: string;
  pilotId: string;
  locationId: string; // Location ID reference
  name: string;
  location: string; // Deprecated - kept for backward compatibility
  frames: StoredCameraFrame[];
  make?: string;
  model?: string;
  serialNumber?: string;
  ipAddress?: string;
  status: CameraStatus;
  installationDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export const DEFAULT_CAMERA_DETAILS: CameraDetails = {
  hasCameras: null,
  cameraCount: null,
  canProvideFrames: null,
  frames: [],
  plannedLocations: [],
};

export const CAMERA_COUNT_OPTIONS = [
  { value: 'less-than-5' as CameraCount, label: 'Less than 5', min: 1, max: 4 },
  { value: '5-to-10' as CameraCount, label: '5 - 10', min: 5, max: 10 },
  { value: '11-to-20' as CameraCount, label: '11 - 20', min: 11, max: 20 },
  { value: '21-to-50' as CameraCount, label: '21 - 50', min: 21, max: 50 },
  { value: 'more-than-50' as CameraCount, label: '50+', min: 50, max: 999 },
];

export const MAX_FRAMES = 64;

/**
 * Get status badge styling for camera status
 */
export function getCameraStatusBadgeStyle(status: CameraStatus): string {
  switch (status) {
    case 'planned':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'installed':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'configured':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'active':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'issue':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

/**
 * Get status display text
 */
export function getCameraStatusDisplayText(status: CameraStatus): string {
  switch (status) {
    case 'planned':
      return 'Planned';
    case 'installed':
      return 'Installed';
    case 'configured':
      return 'Configured';
    case 'active':
      return 'Active';
    case 'issue':
      return 'Issue';
    default:
      return status;
  }
}
