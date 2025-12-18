export type RemarkType = 'note' | 'issue' | 'update' | 'resolution' | 'activity';

export interface Remark {
  id: string;
  pilotId: string;
  text: string;
  type: RemarkType;
  isSystem: boolean; // Auto-generated activity logs
  relatedTo?: {
    type: 'camera' | 'objective' | 'asset';
    id: string;
    name?: string;
  };
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  isEdited: boolean;
}

export function getRemarkTypeBadgeStyle(type: RemarkType): string {
  const styles: Record<RemarkType, string> = {
    note: 'bg-blue-100 text-blue-800 border-blue-200',
    issue: 'bg-red-100 text-red-800 border-red-200',
    update: 'bg-green-100 text-green-800 border-green-200',
    resolution: 'bg-purple-100 text-purple-800 border-purple-200',
    activity: 'bg-gray-100 text-gray-800 border-gray-200',
  };
  return styles[type];
}

export function getRemarkTypeIcon(type: RemarkType): string {
  const icons: Record<RemarkType, string> = {
    note: '📝',
    issue: '⚠️',
    update: '✅',
    resolution: '✔️',
    activity: '📌',
  };
  return icons[type];
}
