/**
 * Supabase Query Functions
 * Replaces all API client functions with direct Supabase queries
 * Handles pagination, filtering, error handling, and type mapping
 */

import { supabase } from './client';
import { TABLES } from '@/lib/config/tables';
import type {
  ClientItem,
  ClientPayload,
  ProjectItem,
  ProjectPayload,
  CodebaseItem,
  CodebasePayload,
  LinkItem,
  LinkPayload,
  FileItem,
  DropdownOption,
  ClientListData,
  ProjectListData,
  CodebaseListData,
  LinkListData,
  FileListData,
  DropdownListData,
  ListQueryParams,
  ProjectListQueryParams,
  CodebaseListQueryParams,
  LinkListQueryParams,
  FileListQueryParams,
} from '@/types/domain';
import type { PaginatedData } from '@/types/pagination';

/**
 * Custom error class for Supabase operations
 */
export class SupabaseError extends Error {
  statusCode?: number;
  fieldErrors?: Record<string, string[]>;

  constructor(message: string, options?: { statusCode?: number; fieldErrors?: Record<string, string[]> }) {
    super(message);
    this.name = 'SupabaseError';
    this.statusCode = options?.statusCode;
    this.fieldErrors = options?.fieldErrors;
  }
}

// Alias for compatibility with existing code
export const ApiRequestError = SupabaseError;

/**
 * Helper: Convert DB snake_case to camelCase
 */
function toCamelCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(item => toCamelCase(item));
  }

  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      acc[camelKey] = toCamelCase(obj[key]);
      return acc;
    }, {} as any);
  }

  return obj;
}

/**
 * Helper: Convert camelCase to snake_case for DB insert/update
 */
function toSnakeCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(item => toSnakeCase(item));
  }

  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      acc[snakeKey] = toSnakeCase(obj[key]);
      return acc;
    }, {} as any);
  }

  return obj;
}

/**
 * Helper: Parse list query parameters
 */
function parseListParams(params?: ListQueryParams) {
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 10;
  const search = params?.q || '';
  const offset = (page - 1) * pageSize;

  return { page, pageSize, search, offset };
}

/**
 * Helper: Paginate response
 */
function createPaginatedResponse<T>(
  data: T[],
  count: number | null,
  page: number,
  pageSize: number,
): PaginatedData<T> {
  const totalCount = count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    data,
    meta: {
      page,
      pageSize,
      count: totalCount,
      totalPages,
    },
  };
}

/**
 * Helper: Get current user ID
 */
async function getCurrentUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new SupabaseError('Not authenticated');
  }
  return user.id;
}

// ============================================
// CLIENTS
// ============================================

export async function listClients(params?: ListQueryParams): Promise<ClientListData> {
  try {
    const userId = await getCurrentUserId();
    const { page, pageSize, search, offset } = parseListParams(params);

    let query = supabase
      .from(TABLES.clients)
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    if (!params?.all) {
      query = query.range(offset, offset + pageSize - 1);
    }

    const { data, count, error } = await query;

    if (error) throw new SupabaseError(error.message, { statusCode: error.code as any });

    const camelData = toCamelCase(data || []);
    return createPaginatedResponse(camelData, count, page, pageSize);
  } catch (error) {
    if (error instanceof SupabaseError) throw error;
    throw new SupabaseError('Failed to fetch clients');
  }
}

export async function listClientDropdown(params?: ListQueryParams): Promise<DropdownListData> {
  try {
    const userId = await getCurrentUserId();
    const { page, pageSize, search } = parseListParams(params);

    let query = supabase
      .from(TABLES.clients)
      .select('id, name', { count: 'exact' })
      .eq('user_id', userId)
      .order('name', { ascending: true });

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    query = query.limit(pageSize);

    const { data, count, error } = await query;

    if (error) throw new SupabaseError(error.message);

    const camelData = toCamelCase(data || []);
    return createPaginatedResponse(camelData, count, page, pageSize);
  } catch (error) {
    if (error instanceof SupabaseError) throw error;
    throw new SupabaseError('Failed to fetch clients');
  }
}

export async function createClient(payload: ClientPayload): Promise<ClientItem> {
  try {
    const userId = await getCurrentUserId();
    const snakePayload = toSnakeCase(payload);

    const { data, error } = await supabase
      .from(TABLES.clients)
      .insert([{ user_id: userId, ...snakePayload }])
      .select()
      .single();

    if (error) throw new SupabaseError(error.message);
    return toCamelCase(data);
  } catch (error) {
    if (error instanceof SupabaseError) throw error;
    throw new SupabaseError('Failed to create client');
  }
}

