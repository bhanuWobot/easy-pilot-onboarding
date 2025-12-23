import { nanoid } from 'nanoid';
import type { Remark } from '../types/remark';

interface RemarkDatabase {
  remarks: Remark[];
  metadata: {
    version: string;
    lastUpdated: string;
    totalRemarks: number;
  };
}

const REMARKS_DB_KEY = 'remarks_db';

async function loadRemarksDatabase(): Promise<RemarkDatabase> {
  try {
    const response = await fetch('/db/remarks.json');
    if (!response.ok) {
      throw new Error('Failed to load remarks database');
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading remarks from file:', error);
    return {
      remarks: [],
      metadata: {
        version: '1.0',
        lastUpdated: new Date().toISOString(),
        totalRemarks: 0,
      },
    };
  }
}

async function getRemarksDatabase(): Promise<RemarkDatabase> {
  const stored = sessionStorage.getItem(REMARKS_DB_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  const db = await loadRemarksDatabase();
  saveRemarksDatabase(db);
  return db;
}

function saveRemarksDatabase(db: RemarkDatabase): void {
  db.metadata.lastUpdated = new Date().toISOString();
  db.metadata.totalRemarks = db.remarks.length;
  sessionStorage.setItem(REMARKS_DB_KEY, JSON.stringify(db));
}

export async function createRemark(remarkData: Omit<Remark, 'id' | 'createdAt' | 'isEdited'>): Promise<Remark> {
  const db = await getRemarksDatabase();
  
  const newRemark: Remark = {
    ...remarkData,
    id: nanoid(10),
    createdAt: new Date().toISOString(),
    isEdited: false,
  };
  
  db.remarks.push(newRemark);
  saveRemarksDatabase(db);
  
  return newRemark;
}

export async function getRemarksByPilot(pilotId: string): Promise<Remark[]> {
  const db = await getRemarksDatabase();
  return db.remarks
    .filter(r => r.pilotId === pilotId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function updateRemark(id: string, text: string): Promise<Remark | null> {
  const db = await getRemarksDatabase();
  const index = db.remarks.findIndex(r => r.id === id);
  
  if (index === -1) return null;
  
  db.remarks[index] = {
    ...db.remarks[index],
    text,
    updatedAt: new Date().toISOString(),
    isEdited: true,
  };
  
  saveRemarksDatabase(db);
  return db.remarks[index];
}

export async function deleteRemark(id: string): Promise<boolean> {
  const db = await getRemarksDatabase();
  const initialLength = db.remarks.length;
  
  db.remarks = db.remarks.filter(r => r.id !== id);
  
  if (db.remarks.length < initialLength) {
    saveRemarksDatabase(db);
    return true;
  }
  
  return false;
}
