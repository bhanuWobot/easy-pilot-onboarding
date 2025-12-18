import type { User } from '../types/auth';

interface UserDatabase {
  users: User[];
  metadata: {
    version: string;
    lastUpdated: string;
    totalUsers: number;
  };
}

const USERS_DB_KEY = 'users_db';

async function loadUsersDatabase(): Promise<UserDatabase> {
  const response = await fetch('/db/users.json');
  return response.json();
}

function saveUsersDatabase(db: UserDatabase): void {
  db.metadata.lastUpdated = new Date().toISOString();
  db.metadata.totalUsers = db.users.length;
  localStorage.setItem(USERS_DB_KEY, JSON.stringify(db));
}

async function getUsersDatabase(): Promise<UserDatabase> {
  const stored = localStorage.getItem(USERS_DB_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  const db = await loadUsersDatabase();
  saveUsersDatabase(db);
  return db;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const db = await getUsersDatabase();
  return db.users.find(u => u.email === email) || null;
}

export async function createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
  const db = await getUsersDatabase();
  
  const newUser: User = {
    ...userData,
    id: (db.users.length + 1).toString(),
    createdAt: new Date().toISOString(),
  };
  
  db.users.push(newUser);
  saveUsersDatabase(db);
  
  return newUser;
}

export async function getAllUsers(): Promise<User[]> {
  const db = await getUsersDatabase();
  return db.users;
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User | null> {
  const db = await getUsersDatabase();
  const userIndex = db.users.findIndex(u => u.id === id);
  
  if (userIndex === -1) return null;
  
  db.users[userIndex] = {
    ...db.users[userIndex],
    ...updates,
  };
  
  saveUsersDatabase(db);
  return db.users[userIndex];
}

export async function deleteUser(id: string): Promise<boolean> {
  const db = await getUsersDatabase();
  const initialLength = db.users.length;
  
  db.users = db.users.filter(u => u.id !== id);
  
  if (db.users.length < initialLength) {
    saveUsersDatabase(db);
    return true;
  }
  
  return false;
}
