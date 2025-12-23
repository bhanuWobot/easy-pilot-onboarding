/**
 * ROI Database - CRUD operations for ROI profiles and drawings
 * Storage: localStorage with key 'roi_db'
 */

import { nanoid } from 'nanoid';
import type {
  ROIProfile,
  ROIDatabase,
  CreateROIProfileData,
  CreateROIDrawingData,
  ROIDrawing,
} from '../types/roi';
import { getNextAvailableColor, validateCoordinates } from '../types/roi';

const DB_KEY = 'roi_db';
const DB_VERSION = '1.0.0';
const MAX_PROFILES_PER_OBJECTIVE_CAMERA = 10;

/**
 * Initialize database if it doesn't exist
 */
function initDatabase(): ROIDatabase {
  return {
    profiles: [],
    metadata: {
      version: DB_VERSION,
      lastUpdated: new Date().toISOString(),
      totalProfiles: 0,
    },
  };
}

/**
 * Get database from localStorage
 */
async function getDatabase(): Promise<ROIDatabase> {
  try {
    const data = localStorage.getItem(DB_KEY);
    if (!data) {
      const db = initDatabase();
      saveDatabase(db);
      return db;
    }
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading ROI database:', error);
    return initDatabase();
  }
}

/**
 * Save database to localStorage
 */
