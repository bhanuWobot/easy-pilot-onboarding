import { nanoid } from 'nanoid';
import type { Objective } from '../types/objective';
import { createRemark } from './remarkDb';

interface ObjectiveDatabase {
  objectives: Objective[];
  metadata: {
    version: string;
    lastUpdated: string;
    totalObjectives: number;
  };
}

const OBJECTIVES_DB_KEY = 'objectives_db';

async function getObjectivesDatabase(): Promise<ObjectiveDatabase> {
  const stored = localStorage.getItem(OBJECTIVES_DB_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  return {
    objectives: [],
    metadata: {
      version: '1.0',
      lastUpdated: new Date().toISOString(),
      totalObjectives: 0,
    },
  };
}

function saveObjectivesDatabase(db: ObjectiveDatabase): void {
  db.metadata.lastUpdated = new Date().toISOString();
  db.metadata.totalObjectives = db.objectives.length;
  localStorage.setItem(OBJECTIVES_DB_KEY, JSON.stringify(db));
}

export async function createObjective(objectiveData: Omit<Objective, 'id' | 'createdAt' | 'updatedAt' | 'order'>): Promise<Objective> {
  const db = await getObjectivesDatabase();
  
  const maxOrder = db.objectives
    .filter(o => o.pilotId === objectiveData.pilotId)
    .reduce((max, o) => Math.max(max, o.order), -1);
  
  const newObjective: Objective = {
    ...objectiveData,
    id: nanoid(10),
    order: maxOrder + 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  db.objectives.push(newObjective);
  saveObjectivesDatabase(db);
  
  // Create activity log
  await createRemark({
    pilotId: objectiveData.pilotId,
    text: `Added objective: "${objectiveData.title}"`,
    type: 'activity',
    isSystem: true,
    relatedTo: {
      type: 'objective',
      id: newObjective.id,
      name: objectiveData.title,
    },
    createdBy: objectiveData.createdBy,
  });
  
  return newObjective;
}

export async function getObjectivesByPilot(pilotId: string): Promise<Objective[]> {
  const db = await getObjectivesDatabase();
  return db.objectives
    .filter(o => o.pilotId === pilotId)
    .sort((a, b) => a.order - b.order);
}

export async function updateObjective(id: string, updates: Partial<Objective>, userId: string): Promise<Objective | null> {
  const db = await getObjectivesDatabase();
  const index = db.objectives.findIndex(o => o.id === id);
  
  if (index === -1) return null;
  
  const oldObjective = db.objectives[index];
  
  db.objectives[index] = {
    ...oldObjective,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  saveObjectivesDatabase(db);
  
  // Create activity log for status changes
  if (updates.status && updates.status !== oldObjective.status) {
    await createRemark({
      pilotId: oldObjective.pilotId,
      text: `Updated objective "${oldObjective.title}" status to ${updates.status}`,
      type: 'activity',
      isSystem: true,
      relatedTo: {
        type: 'objective',
        id: oldObjective.id,
        name: oldObjective.title,
      },
      createdBy: userId,
    });
  }
  
  return db.objectives[index];
}

export async function deleteObjective(id: string, userId: string): Promise<boolean> {
  const db = await getObjectivesDatabase();
  const objective = db.objectives.find(o => o.id === id);
  
  if (!objective) return false;
  
  db.objectives = db.objectives.filter(o => o.id !== id);
  saveObjectivesDatabase(db);
  
  // Create activity log
  await createRemark({
    pilotId: objective.pilotId,
    text: `Removed objective: "${objective.title}"`,
    type: 'activity',
    isSystem: true,
    createdBy: userId,
  });
  
  return true;
}

export async function reorderObjectives(pilotId: string, objectiveIds: string[]): Promise<void> {
  const db = await getObjectivesDatabase();
  
  objectiveIds.forEach((id, index) => {
    const objective = db.objectives.find(o => o.id === id && o.pilotId === pilotId);
    if (objective) {
      objective.order = index;
      objective.updatedAt = new Date().toISOString();
    }
  });
  
  saveObjectivesDatabase(db);
}

export function calculatePilotProgress(objectives: Objective[]): number {
  if (objectives.length === 0) return 0;
  
  const completedCount = objectives.filter(o => o.status === 'completed').length;
  return Math.round((completedCount / objectives.length) * 100);
}

export function calculatePilotStatus(progress: number): 'draft' | 'active' | 'completed' {
  if (progress === 100) return 'completed';
  if (progress >= 25) return 'active';
  return 'draft';
}
