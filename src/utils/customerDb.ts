import type { Customer } from '../types/customer';

interface CustomerDatabase {
  customers: Customer[];
  metadata: {
    version: string;
    lastUpdated: string;
    totalCustomers: number;
  };
}

const CUSTOMERS_DB_KEY = 'customers_db';

async function loadCustomersDatabase(): Promise<CustomerDatabase> {
  const response = await fetch('/db/customers.json');
  return response.json();
}

function saveCustomersDatabase(db: CustomerDatabase): void {
  db.metadata.lastUpdated = new Date().toISOString();
  db.metadata.totalCustomers = db.customers.length;
  sessionStorage.setItem(CUSTOMERS_DB_KEY, JSON.stringify(db));
}

async function getCustomersDatabase(): Promise<CustomerDatabase> {
  const stored = sessionStorage.getItem(CUSTOMERS_DB_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  const db = await loadCustomersDatabase();
  saveCustomersDatabase(db);
  return db;
}

export async function getCustomerByEmail(email: string): Promise<Customer | null> {
  const db = await getCustomersDatabase();
  return db.customers.find(c => c.email === email) || null;
}

export async function createCustomer(customerData: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer> {
  const db = await getCustomersDatabase();
  
  const newCustomer: Customer = {
    ...customerData,
    id: (db.customers.length + 1).toString(),
    createdAt: new Date().toISOString(),
  };
  
  db.customers.push(newCustomer);
  saveCustomersDatabase(db);
  
  return newCustomer;
}

export async function getAllCustomers(): Promise<Customer[]> {
  const db = await getCustomersDatabase();
  return db.customers;
}

export async function updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer | null> {
  const db = await getCustomersDatabase();
  const customerIndex = db.customers.findIndex(c => c.id === id);
  
  if (customerIndex === -1) return null;
  
  db.customers[customerIndex] = {
    ...db.customers[customerIndex],
    ...updates,
  };
  
  saveCustomersDatabase(db);
  return db.customers[customerIndex];
}

export async function deleteCustomer(id: string): Promise<boolean> {
  const db = await getCustomersDatabase();
  const initialLength = db.customers.length;
  
  db.customers = db.customers.filter(c => c.id !== id);
  
  if (db.customers.length < initialLength) {
    saveCustomersDatabase(db);
    return true;
  }
  
  return false;
}
