/**
 * JSON Database Utility Functions
 * Simulates a backend database using JSON file storage
 */

import type { PilotRecord } from '../types/onboarding';
import type { Customer } from '../types/customer';
import { nanoid } from 'nanoid';
import { createCustomer, getCustomerByEmail } from './customerDb';

export interface DatabaseSchema {
  pilots: PilotRecord[];
  metadata: {
    version: string;
    lastUpdated: string;
    totalPilots: number;
  };
}

/**
 * Validation error interface
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate pilot data
 */
function validatePilotData(data: Partial<PilotRecord>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.name || data.name.trim() === '') {
    errors.push({ field: 'name', message: 'Pilot name is required' });
  }

  if (!data.company || data.company.trim() === '') {
    errors.push({ field: 'company', message: 'Company name is required' });
  }

  if (!data.contactEmail || data.contactEmail.trim() === '') {
    errors.push({ field: 'contactEmail', message: 'Contact email is required' });
  } else if (!isValidEmail(data.contactEmail)) {
    errors.push({ field: 'contactEmail', message: 'Invalid email format' });
  }

  if (!data.locationName || data.locationName.trim() === '') {
    errors.push({ field: 'locationName', message: 'Location name is required' });
  }

  return errors;
}

const DB_URL = '/db/pilots.json';

/**
 * Load database from JSON file
 */
async function loadDatabase(): Promise<DatabaseSchema> {
  try {
    const response = await fetch(DB_URL);
    if (!response.ok) {
      throw new Error('Failed to load database');
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading database:', error);
    // Return empty database structure if file doesn't exist
    return {
      pilots: [],
      metadata: {
        version: '1.0',
        lastUpdated: new Date().toISOString(),
        totalPilots: 0,
      },
    };
  }
}

/**
 * Save database to localStorage (simulating file write)
 * In a real backend, this would write to the file system or database
 */
function saveDatabase(db: DatabaseSchema): void {
  try {
    localStorage.setItem('pilots_db', JSON.stringify(db));
    console.log('Database saved to localStorage');
  } catch (error) {
    console.error('Error saving database:', error);
    throw new Error('Failed to save database');
  }
}

/**
 * Load database from localStorage or fetch from file
 */
async function getDatabase(): Promise<DatabaseSchema> {
  // Try localStorage first (for persistence across sessions)
  const cached = localStorage.getItem('pilots_db');
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (error) {
      console.warn('Invalid cached database, loading from file');
    }
  }
  
  // Load from file if no valid cache
  const db = await loadDatabase();
  saveDatabase(db); // Cache it
  return db;
}

/**
 * Create a new pilot record with customer relationship
 */
export async function createPilot(
  pilotData: Omit<PilotRecord, 'id' | 'createdAt' | 'updatedAt'>,
  customerData?: Omit<Customer, 'id' | 'createdAt'>
): Promise<{ pilot: PilotRecord; customer?: Customer; errors?: ValidationError[] }> {
  try {
    // Validate pilot data
    const errors = validatePilotData(pilotData);
    if (errors.length > 0) {
      return { pilot: {} as PilotRecord, errors };
    }

    let customerId = pilotData.customerId;
    let customer: Customer | undefined;

    // Handle customer creation or lookup
    if (customerData) {
      // Check if customer already exists by email
      const existingCustomer = await getCustomerByEmail(customerData.email);
      if (existingCustomer) {
        customerId = existingCustomer.id;
        customer = existingCustomer;
      } else {
        // Create new customer
        customer = await createCustomer(customerData);
        customerId = customer.id;
      }
    }

    const db = await getDatabase();
    
    const newPilot: PilotRecord = {
      ...pilotData,
      customerId,
      id: nanoid(10),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    db.pilots.push(newPilot);
    db.metadata.totalPilots = db.pilots.length;
    db.metadata.lastUpdated = new Date().toISOString();
    
    saveDatabase(db);
    
    return { pilot: newPilot, customer };
  } catch (error) {
    console.error('Error creating pilot:', error);
    throw new Error('Failed to create pilot');
  }
}

/**
 * Get pilot by ID
 */
export async function getPilotById(id: string): Promise<PilotRecord | null> {
  try {
    const db = await getDatabase();
    const pilot = db.pilots.find((p) => p.id === id);
    return pilot || null;
  } catch (error) {
    console.error('Error getting pilot:', error);
    return null;
  }
}

/**
 * Get all pilots
 */
export async function getAllPilots(): Promise<PilotRecord[]> {
  try {
    const db = await getDatabase();
    return db.pilots;
  } catch (error) {
    console.error('Error getting all pilots:', error);
    return [];
  }
}

/**
 * Update pilot by ID
 */
export async function updatePilot(
  id: string,
  updates: Partial<PilotRecord>
): Promise<PilotRecord | null> {
  try {
    const db = await getDatabase();
    const index = db.pilots.findIndex((p) => p.id === id);
    
    if (index === -1) {
      return null;
    }
    
    db.pilots[index] = {
      ...db.pilots[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    db.metadata.lastUpdated = new Date().toISOString();
    saveDatabase(db);
    
    return db.pilots[index];
  } catch (error) {
    console.error('Error updating pilot:', error);
    throw new Error('Failed to update pilot');
  }
}

/**
 * Delete pilot by ID
 */
export async function deletePilot(id: string): Promise<boolean> {
  try {
    const db = await getDatabase();
    const index = db.pilots.findIndex((p) => p.id === id);
    
    if (index === -1) {
      return false;
    }
    
    db.pilots.splice(index, 1);
    db.metadata.totalPilots = db.pilots.length;
    db.metadata.lastUpdated = new Date().toISOString();
    
    saveDatabase(db);
    
    return true;
  } catch (error) {
    console.error('Error deleting pilot:', error);
    throw new Error('Failed to delete pilot');
  }
}

/**
 * Get pilots by user ID (assigned users)
 */
export async function getPilotsByUser(userId: string): Promise<PilotRecord[]> {
  try {
    const db = await getDatabase();
    return db.pilots.filter((p) => 
      p.createdBy === userId || p.assignedUserIds?.includes(userId)
    );
  } catch (error) {
    console.error('Error getting pilots by user:', error);
    return [];
  }
}

/**
 * Get pilots by customer ID
 */
export async function getPilotsByCustomer(customerId: string): Promise<PilotRecord[]> {
  try {
    const db = await getDatabase();
    return db.pilots.filter((p) => p.customerId === customerId);
  } catch (error) {
    console.error('Error getting pilots by customer:', error);
    return [];
  }
}

/**
 * Generate shareable link for a pilot
 */
export function generatePilotLink(pilotId: string): string {
  return `${window.location.origin}/welcome/${pilotId}`;
}
