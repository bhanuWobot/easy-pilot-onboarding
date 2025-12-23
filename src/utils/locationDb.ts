/**
 * Location Database Operations
 * CRUD operations for pilot locations
 */

import { nanoid } from 'nanoid';
import type { Location, CreateLocationData } from '../types/location';

const LOCATIONS_STORAGE_KEY = 'pilot_locations_db';

interface LocationsDatabase {
  locations: Location[];
  metadata: {
    version: string;
    lastUpdated: string;
    totalLocations: number;
  };
}

/**
 * Load locations from JSON file
 */
async function loadLocationsDatabase(): Promise<LocationsDatabase> {
  try {
    const response = await fetch('/db/locations.json');
    if (!response.ok) {
      throw new Error('Failed to load locations database');
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading locations from file:', error);
    return {
      locations: [],
      metadata: {
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        totalLocations: 0,
      },
    };
  }
}

/**
 * Get locations database
 */
async function getLocationsDatabase(): Promise<LocationsDatabase> {
  try {
    const data = sessionStorage.getItem(LOCATIONS_STORAGE_KEY);
    if (!data) {
      const initialDb = await loadLocationsDatabase();
      sessionStorage.setItem(LOCATIONS_STORAGE_KEY, JSON.stringify(initialDb));
      return initialDb;
    }
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading locations database:', error);
    throw new Error('Failed to read locations database');
  }
}

/**
 * Save locations database
 */
function saveLocationsDatabase(db: LocationsDatabase): void {
  try {
    db.metadata.lastUpdated = new Date().toISOString();
    sessionStorage.setItem(LOCATIONS_STORAGE_KEY, JSON.stringify(db));
  } catch (error) {
    console.error('Error saving locations database:', error);
    throw new Error('Failed to save locations database');
  }
}

/**
 * Create a new location
 */
export async function createLocation(locationData: CreateLocationData): Promise<Location> {
  try {
    const db = await getLocationsDatabase();

    const newLocation: Location = {
      id: nanoid(10),
      ...locationData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.locations.push(newLocation);
    db.metadata.totalLocations = db.locations.length;

    saveLocationsDatabase(db);

    return newLocation;
  } catch (error) {
    console.error('Error creating location:', error);
    throw new Error('Failed to create location');
  }
}

/**
 * Create multiple locations in batch
 */
export async function createLocations(locationsData: CreateLocationData[]): Promise<Location[]> {
  try {
    const db = await getLocationsDatabase();
    
    const newLocations = locationsData.map(locationData => ({
      id: nanoid(10),
      ...locationData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    db.locations.push(...newLocations);
    db.metadata.totalLocations = db.locations.length;

    saveLocationsDatabase(db);

    return newLocations;
  } catch (error) {
    console.error('Error creating locations:', error);
    throw new Error('Failed to create locations');
  }
}

/**
 * Get location by ID
 */
export async function getLocationById(id: string): Promise<Location | null> {
  try {
    const db = await getLocationsDatabase();
    return db.locations.find((loc) => loc.id === id) || null;
  } catch (error) {
    console.error('Error getting location:', error);
    return null;
  }
}

/**
 * Get multiple locations by IDs
 */
export async function getLocationsByIds(ids: string[]): Promise<Location[]> {
  try {
    const db = await getLocationsDatabase();
    return db.locations.filter((loc) => ids.includes(loc.id));
  } catch (error) {
    console.error('Error getting locations:', error);
    return [];
  }
}

/**
 * Get all locations
 */
export async function getAllLocations(): Promise<Location[]> {
  try {
    const db = await getLocationsDatabase();
    return db.locations;
  } catch (error) {
    console.error('Error getting all locations:', error);
    return [];
  }
}

/**
 * Update a location
 */
export async function updateLocation(
  id: string,
  updates: Partial<Omit<Location, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<Location | null> {
  try {
    const db = await getLocationsDatabase();
    const index = db.locations.findIndex((loc) => loc.id === id);

    if (index === -1) {
      return null;
    }

    db.locations[index] = {
      ...db.locations[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    saveLocationsDatabase(db);

    return db.locations[index];
  } catch (error) {
    console.error('Error updating location:', error);
    throw new Error('Failed to update location');
  }
}

/**
 * Delete a location
 */
export async function deleteLocation(id: string): Promise<boolean> {
  try {
    const db = await getLocationsDatabase();
    const initialLength = db.locations.length;

    db.locations = db.locations.filter((loc) => loc.id !== id);

    if (db.locations.length === initialLength) {
      return false;
    }

    db.metadata.totalLocations = db.locations.length;
    saveLocationsDatabase(db);

    return true;
  } catch (error) {
    console.error('Error deleting location:', error);
    throw new Error('Failed to delete location');
  }
}

/**
 * Delete multiple locations
 */
export async function deleteLocations(ids: string[]): Promise<number> {
  try {
    const db = await getLocationsDatabase();
    const initialLength = db.locations.length;

    db.locations = db.locations.filter((loc) => !ids.includes(loc.id));

    const deletedCount = initialLength - db.locations.length;

    if (deletedCount > 0) {
      db.metadata.totalLocations = db.locations.length;
      saveLocationsDatabase(db);
    }

    return deletedCount;
  } catch (error) {
    console.error('Error deleting locations:', error);
    throw new Error('Failed to delete locations');
  }
}
