import { nanoid } from 'nanoid';
import type { PilotComment, CreatePilotCommentData } from '../types/pilotComment';
import { createRemark } from './remarkDb';

const STORAGE_KEY = 'pilot_comments_db';

// Initialize database from JSON file
export async function initPilotCommentDatabase() {
  try {
    const response = await fetch('/db/pilot_comments.json');
    const comments = await response.json();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));
    return comments;
  } catch (error) {
    console.error('Error initializing pilot comment database:', error);
    return [];
  }
}

// Get all comments
function getAllComments(): PilotComment[] {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  return JSON.parse(data);
}

// Save all comments
function saveAllComments(comments: PilotComment[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));
}

// Get comments by pilot ID
export function getCommentsByPilot(pilotId: string): PilotComment[] {
  const comments = getAllComments();
  return comments
    .filter(c => c.pilotId === pilotId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

// Add a new comment
export async function addPilotComment(data: CreatePilotCommentData): Promise<PilotComment> {
  const comments = getAllComments();
  
  const newComment: PilotComment = {
    id: nanoid(10),
    pilotId: data.pilotId,
    userId: data.userId,
    userName: data.userName,
    content: data.content,
    parentId: data.parentId,
    createdAt: new Date().toISOString(),
  };
  
  comments.push(newComment);
  saveAllComments(comments);
  
  // Log activity
  await createRemark({
    pilotId: data.pilotId,
    text: data.parentId 
      ? `${data.userName} replied to a comment: "${data.content.substring(0, 50)}${data.content.length > 50 ? '...' : ''}"`
      : `${data.userName} added a comment: "${data.content.substring(0, 50)}${data.content.length > 50 ? '...' : ''}"`,
    type: 'activity',
    isSystem: true,
    createdBy: data.userId,
  });
  
  return newComment;
}

// Update a comment
export function updatePilotComment(commentId: string, content: string): PilotComment | null {
  const comments = getAllComments();
  const index = comments.findIndex(c => c.id === commentId);
  
  if (index === -1) return null;
  
  comments[index] = {
    ...comments[index],
    content,
    updatedAt: new Date().toISOString(),
  };
  
  saveAllComments(comments);
  return comments[index];
}

// Delete a comment
export function deletePilotComment(commentId: string): boolean {
  const comments = getAllComments();
  const filtered = comments.filter(c => c.id !== commentId && c.parentId !== commentId);
  
  if (filtered.length === comments.length) return false;
  
  saveAllComments(filtered);
  return true;
}

// Delete all comments for a pilot (cascade)
export function deletePilotComments(pilotId: string): void {
  const comments = getAllComments();
  const filtered = comments.filter(c => c.pilotId !== pilotId);
  saveAllComments(filtered);
}

// Get replies for a comment
export function getRepliesForComment(commentId: string): PilotComment[] {
  const comments = getAllComments();
  return comments
    .filter(c => c.parentId === commentId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

// Get top-level comments (no parent)
export function getTopLevelComments(pilotId: string): PilotComment[] {
  const comments = getAllComments();
  return comments
    .filter(c => c.pilotId === pilotId && !c.parentId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
