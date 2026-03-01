/**
 * Supabase Database Types
 * Auto-generated types for database schema
 * Manually maintained for now - can be auto-generated with Supabase CLI in future
 */

export interface User {
  id: string;
  auth_id: string;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  user_id: string;
  name: string;
  engagement_type: string | null;
  working_days_per_week: number | null;
  working_hours_per_day: number | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  client_id: string;
  name: string;
  description: string | null;
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  created_at: string;
  updated_at: string;
}

export interface Codebase {
  id: string;
  user_id: string;
  project_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Link {
  id: string;
  user_id: string;
  client_id: string | null;
  project_id: string | null;
  codebase_id: string | null;
  title: string;
  url: string;
  created_at: string;
  updated_at: string;
}

export interface FileRecord {
  id: string;
  user_id: string;
  client_id: string | null;
  project_id: string | null;
  codebase_id: string | null;
  filename: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * API Response wrapper type
 */
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  status?: number;
}

/**
 * Paginated list response
 */
export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
