import { supabase } from "../client";
import { TABLES, STORAGE_BUCKETS } from "@/lib/config/tables";
import type { FileItem, FileListData, FileListQueryParams } from "@/types/domain";
import {
  SupabaseError,
  toCamelCase,
  parseListParams,
  createPaginatedResponse,
  getCurrentUserId,
} from "./utils";

const SIGNED_URL_EXPIRY = 60; // seconds

export async function createSignedUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS.files)
    .createSignedUrl(storagePath, SIGNED_URL_EXPIRY);

  if (error || !data?.signedUrl) {
    throw new SupabaseError("Unable to generate file URL");
  }

  return data.signedUrl;
}

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
      throw new SupabaseError("File size exceeds maximum allowed");
    }

    // MIME type validation
    const allowedTypes = params.allowedMimeTypes || ["*"];
    if (!allowedTypes.includes("*") && !allowedTypes.includes(params.file.type)) {
      throw new SupabaseError("File type not allowed");
    }

    // Create unique file path: userId/filename-timestamp
    const timestamp = Date.now();
    const filename = `${userId}/${params.file.name.replace(/\s+/g, "_")}-${timestamp}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKETS.files)
      .upload(filename, params.file);

    if (uploadError) {
      throw new SupabaseError("File upload failed: " + uploadError.message);
    }

    // Create file record in database
    const { data, error: dbError } = await supabase
      .from(TABLES.files)
      .insert([
        {
          user_id: userId,
          client_id: params.clientId || null,
          project_id: params.projectId || null,
          codebase_id: params.codebaseId || null,
          filename: params.file.name,
          storage_path: filename,
          mime_type: params.file.type,
          size_bytes: params.file.size,
        },
      ])
      .select()
      .single();

    if (dbError) {
      // Clean up uploaded file if DB insert fails
      await supabase.storage.from(STORAGE_BUCKETS.files).remove([filename]);
      throw new SupabaseError("Failed to save file record: " + dbError.message);
    }

    return toCamelCase(data);
  } catch (error) {
    if (error instanceof SupabaseError) throw error;
    throw new SupabaseError("File upload failed");
  }
}

export async function listFiles(params?: FileListQueryParams): Promise<FileListData> {
  try {
    const userId = await getCurrentUserId();
    const { page, pageSize, search, offset } = parseListParams(params);

    let query = supabase
      .from(TABLES.files)
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (params?.clientId) {
      query = query.eq("client_id", params.clientId);
    }
    if (params?.projectId) {
      query = query.eq("project_id", params.projectId);
    }
    if (params?.codebaseId) {
      query = query.eq("codebase_id", params.codebaseId);
    }

    if (search) {
      query = query.ilike("filename", `%${search}%`);
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
    throw new SupabaseError("Failed to fetch files");
  }
}

export async function deleteFileRecord(id: string): Promise<void> {
  try {
    const userId = await getCurrentUserId();

    // Get file record to get storage path
    const { data: fileData, error: fetchError } = await supabase
      .from(TABLES.files)
      .select("storage_path")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (fetchError) {
      throw new SupabaseError("File not found");
    }

    // Delete from storage
    if (fileData?.storage_path) {
      await supabase.storage.from(STORAGE_BUCKETS.files).remove([fileData.storage_path]);
    }

    // Delete file record from database
    const { error: deleteError } = await supabase
      .from(TABLES.files)
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (deleteError) {
      throw new SupabaseError("Failed to delete file record");
    }
  } catch (error) {
    if (error instanceof SupabaseError) throw error;
    throw new SupabaseError("Failed to delete file");
  }
}
