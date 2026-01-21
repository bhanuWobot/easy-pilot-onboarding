import { nanoid } from 'nanoid';
import type { ChecklistItem, ChecklistComment, CreateChecklistCommentData } from '../types/checklist';
import { createRemark } from './remarkDb';

const CHECKLIST_DB_KEY = 'checklists_db';
const COMMENTS_DB_KEY = 'checklist_comments_db';

// Initialize database with sample data if empty
export async function initChecklistDatabase(): Promise<void> {
  console.log('Initializing checklist database...');
  
  // FORCE RELOAD: Clear old data to load new data from JSON files
  localStorage.removeItem(CHECKLIST_DB_KEY);
  localStorage.removeItem(COMMENTS_DB_KEY);
  
  const checklists = localStorage.getItem(CHECKLIST_DB_KEY);
  const comments = localStorage.getItem(COMMENTS_DB_KEY);
  console.log('Existing checklists in localStorage:', checklists ? 'Found' : 'Not found');
  console.log('Existing comments in localStorage:', comments ? 'Found' : 'Not found');

  if (!checklists) {
    console.log('Fetching checklists from /db/checklists.json...');
    const response = await fetch('/db/checklists.json');
    const data = await response.json();
    console.log('Fetched checklists data:', data);
    localStorage.setItem(CHECKLIST_DB_KEY, JSON.stringify(data));
    console.log('Saved checklists to localStorage');
  }

  if (!comments) {
    console.log('Fetching comments from /db/checklist_comments.json...');
    const response = await fetch('/db/checklist_comments.json');
    const data = await response.json();
    console.log('Fetched comments data:', data);
    localStorage.setItem(COMMENTS_DB_KEY, JSON.stringify(data));
    console.log('Saved comments to localStorage');
  }
  
  console.log('Checklist database initialization complete');
}

// Checklist CRUD operations
export async function getChecklistsByObjective(objectiveId: string): Promise<ChecklistItem[]> {
  const raw = localStorage.getItem(CHECKLIST_DB_KEY);
  console.log('Raw checklist data from localStorage:', raw);
  const checklists = JSON.parse(raw || '[]') as ChecklistItem[];
  console.log('Parsed checklists:', checklists);
  console.log('Filtering for objectiveId:', objectiveId);
  const filtered = checklists.filter(c => c.objectiveId === objectiveId);
  console.log('Filtered checklists:', filtered);
  return filtered;
}

export async function createChecklist(
  objectiveId: string,
  title: string,
  description: string,
  type: 'regular' | 'ai',
  userId: string
): Promise<ChecklistItem> {
  const checklists = JSON.parse(localStorage.getItem(CHECKLIST_DB_KEY) || '[]') as ChecklistItem[];
  
  const newChecklist: ChecklistItem = {
    id: nanoid(10),
    objectiveId,
    title,
    description,
    completed: false,
    type,
    order: checklists.filter(c => c.objectiveId === objectiveId).length,
    createdAt: new Date().toISOString(),
    createdBy: userId,
    comments: [],
  };

  checklists.push(newChecklist);
  localStorage.setItem(CHECKLIST_DB_KEY, JSON.stringify(checklists));
  
  return newChecklist;
}

export async function updateChecklist(
  checklistId: string,
  updates: Partial<ChecklistItem>
): Promise<ChecklistItem | null> {
  const checklists = JSON.parse(localStorage.getItem(CHECKLIST_DB_KEY) || '[]') as ChecklistItem[];
  const index = checklists.findIndex(c => c.id === checklistId);
  
  if (index === -1) return null;

  checklists[index] = { ...checklists[index], ...updates };
  localStorage.setItem(CHECKLIST_DB_KEY, JSON.stringify(checklists));
  
  return checklists[index];
}

export async function deleteChecklist(checklistId: string): Promise<void> {
  const checklists = JSON.parse(localStorage.getItem(CHECKLIST_DB_KEY) || '[]') as ChecklistItem[];
  const filtered = checklists.filter(c => c.id !== checklistId);
  localStorage.setItem(CHECKLIST_DB_KEY, JSON.stringify(filtered));
  
  // Also delete all comments for this checklist
  const comments = JSON.parse(localStorage.getItem(COMMENTS_DB_KEY) || '[]') as ChecklistComment[];
  const filteredComments = comments.filter(c => c.checklistId !== checklistId);
  localStorage.setItem(COMMENTS_DB_KEY, JSON.stringify(filteredComments));
}

// Comment operations
export async function getCommentsByChecklist(checklistId: string): Promise<ChecklistComment[]> {
  const comments = JSON.parse(localStorage.getItem(COMMENTS_DB_KEY) || '[]') as ChecklistComment[];
  return comments.filter(c => c.checklistId === checklistId).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

export async function addChecklistComment(
  data: CreateChecklistCommentData
): Promise<ChecklistComment> {
  const comments = JSON.parse(localStorage.getItem(COMMENTS_DB_KEY) || '[]') as ChecklistComment[];
  
  const newComment: ChecklistComment = {
    id: nanoid(10),
    checklistId: data.checklistId,
    objectiveId: data.objectiveId,
    pilotId: data.pilotId,
    userId: data.userId,
    userName: data.userName,
    content: data.content,
    createdAt: new Date().toISOString(),
  };

  comments.push(newComment);
  localStorage.setItem(COMMENTS_DB_KEY, JSON.stringify(comments));
  
  // Get checklist title for activity log
  const checklists = JSON.parse(localStorage.getItem(CHECKLIST_DB_KEY) || '[]') as ChecklistItem[];
  const checklist = checklists.find(c => c.id === data.checklistId);
  
  // Create activity log in remarks
  await createRemark({
    pilotId: data.pilotId,
    type: 'activity',
    text: `${data.userName} commented on checklist: "${checklist?.title || 'Unknown'}"`,
    isSystem: true,
    relatedTo: {
      type: 'objective',
      id: data.objectiveId,
    },
    createdBy: data.userId,
  });
  
  return newComment;
}

export async function deleteChecklistComment(commentId: string): Promise<void> {
  const comments = JSON.parse(localStorage.getItem(COMMENTS_DB_KEY) || '[]') as ChecklistComment[];
  const filtered = comments.filter(c => c.id !== commentId);
  localStorage.setItem(COMMENTS_DB_KEY, JSON.stringify(filtered));
}

export async function deleteChecklistsByObjective(objectiveId: string): Promise<void> {
  const checklists = JSON.parse(localStorage.getItem(CHECKLIST_DB_KEY) || '[]') as ChecklistItem[];
  const checklistIds = checklists.filter(c => c.objectiveId === objectiveId).map(c => c.id);
  
  // Delete checklists
  const filtered = checklists.filter(c => c.objectiveId !== objectiveId);
  localStorage.setItem(CHECKLIST_DB_KEY, JSON.stringify(filtered));
  
  // Delete all comments for these checklists
  const comments = JSON.parse(localStorage.getItem(COMMENTS_DB_KEY) || '[]') as ChecklistComment[];
  const filteredComments = comments.filter(c => !checklistIds.includes(c.checklistId));
  localStorage.setItem(COMMENTS_DB_KEY, JSON.stringify(filteredComments));
}
