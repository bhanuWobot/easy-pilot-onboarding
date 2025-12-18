/**
 * Pilot type definitions and mock data
 */

export type PilotStatus = 'active' | 'in-progress' | 'completed' | 'on-hold' | 'issues';

export interface Pilot {
  id: string;
  name: string;
  company: string;
  contactEmail: string;
  status: PilotStatus;
  progress: number; // 0-100
  cameraCount: string;
  location: string;
  locationName: string; // Specific location/site name (e.g., "Downtown Store", "Factory Floor 2")
  startDate: string;
  customerId?: string; // Foreign key reference to Customer
  assignedUserIds: string[]; // Array of User IDs assigned to this pilot
  createdAt: string;
  updatedAt: string;
  createdBy?: string; // User email who created the pilot
}

// Mock pilot data
export const MOCK_PILOTS: Pilot[] = [
  {
    id: '1',
    name: 'Retail Security Enhancement',
    company: 'TechMart India',
    contactEmail: 'security@techmart.com',
    status: 'in-progress',
    progress: 65,
    cameraCount: '11-to-20',
    location: 'Mumbai, Maharashtra',
    locationName: 'Main Store - Mumbai',
    startDate: '2025-12-01',
    customerId: '1',
    assignedUserIds: ['1', '2'],
    createdAt: '2025-12-01T10:00:00Z',
    updatedAt: '2025-12-15T14:30:00Z',
    createdBy: 'admin@wobot.ai',
  },
  {
    id: '2',
    name: 'Manufacturing Floor Monitoring',
    company: 'AutoParts Ltd',
    contactEmail: 'ops@autoparts.co.in',
    status: 'active',
    progress: 85,
    cameraCount: '21-to-50',
    location: 'Pune, Maharashtra',
    locationName: 'Factory Floor 2',
    startDate: '2025-11-15',
    customerId: '2',
    assignedUserIds: ['1'],
    createdAt: '2025-11-15T09:00:00Z',
    updatedAt: '2025-12-16T11:20:00Z',
    createdBy: 'admin@wobot.ai',
  },
  {
    id: '3',
    name: 'Warehouse Safety System',
    company: 'LogiFlow Solutions',
    contactEmail: 'safety@logiflow.com',
    status: 'issues',
    progress: 40,
    cameraCount: '5-to-10',
    location: 'Bangalore, Karnataka',
    locationName: 'Warehouse A',
    startDate: '2025-12-10',
    customerId: '3',
    assignedUserIds: ['2', '3'],
    createdAt: '2025-12-10T12:00:00Z',
    updatedAt: '2025-12-17T16:45:00Z',
    createdBy: 'admin@wobot.ai',
  },
  {
    id: '4',
    name: 'Campus Security Upgrade',
    company: 'EduTech University',
    contactEmail: 'security@edutech.edu',
    status: 'completed',
    progress: 100,
    cameraCount: 'more-than-50',
    location: 'Delhi NCR',
    locationName: 'Main Campus',
    startDate: '2025-10-20',
    customerId: '4',
    assignedUserIds: ['1', '3'],
    createdAt: '2025-10-20T08:00:00Z',
    updatedAt: '2025-12-05T10:00:00Z',
    createdBy: 'admin@wobot.ai',
  },
];

/**
 * Get status badge styling based on pilot status
 * @param status - Pilot status
 * @returns Tailwind CSS classes for badge
 */
export function getStatusBadgeStyle(status: PilotStatus): string {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'in-progress':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'completed':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'on-hold':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'issues':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

/**
 * Get status display text
 * @param status - Pilot status
 * @returns Human-readable status text
 */
export function getStatusDisplayText(status: PilotStatus): string {
  switch (status) {
    case 'active':
      return 'Active';
    case 'in-progress':
      return 'In Progress';
    case 'completed':
      return 'Completed';
    case 'on-hold':
      return 'On Hold';
    case 'issues':
      return 'Issues';
    default:
      return status;
  }
}
