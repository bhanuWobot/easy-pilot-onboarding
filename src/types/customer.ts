/**
 * Customer type definitions
 */

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  title?: string;
  timezone?: string;
  createdAt: string;
}