export async function updateClient(id: string, payload: ClientPayload): Promise<ClientItem> {
  try {
    const userId = await getCurrentUserId();
    const snakePayload = toSnakeCase(payload);

    const { data, error } = await supabase
      .from(TABLES.clients)
      .update(snakePayload)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw new SupabaseError(error.message);
    return toCamelCase(data);
  } catch (error) {
    if (error instanceof SupabaseError) throw error;
    throw new SupabaseError('Failed to update client');
  }
}

export async function deleteClient(id: string): Promise<void> {
  try {
    const userId = await getCurrentUserId();

    const { error } = await supabase
      .from(TABLES.clients)
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw new SupabaseError(error.message);
  } catch (error) {
    if (error instanceof SupabaseError) throw error;
    throw new SupabaseError('Failed to delete client');
  }
}

// ============================================
// PROJECTS
// ============================================

export async function listProjects(params?: ProjectListQueryParams): Promise<ProjectListData> {
  try {
    const userId = await getCurrentUserId();
    const { page, pageSize, search, offset } = parseListParams(params);

    let query = supabase
      .from(TABLES.projects)
      .select(`
        *,
        "${TABLES.clients}" (id, name)
      `, { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (params?.clientId) {
      query = query.eq('client_id', params.clientId);
    }

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    if (!params?.all) {
      query = query.range(offset, offset + pageSize - 1);
    }

    const { data, count, error } = await query;

    if (error) throw new SupabaseError(error.message);

    const mapped = data?.map((p: any) => ({
      ...toCamelCase(p),
      clientName: p[TABLES.clients]?.[0]?.name || '',
    })) || [];

    return createPaginatedResponse(mapped, count, page, pageSize);
  } catch (error) {
    if (error instanceof SupabaseError) throw error;
    throw new SupabaseError('Failed to fetch projects');
  }
}

export async function listProjectDropdown(params?: ProjectListQueryParams): Promise<DropdownListData> {
  try {
    const userId = await getCurrentUserId();
    const { page, pageSize, search } = parseListParams(params);

    let query = supabase
      .from(TABLES.projects)
      .select('id, name', { count: 'exact' })
      .eq('user_id', userId)
      .order('name', { ascending: true });

    if (params?.clientId) {
      query = query.eq('client_id', params.clientId);
    }

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    query = query.limit(pageSize);

    const { data, count, error } = await query;

    if (error) throw new SupabaseError(error.message);

    const camelData = toCamelCase(data || []);
    return createPaginatedResponse(camelData, count, page, pageSize);
  } catch (error) {
    if (error instanceof SupabaseError) throw error;
    throw new SupabaseError('Failed to fetch projects');
  }
}

export async function createProject(payload: ProjectPayload): Promise<ProjectItem> {
  try {
    const userId = await getCurrentUserId();
    const snakePayload = toSnakeCase(payload);

    const { data, error } = await supabase
      .from(TABLES.projects)
      .insert([{ user_id: userId, ...snakePayload }])
      .select(`
        *,
        "${TABLES.clients}" (id, name)
      `)
      .single();

    if (error) throw new SupabaseError(error.message);

    return {
      ...toCamelCase(data),
      clientName: data[TABLES.clients]?.[0]?.name || '',
    };
  } catch (error) {
    if (error instanceof SupabaseError) throw error;
    throw new SupabaseError('Failed to create project');
  }
}

export async function updateProject(id: string, payload: ProjectPayload): Promise<ProjectItem> {
  try {
    const userId = await getCurrentUserId();
    const snakePayload = toSnakeCase(payload);

    const { data, error } = await supabase
      .from(TABLES.projects)
      .update(snakePayload)
      .eq('id', id)
      .eq('user_id', userId)
      .select(`
        *,
        "${TABLES.clients}" (id, name)
      `)
      .single();

    if (error) throw new SupabaseError(error.message);

    return {
      ...toCamelCase(data),
      clientName: data[TABLES.clients]?.[0]?.name || '',
    };
  } catch (error) {
    if (error instanceof SupabaseError) throw error;
    throw new SupabaseError('Failed to update project');
  }
}

export async function deleteProject(id: string): Promise<void> {
  try {
    const userId = await getCurrentUserId();

    const { error } = await supabase
      .from(TABLES.projects)
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw new SupabaseError(error.message);
  } catch (error) {
    if (error instanceof SupabaseError) throw error;
    throw new SupabaseError('Failed to delete project');
  }
}

// ============================================
// CODEBASES
// ============================================

export async function listCodebases(params?: CodebaseListQueryParams): Promise<CodebaseListData> {
  try {
    const userId = await getCurrentUserId();
    const { page, pageSize, search, offset } = parseListParams(params);

    let query = supabase
      .from(TABLES.codebases)
      .select(`
        *,
        "${TABLES.projects}" (id, name, client_id),
        "${TABLES.projects}"!inner ("${TABLES.clients}" (id, name))
      `, { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (params?.projectId) {
      query = query.eq('project_id', params.projectId);
    }

    if (params?.clientId) {
      query = query.eq(`${TABLES.projects}.client_id`, params.clientId);
    }

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    if (!params?.all) {
      query = query.range(offset, offset + pageSize - 1);
    }

    const { data, count, error } = await query;

    if (error) throw new SupabaseError(error.message);

    const mapped = data?.map((c: any) => ({
      ...toCamelCase(c),
      projectName: c[TABLES.projects]?.[0]?.name || '',
      clientId: c[TABLES.projects]?.[0]?.client_id || '',
      clientName: c[TABLES.projects]?.[0]?.[TABLES.clients]?.[0]?.name || '',
    })) || [];

    return createPaginatedResponse(mapped, count, page, pageSize);
  } catch (error) {
    if (error instanceof SupabaseError) throw error;
    throw new SupabaseError('Failed to fetch codebases');
  }
}

export async function listCodebaseDropdown(params?: CodebaseListQueryParams): Promise<DropdownListData> {
  try {
    const userId = await getCurrentUserId();
    const { page, pageSize, search } = parseListParams(params);

    let query = supabase
      .from(TABLES.codebases)
      .select('id, name', { count: 'exact' })
      .eq('user_id', userId)
      .order('name', { ascending: true });

    if (params?.projectId) {
      query = query.eq('project_id', params.projectId);
    }

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    query = query.limit(pageSize);

    const { data, count, error } = await query;

    if (error) throw new SupabaseError(error.message);

    const camelData = toCamelCase(data || []);
    return createPaginatedResponse(camelData, count, page, pageSize);
  } catch (error) {
    if (error instanceof SupabaseError) throw error;
    throw new SupabaseError('Failed to fetch codebases');
  }
}

export async function createCodebase(payload: CodebasePayload): Promise<CodebaseItem> {
  try {
    const userId = await getCurrentUserId();
    const snakePayload = toSnakeCase(payload);

    const { data, error } = await supabase
      .from(TABLES.codebases)
      .insert([{ user_id: userId, ...snakePayload }])
      .select(`
        *,
        "${TABLES.projects}" (id, name, client_id),
        "${TABLES.projects}"!inner ("${TABLES.clients}" (id, name))
      `)
      .single();

    if (error) throw new SupabaseError(error.message);

    return {
      ...toCamelCase(data),
      projectName: data[TABLES.projects]?.[0]?.name || '',
      clientId: data[TABLES.projects]?.[0]?.client_id || '',
      clientName: data[TABLES.projects]?.[0]?.[TABLES.clients]?.[0]?.name || '',
    };
  } catch (error) {
    if (error instanceof SupabaseError) throw error;
    throw new SupabaseError('Failed to create codebase');
  }
}

export async function updateCodebase(id: string, payload: CodebasePayload): Promise<CodebaseItem> {
  try {
    const userId = await getCurrentUserId();
    const snakePayload = toSnakeCase(payload);

    const { data, error } = await supabase
      .from(TABLES.codebases)
      .update(snakePayload)
      .eq('id', id)
      .eq('user_id', userId)
      .select(`
        *,
        "${TABLES.projects}" (id, name, client_id),
        "${TABLES.projects}"!inner ("${TABLES.clients}" (id, name))
      `)
      .single();

    if (error) throw new SupabaseError(error.message);

    return {
      ...toCamelCase(data),
      projectName: data[TABLES.projects]?.[0]?.name || '',
      clientId: data[TABLES.projects]?.[0]?.client_id || '',
      clientName: data[TABLES.projects]?.[0]?.[TABLES.clients]?.[0]?.name || '',
    };
  } catch (error) {
    if (error instanceof SupabaseError) throw error;
    throw new SupabaseError('Failed to update codebase');
  }
}

export async function deleteCodebase(id: string): Promise<void> {
  try {
    const userId = await getCurrentUserId();

    const { error } = await supabase
      .from(TABLES.codebases)
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw new SupabaseError(error.message);
  } catch (error) {
    if (error instanceof SupabaseError) throw error;
    throw new SupabaseError('Failed to delete codebase');
  }
}

// ============================================
// LINKS
// ============================================

export async function listLinks(params?: LinkListQueryParams): Promise<LinkListData> {
  try {
    const userId = await getCurrentUserId();
    const { page, pageSize, search, offset } = parseListParams(params);

    let query = supabase
      .from(TABLES.links)
      .select(`
        *,
        client:client_id (id, name),
        project:project_id (id, name),
        codebase:codebase_id (id, name)
      `, { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (params?.clientId) {
      query = query.eq('client_id', params.clientId);
    }
    if (params?.projectId) {
      query = query.eq('project_id', params.projectId);
    }
    if (params?.codebaseId) {
      query = query.eq('codebase_id', params.codebaseId);
    }

    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    if (!params?.all) {
      query = query.range(offset, offset + pageSize - 1);
    }

    const { data, count, error } = await query;

    if (error) throw new SupabaseError(error.message);

    const mapped = data?.map((l: any) => ({
      ...toCamelCase(l),
      clientName: (l as any).client?.[0]?.name || null,
      projectName: (l as any).project?.[0]?.name || null,
      codebaseName: (l as any).codebase?.[0]?.name || null,
    })) || [];

    return createPaginatedResponse(mapped, count, page, pageSize);
  } catch (error) {
    if (error instanceof SupabaseError) throw error;
    throw new SupabaseError('Failed to fetch links');
  }
}

export async function createLink(payload: LinkPayload): Promise<LinkItem> {
  try {
    const userId = await getCurrentUserId();
    const snakePayload = toSnakeCase(payload);

    const { data, error } = await supabase
      .from(TABLES.links)
      .insert([{ user_id: userId, ...snakePayload }])
      .select(`
        *,
        client:client_id (id, name),
        project:project_id (id, name),
        codebase:codebase_id (id, name)
      `)
      .single();

    if (error) throw new SupabaseError(error.message);

    return {
      ...toCamelCase(data),
      clientName: (data as any).client?.[0]?.name || null,
      projectName: (data as any).project?.[0]?.name || null,
      codebaseName: (data as any).codebase?.[0]?.name || null,
    };
  } catch (error) {
    if (error instanceof SupabaseError) throw error;
    throw new SupabaseError('Failed to create link');
  }
}

export async function updateLink(id: string, payload: LinkPayload): Promise<LinkItem> {
  try {
    const userId = await getCurrentUserId();
    const snakePayload = toSnakeCase(payload);

    const { data, error } = await supabase
      .from(TABLES.links)
      .update(snakePayload)
      .eq('id', id)
      .eq('user_id', userId)
      .select(`
        *,
        client:client_id (id, name),
        project:project_id (id, name),
        codebase:codebase_id (id, name)
      `)
      .single();

    if (error) throw new SupabaseError(error.message);

    return {
      ...toCamelCase(data),
      clientName: (data as any).client?.[0]?.name || null,
      projectName: (data as any).project?.[0]?.name || null,
      codebaseName: (data as any).codebase?.[0]?.name || null,
    };
  } catch (error) {
    if (error instanceof SupabaseError) throw error;
    throw new SupabaseError('Failed to update link');
  }
}

export async function deleteLink(id: string): Promise<void> {
  try {
    const userId = await getCurrentUserId();

    const { error } = await supabase
      .from(TABLES.links)
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw new SupabaseError(error.message);
  } catch (error) {
    if (error instanceof SupabaseError) throw error;
    throw new SupabaseError('Failed to delete link');
  }
}

// ============================================
// FILES
// ============================================

export async function uploadFile(params: {
  file: File;
  clientId?: string | null;
  projectId?: string | null;
  codebaseId?: string | null;
  maxSize?: number;
  allowedMimeTypes?: string[];
}): Promise<FileItem> {
  try {
    const userId = await getCurrentUserId();

    // File size validation
    const maxSize = params.maxSize || 4 * 1024 * 1024; // 4MB default
    if (params.file.size > maxSize) {
      throw new SupabaseError('File size exceeds maximum allowed');
    }

    // MIME type validation
    const allowedTypes = params.allowedMimeTypes || ['*'];
    if (!allowedTypes.includes('*') && !allowedTypes.includes(params.file.type)) {
      throw new SupabaseError('File type not allowed');
    }

    // Create unique file path: userId/filename-timestamp
    const timestamp = Date.now();
    const filename = `${userId}/${params.file.name.replace(/\s+/g, '_')}-${timestamp}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('dev-home-files')
      .upload(filename, params.file);

    if (uploadError) {
      throw new SupabaseError('File upload failed: ' + uploadError.message);
    }

    // Create file record in database
    const { data, error: dbError } = await supabase
      .from(TABLES.files)
      .insert([{
        user_id: userId,
        client_id: params.clientId || null,
        project_id: params.projectId || null,
        codebase_id: params.codebaseId || null,
        filename: params.file.name,
        storage_path: filename,
        mime_type: params.file.type,
        size_bytes: params.file.size,
      }])
      .select()
      .single();

    if (dbError) {
      // Clean up uploaded file if DB insert fails
      await supabase.storage.from('dev-home-files').remove([filename]);
      throw new SupabaseError('Failed to save file record: ' + dbError.message);
    }

    return toCamelCase(data);
  } catch (error) {
    if (error instanceof SupabaseError) throw error;
    throw new SupabaseError('File upload failed');
  }
}

export async function listFiles(params?: FileListQueryParams): Promise<FileListData> {
  try {
    const userId = await getCurrentUserId();
    const { page, pageSize, search, offset } = parseListParams(params);

    let query = supabase
      .from(TABLES.files)
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (params?.clientId) {
      query = query.eq('client_id', params.clientId);
    }
    if (params?.projectId) {
      query = query.eq('project_id', params.projectId);
    }
    if (params?.codebaseId) {
      query = query.eq('codebase_id', params.codebaseId);
    }

    if (search) {
      query = query.ilike('filename', `%${search}%`);
    }

    if (!params?.all) {
      query = query.range(offset, offset + pageSize - 1);
    }

    const { data, count, error } = await query;

    if (error) throw new SupabaseError(error.message);

    const camelData = toCamelCase(data || []);
    return createPaginatedResponse(camelData, count, page, pageSize);
  } catch (error) {
    if (error instanceof SupabaseError) throw error;
    throw new SupabaseError('Failed to fetch files');
  }
}

export async function deleteFileRecord(id: string): Promise<void> {
  try {
    const userId = await getCurrentUserId();

    // Get file record to get storage path
    const { data: fileData, error: fetchError } = await supabase
      .from(TABLES.files)
      .select('storage_path')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      throw new SupabaseError('File not found');
    }

    // Delete from storage
    if (fileData?.storage_path) {
      await supabase.storage
        .from('dev-home-files')
        .remove([fileData.storage_path]);
    }

    // Delete file record from database
    const { error: deleteError } = await supabase
      .from(TABLES.files)
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (deleteError) {
      throw new SupabaseError('Failed to delete file record');
    }
  } catch (error) {
    if (error instanceof SupabaseError) throw error;
    throw new SupabaseError('Failed to delete file');
  }
}

// ============================================
// AUTH / PROFILE
// ============================================

export async function updateProfile(payload: { name: string }): Promise<{ id: string; email: string; name: string }> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.updateUser({
      data: { name: payload.name },
    });

    if (authError) {
      throw new SupabaseError('Failed to update profile');
    }

    return {
      id: user?.id || '',
      email: user?.email || '',
      name: payload.name,
    };
  } catch (error) {
    if (error instanceof SupabaseError) throw error;
    throw new SupabaseError('Failed to update profile');
  }
}

export async function changePassword(payload: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<void> {
  try {
    if (payload.newPassword !== payload.confirmPassword) {
      throw new SupabaseError('Passwords do not match');
    }

    const { error } = await supabase.auth.updateUser({
      password: payload.newPassword,
    });

    if (error) {
      throw new SupabaseError('Failed to change password');
    }
  } catch (error) {
    if (error instanceof SupabaseError) throw error;
    throw new SupabaseError('Failed to change password');
  }
}
