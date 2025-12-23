export type AlertType = 
  | 'pilot_created'
  | 'pilot_status_change'
  | 'camera_added'
  | 'camera_issue'
  | 'objective_completed'
  | 'objective_blocked'
  | 'asset_uploaded'
  | 'user_assigned'
  | 'deadline_approaching'
  | 'comment_added'
  | 'system_update';

export type AlertPriority = 'low' | 'medium' | 'high' | 'critical';

export interface AlertComment {
  id: string;
  alertId: string;
  text: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  isEdited: boolean;
}

export interface Alert {
  id: string;
  type: AlertType;
  priority: AlertPriority;
  title: string;
  message: string;
  pilotId?: string;
  pilotName?: string;
  relatedTo?: {
    type: 'pilot' | 'camera' | 'objective' | 'asset' | 'user';
    id: string;
    name: string;
  };
  isRead: boolean;
  createdBy: string;
  createdAt: string;
  readAt?: string;
  comments?: AlertComment[];
}

export function getAlertTypeIcon(type: AlertType): string {
  const icons: Record<AlertType, string> = {
    pilot_created: '🚀',
    pilot_status_change: '🔄',
    camera_added: '📹',
    camera_issue: '⚠️',
    objective_completed: '✅',
    objective_blocked: '🚫',
    asset_uploaded: '📎',
    user_assigned: '👤',
    deadline_approaching: '⏰',
    comment_added: '💬',
    system_update: '🔔',
  };
  return icons[type];
}

export function getAlertPriorityColor(priority: AlertPriority): string {
  const colors: Record<AlertPriority, string> = {
    low: 'bg-blue-50 text-blue-700 border-blue-200',
    medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    high: 'bg-orange-50 text-orange-700 border-orange-200',
    critical: 'bg-red-50 text-red-700 border-red-200',
  };
  return colors[priority];
}

export function getAlertTypeColor(type: AlertType): string {
  const colorMap: Record<AlertType, string> = {
    pilot_created: 'text-green-600',
    pilot_status_change: 'text-blue-600',
    camera_added: 'text-purple-600',
    camera_issue: 'text-red-600',
    objective_completed: 'text-green-600',
    objective_blocked: 'text-red-600',
    asset_uploaded: 'text-indigo-600',
    user_assigned: 'text-cyan-600',
    deadline_approaching: 'text-orange-600',
    comment_added: 'text-gray-600',
    system_update: 'text-gray-600',
  };
  return colorMap[type];
}
