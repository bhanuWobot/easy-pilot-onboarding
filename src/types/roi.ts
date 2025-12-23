/**
 * ROI (Region of Interest) type definitions for camera frame annotations
 * Supports multiple drawing shapes with profile-based organization
 */

export type ROIShapeType = 'rectangle' | 'circle' | 'polygon' | 'line' | 'arrow';

export type ROIColor = 
  | '#3B82F6' // Blue
  | '#EF4444' // Red
  | '#10B981' // Green
  | '#F59E0B' // Amber
  | '#8B5CF6' // Purple
  | '#EC4899' // Pink
  | '#14B8A6' // Teal
  | '#F97316' // Orange
  | '#6366F1' // Indigo
  | '#84CC16'; // Lime

export const ROI_COLORS: ROIColor[] = [
  '#3B82F6',
  '#EF4444',
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899',
  '#14B8A6',
  '#F97316',
  '#6366F1',
  '#84CC16',
];

/**
 * Individual drawing shape within an ROI profile
 * Coordinates stored as percentages (0-100) of frame dimensions
 */
export interface ROIDrawing {
  id: string; // nanoid(10)
  type: ROIShapeType;
  coordinates: number[]; // Format depends on type
  color: ROIColor; // Each shape can have its own color
  comment?: string; // Optional annotation
  createdAt: string;
  updatedAt: string;
}

/**
 * Coordinate formats by shape type:
 * - rectangle: [x%, y%, width%, height%]
 * - circle: [centerX%, centerY%, radius%]
 * - polygon: [x1%, y1%, x2%, y2%, ..., xn%, yn%]
 * - line: [x1%, y1%, x2%, y2%]
 * - arrow: [x1%, y1%, x2%, y2%] (with arrowhead at x2,y2)
 */

/**
 * ROI Profile - Named collection of shapes for a specific objective-camera pair
 * Examples: "planned", "setup", "execution", "maintenance"
 */
export interface ROIProfile {
  id: string; // nanoid(10)
  objectiveId: string;
  cameraId: string;
  name: string; // Profile name (e.g., "planned", "setup")
  color: ROIColor; // Auto-assigned from palette
  shapes: ROIDrawing[]; // Array of drawings in this profile
  visible: boolean; // Toggle visibility
  createdBy: string; // User email
  createdAt: string;
  updatedAt: string;
}

/**
 * Database structure for ROI storage
 */
export interface ROIDatabase {
  profiles: ROIProfile[];
  metadata: {
    version: string;
    lastUpdated: string;
    totalProfiles: number;
  };
}

/**
 * Helper type for creating new profiles
 */
export type CreateROIProfileData = {
  objectiveId: string;
  cameraId: string;
  name: string;
  createdBy: string;
};

/**
 * Helper type for creating new drawings
 */
export type CreateROIDrawingData = {
  type: ROIShapeType;
  coordinates: number[];
  color: ROIColor;
  comment?: string;
};

/**
 * Helper to get the next available color for a profile
 */
export function getNextAvailableColor(existingProfiles: ROIProfile[]): ROIColor {
  const usedColors = new Set(existingProfiles.map(p => p.color));
  return ROI_COLORS.find(color => !usedColors.has(color)) || ROI_COLORS[0];
}

/**
 * Helper to validate coordinate ranges (should be 0-100)
 */
export function validateCoordinates(coordinates: number[]): boolean {
  return coordinates.every(coord => coord >= 0 && coord <= 100);
}

/**
 * Helper to get display name for shape type
 */
export function getShapeDisplayName(type: ROIShapeType): string {
  const names: Record<ROIShapeType, string> = {
    rectangle: 'Rectangle',
    circle: 'Circle',
    polygon: 'Polygon',
    line: 'Line',
    arrow: 'Arrow',
  };
  return names[type];
}
