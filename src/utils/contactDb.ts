import { nanoid } from 'nanoid';
import type { Contact, CreateContactData } from '../types/contact';

const CONTACTS_KEY = 'pilot_contacts';

// Get all contacts
export function getAllContacts(): Contact[] {
  const data = sessionStorage.getItem(CONTACTS_KEY);
  return data ? JSON.parse(data) : [];
}

// Get contact by ID
export function getContactById(id: string): Contact | undefined {
  const contacts = getAllContacts();
  return contacts.find(c => c.id === id);
}

// Get contacts by IDs
export function getContactsByIds(ids: string[]): Contact[] {
  const contacts = getAllContacts();
  return contacts.filter(c => ids.includes(c.id));
}

// Create a new contact
export function createContact(data: CreateContactData): Contact {
  const contacts = getAllContacts();
  
  const newContact: Contact = {
    id: nanoid(10),
    name: data.name,
    email: data.email,
    phone: data.phone,
    company: data.company,
    jobTitle: data.jobTitle,
    notes: data.notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  contacts.push(newContact);
  sessionStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
  
  return newContact;
}

// Update contact
export function updateContact(id: string, updates: Partial<CreateContactData>): Contact | undefined {
  const contacts = getAllContacts();
  const index = contacts.findIndex(c => c.id === id);
  
  if (index === -1) return undefined;
  
  contacts[index] = {
    ...contacts[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  sessionStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
  return contacts[index];
}

// Delete contact
export function deleteContact(id: string): boolean {
  const contacts = getAllContacts();
  const filteredContacts = contacts.filter(c => c.id !== id);
  
  if (filteredContacts.length === contacts.length) {
    return false; // Contact not found
  }
  
  sessionStorage.setItem(CONTACTS_KEY, JSON.stringify(filteredContacts));
  return true;
}

// Search contacts by name
export function searchContacts(query: string): Contact[] {
  const contacts = getAllContacts();
  const lowerQuery = query.toLowerCase();
  
  return contacts.filter(contact => 
    contact.name.toLowerCase().includes(lowerQuery) ||
    contact.email?.toLowerCase().includes(lowerQuery) ||
    contact.company?.toLowerCase().includes(lowerQuery)
  );
}
