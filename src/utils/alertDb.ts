import { nanoid } from 'nanoid';
import type { Alert, AlertComment } from '../types/alert';

interface AlertDatabase {
  alerts: Alert[];
  metadata: {
    version: string;
    lastUpdated: string;
    totalAlerts: number;
  };
}

const ALERTS_DB_KEY = 'alerts_db';

async function loadAlertsDatabase(): Promise<AlertDatabase> {
  try {
    const response = await fetch('/db/alerts.json');
    if (!response.ok) {
      throw new Error('Failed to load alerts database');
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading alerts from file:', error);
    return {
      alerts: [],
      metadata: {
        version: '1.0',
        lastUpdated: new Date().toISOString(),
        totalAlerts: 0,
      },
    };
  }
}

function saveAlertsDatabase(db: AlertDatabase): void {
  db.metadata.lastUpdated = new Date().toISOString();
  db.metadata.totalAlerts = db.alerts.length;
  sessionStorage.setItem(ALERTS_DB_KEY, JSON.stringify(db));
}

async function getAlertsDatabase(): Promise<AlertDatabase> {
  const stored = sessionStorage.getItem(ALERTS_DB_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  const db = await loadAlertsDatabase();
  saveAlertsDatabase(db);
  return db;
}

// Get all alerts
export async function getAllAlerts(): Promise<Alert[]> {
  const db = await getAlertsDatabase();
  return db.alerts.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

// Get alerts by pilot
export async function getAlertsByPilot(pilotId: string): Promise<Alert[]> {
  const db = await getAlertsDatabase();
  return db.alerts
    .filter(alert => alert.pilotId === pilotId)
    .sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

// Get unread alerts count
export async function getUnreadAlertsCount(): Promise<number> {
  const db = await getAlertsDatabase();
  return db.alerts.filter(alert => !alert.isRead).length;
}

// Get alert by ID
export async function getAlertById(id: string): Promise<Alert | null> {
  const db = await getAlertsDatabase();
  return db.alerts.find(alert => alert.id === id) || null;
}

// Create alert
export async function createAlert(
  alertData: Omit<Alert, 'id' | 'createdAt' | 'isRead' | 'comments'>
): Promise<Alert> {
  const db = await getAlertsDatabase();
  
  const newAlert: Alert = {
    ...alertData,
    id: nanoid(10),
    createdAt: new Date().toISOString(),
    isRead: false,
    comments: [],
  };
  
  db.alerts.push(newAlert);
  saveAlertsDatabase(db);
  
  return newAlert;
}

// Mark alert as read
export async function markAlertAsRead(id: string): Promise<void> {
  const db = await getAlertsDatabase();
  const alert = db.alerts.find(a => a.id === id);
  
  if (alert && !alert.isRead) {
    alert.isRead = true;
    alert.readAt = new Date().toISOString();
    saveAlertsDatabase(db);
  }
}

// Mark all alerts as read
export async function markAllAlertsAsRead(): Promise<void> {
  const db = await getAlertsDatabase();
  const now = new Date().toISOString();
  
  db.alerts.forEach(alert => {
    if (!alert.isRead) {
      alert.isRead = true;
      alert.readAt = now;
    }
  });
  
  saveAlertsDatabase(db);
}

// Add comment to alert
export async function addCommentToAlert(
  alertId: string,
  text: string,
  createdBy: string
): Promise<AlertComment> {
  const db = await getAlertsDatabase();
  const alert = db.alerts.find(a => a.id === alertId);
  
  if (!alert) {
    throw new Error('Alert not found');
  }
  
  const newComment: AlertComment = {
    id: nanoid(10),
    alertId,
    text,
    createdBy,
    createdAt: new Date().toISOString(),
    isEdited: false,
  };
  
  if (!alert.comments) {
    alert.comments = [];
  }
  
  alert.comments.push(newComment);
  saveAlertsDatabase(db);
  
  return newComment;
}

// Update comment
export async function updateComment(
  alertId: string,
  commentId: string,
  text: string
): Promise<void> {
  const db = await getAlertsDatabase();
  const alert = db.alerts.find(a => a.id === alertId);
  
  if (!alert || !alert.comments) {
    throw new Error('Alert or comment not found');
  }
  
  const comment = alert.comments.find(c => c.id === commentId);
  if (comment) {
    comment.text = text;
    comment.updatedAt = new Date().toISOString();
    comment.isEdited = true;
    saveAlertsDatabase(db);
  }
}

// Delete comment
export async function deleteComment(alertId: string, commentId: string): Promise<void> {
  const db = await getAlertsDatabase();
  const alert = db.alerts.find(a => a.id === alertId);
  
  if (!alert || !alert.comments) {
    throw new Error('Alert or comment not found');
  }
  
  alert.comments = alert.comments.filter(c => c.id !== commentId);
  saveAlertsDatabase(db);
}

// Delete alert
export async function deleteAlert(id: string): Promise<void> {
  const db = await getAlertsDatabase();
  db.alerts = db.alerts.filter(alert => alert.id !== id);
  saveAlertsDatabase(db);
}
