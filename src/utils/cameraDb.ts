import { nanoid } from 'nanoid';
import type { Camera, StoredCameraFrame } from '../types/camera';

interface CameraDatabase {
  cameras: Camera[];
  metadata: {
    version: string;
    lastUpdated: string;
    totalCameras: number;
  };
}

const CAMERAS_DB_KEY = 'cameras_db';

async function loadCamerasDatabase(): Promise<CameraDatabase> {
  try {
    const response = await fetch('/db/cameras.json');
    if (!response.ok) {
      throw new Error('Failed to load cameras database');
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading cameras from file:', error);
    return {
      cameras: [],
      metadata: {
        version: '1.0',
        lastUpdated: new Date().toISOString(),
        totalCameras: 0,
      },
    };
  }
}

function saveCamerasDatabase(db: CameraDatabase): void {
  db.metadata.lastUpdated = new Date().toISOString();
  db.metadata.totalCameras = db.cameras.length;
  sessionStorage.setItem(CAMERAS_DB_KEY, JSON.stringify(db));
}

async function getCamerasDatabase(): Promise<CameraDatabase> {
  const stored = sessionStorage.getItem(CAMERAS_DB_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  const db = await loadCamerasDatabase();
  saveCamerasDatabase(db);
  return db;
}

export async function createCamera(cameraData: Omit<Camera, 'id' | 'createdAt' | 'updatedAt'>): Promise<Camera> {
  const db = await getCamerasDatabase();
  
  const newCamera: Camera = {
    ...cameraData,
    id: nanoid(10),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  db.cameras.push(newCamera);
  saveCamerasDatabase(db);
  
  return newCamera;
}

export async function getCamerasByPilot(pilotId: string): Promise<Camera[]> {
  const db = await getCamerasDatabase();
  return db.cameras.filter(c => c.pilotId === pilotId);
}

export async function getCameraById(id: string): Promise<Camera | null> {
  const db = await getCamerasDatabase();
  return db.cameras.find(c => c.id === id) || null;
}

export async function updateCamera(id: string, updates: Partial<Camera>): Promise<Camera | null> {
  const db = await getCamerasDatabase();
  const index = db.cameras.findIndex(c => c.id === id);
  
  if (index === -1) return null;
  
  db.cameras[index] = {
    ...db.cameras[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  saveCamerasDatabase(db);
  return db.cameras[index];
}

export async function deleteCamera(id: string): Promise<boolean> {
  const db = await getCamerasDatabase();
  const initialLength = db.cameras.length;
  
  db.cameras = db.cameras.filter(c => c.id !== id);
  
  if (db.cameras.length < initialLength) {
    saveCamerasDatabase(db);
    return true;
  }
  
  return false;
}

export async function addFrameToCamera(cameraId: string, frame: Omit<StoredCameraFrame, 'id' | 'uploadedAt'>): Promise<Camera | null> {
  const db = await getCamerasDatabase();
  const camera = db.cameras.find(c => c.id === cameraId);
  
  if (!camera) return null;
  
  const newFrame: StoredCameraFrame = {
    ...frame,
    id: nanoid(10),
    uploadedAt: new Date().toISOString(),
  };
  
  camera.frames.push(newFrame);
  camera.updatedAt = new Date().toISOString();
  
  saveCamerasDatabase(db);
  return camera;
}

export async function removeFrameFromCamera(cameraId: string, frameId: string): Promise<Camera | null> {
  const db = await getCamerasDatabase();
  const camera = db.cameras.find(c => c.id === cameraId);
  
  if (!camera) return null;
  
  camera.frames = camera.frames.filter(f => f.id !== frameId);
  camera.updatedAt = new Date().toISOString();
  
  saveCamerasDatabase(db);
  return camera;
}

export async function setPrimaryFrame(cameraId: string, frameId: string): Promise<Camera | null> {
  const db = await getCamerasDatabase();
  const camera = db.cameras.find(c => c.id === cameraId);
  
  if (!camera) return null;
  
  // Set all frames to non-primary
  camera.frames.forEach(f => f.isPrimary = false);
  
  // Set selected frame as primary
  const frame = camera.frames.find(f => f.id === frameId);
  if (frame) {
    frame.isPrimary = true;
  }
  
  camera.updatedAt = new Date().toISOString();
  
  saveCamerasDatabase(db);
  return camera;
}
