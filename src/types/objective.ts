export type ObjectiveStatus = 'pending' | 'in-progress' | 'completed' | 'blocked';
export type ObjectivePriority = 'low' | 'medium' | 'high';

export interface Objective {
  id: string;
  pilotId: string;
  title: string;
  description?: string; // Rich text HTML
  status: ObjectiveStatus;
  priority: ObjectivePriority;
  assignedTo?: string[];
  dueDate?: string;
  progress: number; // 0-100
  completedAt?: string;
  order: number; // For drag-drop ordering
  createdAt: string;
  createdBy: string;
  updatedAt: string;
}

export function getObjectiveStatusBadgeStyle(status: ObjectiveStatus): string {
  const styles = {
    pending: 'bg-gray-100 text-gray-800 border-gray-200',
    'in-progress': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    completed: 'bg-green-100 text-green-800 border-green-200',
    blocked: 'bg-red-100 text-red-800 border-red-200',
  };
  return styles[status];
}

export function getObjectiveStatusDisplayText(status: ObjectiveStatus): string {
  const displayText: Record<ObjectiveStatus, string> = {
    pending: 'Pending',
    'in-progress': 'In Progress',
    completed: 'Completed',
    blocked: 'Blocked',
  };
  return displayText[status];
}

export function getPriorityBadgeStyle(priority: ObjectivePriority): string {
  const styles: Record<ObjectivePriority, string> = {
    low: 'bg-blue-100 text-blue-800 border-blue-200',
    medium: 'bg-orange-100 text-orange-800 border-orange-200',
    high: 'bg-red-100 text-red-800 border-red-200',
  };
  return styles[priority];
}

export function getPriorityDisplayText(priority: ObjectivePriority): string {
  const displayText: Record<ObjectivePriority, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
  };
  return displayText[priority];
}