function saveDatabase(db: ROIDatabase): void {
  db.metadata.lastUpdated = new Date().toISOString();
  db.metadata.totalProfiles = db.profiles.length;
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

/**
 * Create new ROI profile
 * @throws Error if profile limit reached (10 per objective-camera)
 */
export async function createROIProfile(
  data: CreateROIProfileData
): Promise<ROIProfile> {
  const db = await getDatabase();

  // Check profile limit per objective-camera pair
  const existingProfiles = db.profiles.filter(
    p => p.objectiveId === data.objectiveId && p.cameraId === data.cameraId
  );

  if (existingProfiles.length >= MAX_PROFILES_PER_OBJECTIVE_CAMERA) {
    throw new Error(
      `Maximum ${MAX_PROFILES_PER_OBJECTIVE_CAMERA} ROI profiles allowed per objective-camera pair`
    );
  }

  // Check for duplicate profile name
  const duplicateName = existingProfiles.find(
    p => p.name.toLowerCase() === data.name.toLowerCase()
  );
  if (duplicateName) {
    throw new Error(`Profile name "${data.name}" already exists for this camera`);
  }

  // Auto-assign color
  const color = getNextAvailableColor(existingProfiles);

  const newProfile: ROIProfile = {
    id: nanoid(10),
    objectiveId: data.objectiveId,
    cameraId: data.cameraId,
    name: data.name,
    color,
    shapes: [],
    visible: true,
    createdBy: data.createdBy,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.profiles.push(newProfile);
  saveDatabase(db);

  // Log activity
  try {
    // Get pilot ID from objective (will need to fetch objective)
    // For now, we'll skip activity logging here and do it in the component
    // where we have access to the pilotId
  } catch (error) {
    console.error('Error logging ROI profile creation:', error);
  }

  return newProfile;
}

/**
 * Get all ROI profiles for a specific objective-camera pair
 */
export async function getROIProfilesByObjectiveCamera(
  objectiveId: string,
  cameraId: string
): Promise<ROIProfile[]> {
  const db = await getDatabase();
  return db.profiles.filter(
    p => p.objectiveId === objectiveId && p.cameraId === cameraId
  );
}

/**
 * Get all ROI profiles for an objective (across all cameras)
 */
export async function getROIProfilesByObjective(
  objectiveId: string
): Promise<ROIProfile[]> {
  const db = await getDatabase();
  return db.profiles.filter(p => p.objectiveId === objectiveId);
}

/**
 * Get ROI profile by ID
 */
export async function getROIProfileById(
  profileId: string
): Promise<ROIProfile | null> {
  const db = await getDatabase();
  return db.profiles.find(p => p.id === profileId) || null;
}

/**
 * Update ROI profile
 */
export async function updateROIProfile(
  profileId: string,
  updates: Partial<Omit<ROIProfile, 'id' | 'createdAt' | 'createdBy'>>
): Promise<ROIProfile | null> {
  const db = await getDatabase();
  const index = db.profiles.findIndex(p => p.id === profileId);

  if (index === -1) return null;

  db.profiles[index] = {
    ...db.profiles[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  saveDatabase(db);
  return db.profiles[index];
}

/**
 * Delete ROI profile
 */
export async function deleteROIProfile(profileId: string): Promise<boolean> {
  const db = await getDatabase();
  const initialLength = db.profiles.length;
  db.profiles = db.profiles.filter(p => p.id !== profileId);

  if (db.profiles.length < initialLength) {
    saveDatabase(db);
    return true;
  }

  return false;
}

/**
 * Delete all ROI profiles for a camera (cascade delete when camera is removed)
 */
export async function deleteROIProfilesByCamera(cameraId: string): Promise<number> {
  const db = await getDatabase();
  const initialLength = db.profiles.length;
  db.profiles = db.profiles.filter(p => p.cameraId !== cameraId);

  const deletedCount = initialLength - db.profiles.length;
  if (deletedCount > 0) {
    saveDatabase(db);
  }

  return deletedCount;
}

/**
 * Delete all ROI profiles for an objective (cascade delete when objective is removed)
 */
export async function deleteROIProfilesByObjective(
  objectiveId: string
): Promise<number> {
  const db = await getDatabase();
  const initialLength = db.profiles.length;
  db.profiles = db.profiles.filter(p => p.objectiveId !== objectiveId);

  const deletedCount = initialLength - db.profiles.length;
  if (deletedCount > 0) {
    saveDatabase(db);
  }

  return deletedCount;
}

// ==================== DRAWING OPERATIONS ====================

/**
 * Add drawing shape to ROI profile
 */
export async function addDrawingToProfile(
  profileId: string,
  drawingData: CreateROIDrawingData
): Promise<ROIDrawing | null> {
  // Validate coordinates
  if (!validateCoordinates(drawingData.coordinates)) {
    throw new Error('Invalid coordinates: must be between 0 and 100');
  }

  const db = await getDatabase();
  const profileIndex = db.profiles.findIndex(p => p.id === profileId);

  if (profileIndex === -1) return null;

  const newDrawing: ROIDrawing = {
    id: nanoid(10),
    type: drawingData.type,
    coordinates: drawingData.coordinates,
    color: drawingData.color,
    comment: drawingData.comment,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.profiles[profileIndex].shapes.push(newDrawing);
  db.profiles[profileIndex].updatedAt = new Date().toISOString();

  saveDatabase(db);
  return newDrawing;
}

/**
 * Update drawing shape in ROI profile
 */
export async function updateDrawing(
  profileId: string,
  drawingId: string,
  updates: Partial<Omit<ROIDrawing, 'id' | 'createdAt'>>
): Promise<ROIDrawing | null> {
  // Validate coordinates if provided
  if (updates.coordinates && !validateCoordinates(updates.coordinates)) {
    throw new Error('Invalid coordinates: must be between 0 and 100');
  }

  const db = await getDatabase();
  const profileIndex = db.profiles.findIndex(p => p.id === profileId);

  if (profileIndex === -1) return null;

  const profile = db.profiles[profileIndex];
  const drawingIndex = profile.shapes.findIndex(d => d.id === drawingId);

  if (drawingIndex === -1) return null;

  profile.shapes[drawingIndex] = {
    ...profile.shapes[drawingIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  profile.updatedAt = new Date().toISOString();
  saveDatabase(db);

  return profile.shapes[drawingIndex];
}

/**
 * Delete drawing shape from ROI profile
 */
export async function deleteDrawing(
  profileId: string,
  drawingId: string
): Promise<boolean> {
  const db = await getDatabase();
  const profileIndex = db.profiles.findIndex(p => p.id === profileId);

  if (profileIndex === -1) return false;

  const profile = db.profiles[profileIndex];
  const initialLength = profile.shapes.length;
  profile.shapes = profile.shapes.filter(d => d.id !== drawingId);

  if (profile.shapes.length < initialLength) {
    profile.updatedAt = new Date().toISOString();
    saveDatabase(db);
    return true;
  }

  return false;
}

/**
 * Toggle ROI profile visibility
 */
export async function toggleProfileVisibility(
  profileId: string
): Promise<ROIProfile | null> {
  const db = await getDatabase();
  const profileIndex = db.profiles.findIndex(p => p.id === profileId);

  if (profileIndex === -1) return null;

  db.profiles[profileIndex].visible = !db.profiles[profileIndex].visible;
  db.profiles[profileIndex].updatedAt = new Date().toISOString();

  saveDatabase(db);
  return db.profiles[profileIndex];
}

/**
 * Set visibility for multiple profiles
 */
export async function setProfilesVisibility(
  profileIds: string[],
  visible: boolean
): Promise<void> {
  const db = await getDatabase();
  
  db.profiles.forEach(profile => {
    if (profileIds.includes(profile.id)) {
      profile.visible = visible;
      profile.updatedAt = new Date().toISOString();
    }
  });

  saveDatabase(db);
}

/**
 * Get profile count for objective-camera pair
 */
export async function getProfileCount(
  objectiveId: string,
  cameraId: string
): Promise<number> {
  const db = await getDatabase();
  return db.profiles.filter(
    p => p.objectiveId === objectiveId && p.cameraId === cameraId
  ).length;
}

/**
 * Check if profile limit is reached
 */
export async function isProfileLimitReached(
  objectiveId: string,
  cameraId: string
): Promise<boolean> {
  const count = await getProfileCount(objectiveId, cameraId);
  return count >= MAX_PROFILES_PER_OBJECTIVE_CAMERA;
}
