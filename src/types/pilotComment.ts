export interface PilotComment {
  id: string;
  pilotId: string;
  userId: string;
  userName: string;
  content: string;
  parentId?: string; // For replies
  createdAt: string;
  updatedAt?: string;
}

export interface CreatePilotCommentData {
  pilotId: string;
  userId: string;
  userName: string;
  content: string;
  parentId?: string;
}
