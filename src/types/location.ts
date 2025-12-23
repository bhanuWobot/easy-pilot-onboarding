/**
 * Location types for pilot locations
 */

export interface Location {
  id: string;
  name: string; // Location name (e.g., "Downtown Store", "Factory Floor 2")
  cityRegion: string; // City/Region (e.g., "Mumbai, Maharashtra")
  cameraCount: string; // Camera count (e.g., "11-to-20")
  status: 'active' | 'inactive' | 'planned';
  createdAt: string;
  updatedAt: string;
}

export type CreateLocationData = Omit<Location, 'id' | 'createdAt' | 'updatedAt'>;
