import { nanoid } from 'nanoid';
import type { ROIComment, CreateROICommentData } from '../types/roiComment';
import { createRemark } from './remarkDb';

const ROI_COMMENTS_DB_KEY = 'roi_comments_db';

// Initialize database with sample data if empty
export async function initROICommentDatabase(): Promise<void> {
  const comments = localStorage.getItem(ROI_COMMENTS_DB_KEY);

  if (!comments) {
    const response = await fetch('/db/roi_comments.json');
    const data = await response.json();
    localStorage.setItem(ROI_COMMENTS_DB_KEY, JSON.stringify(data));
  }
}

// Get comments for a specific shape
export async function getCommentsByShape(shapeId: string): Promise<ROIComment[]> {
  const comments = JSON.parse(localStorage.getItem(ROI_COMMENTS_DB_KEY) || '[]') as ROIComment[];
  return comments.filter(c => c.shapeId === shapeId).sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

// Get all comments for a camera (to show counts)
export async function getCommentsByCamera(cameraId: string): Promise<ROIComment[]> {
  const comments = JSON.parse(localStorage.getItem(ROI_COMMENTS_DB_KEY) || '[]') as ROIComment[];
  return comments.filter(c => c.cameraId === cameraId);
}

// Add a new comment to a shape
export async function addROIComment(data: CreateROICommentData): Promise<ROIComment> {
  const comments = JSON.parse(localStorage.getItem(ROI_COMMENTS_DB_KEY) || '[]') as ROIComment[];
  
  const newComment: ROIComment = {
    id: nanoid(10),
    ...data,
    createdAt: new Date().toISOString(),
  };
  
  comments.push(newComment);
  localStorage.setItem(ROI_COMMENTS_DB_KEY, JSON.stringify(comments));
  
  // Create activity log entry
  try {
    await createRemark({
      pilotId: data.pilotId,
      type: 'activity',
      text: `commented on ROI shape in profile`,
      isSystem: false,
      relatedTo: {
        type: 'objective',
        id: data.objectiveId,
      },
      createdBy: data.userId,
    });
  } catch (error) {
    console.error('Failed to create activity log for ROI comment:', error);
  }
  
  return newComment;
}

// Delete a comment
export async function deleteROIComment(commentId: string): Promise<void> {
  const comments = JSON.parse(localStorage.getItem(ROI_COMMENTS_DB_KEY) || '[]') as ROIComment[];
  const filtered = comments.filter(c => c.id !== commentId);
  localStorage.setItem(ROI_COMMENTS_DB_KEY, JSON.stringify(filtered));
}

// Delete all comments for a shape
export async function deleteCommentsByShape(shapeId: string): Promise<void> {
  const comments = JSON.parse(localStorage.getItem(ROI_COMMENTS_DB_KEY) || '[]') as ROIComment[];
  const filtered = comments.filter(c => c.shapeId !== shapeId);
  localStorage.setItem(ROI_COMMENTS_DB_KEY, JSON.stringify(filtered));
}

// Delete all comments for a profile
export async function deleteCommentsByProfile(profileId: string): Promise<void> {
  const comments = JSON.parse(localStorage.getItem(ROI_COMMENTS_DB_KEY) || '[]') as ROIComment[];
  const filtered = comments.filter(c => c.profileId !== profileId);
  localStorage.setItem(ROI_COMMENTS_DB_KEY, JSON.stringify(filtered));
}
