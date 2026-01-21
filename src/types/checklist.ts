export interface ChecklistComment {
  id: string;
  checklistId: string;
  objectiveId: string;
  pilotId: string;
  userId: string; // Email of commenter
  userName: string;
  content: string;
  createdAt: string;
}

export interface ChecklistItem {
  id: string;
  objectiveId: string;
  title: string;
  description: string;
  completed: boolean;
  type: 'regular' | 'ai'; // Regular or AI-suggested
  order: number;
  createdAt: string;
  createdBy: string;
  comments?: ChecklistComment[]; // Comments for this checklist item
}

export interface CreateChecklistCommentData {
  checklistId: string;
  objectiveId: string;
  pilotId: string;
  content: string;
  userId: string;
  userName: string;
}
