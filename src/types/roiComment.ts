export interface ROIComment {
  id: string;
  shapeId: string;
  profileId: string;
  objectiveId: string;
  cameraId: string;
  pilotId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
}

export interface CreateROICommentData {
  shapeId: string;
  profileId: string;
  objectiveId: string;
  cameraId: string;
  pilotId: string;
  userId: string;
  userName: string;
  content: string;
}
