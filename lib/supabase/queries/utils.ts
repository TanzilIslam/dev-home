import { supabase } from "../client";
import type { ListQueryParams } from "@/types/domain";
import type { PaginatedData } from "@/types/pagination";

/**
 * Custom error class for Supabase operations
 */
export class SupabaseError extends Error {
  statusCode?: number;
  fieldErrors?: Record<string, string[]>;

  constructor(
    message: string,
    options?: { statusCode?: number; fieldErrors?: Record<string, string[]> },
  ) {
    super(message);
    this.name = "SupabaseError";
    this.statusCode = options?.statusCode;
    this.fieldErrors = options?.fieldErrors;
  }
}

// Alias for compatibility with existing code
export const ApiRequestError = SupabaseError;

/**
 * Helper: Convert DB snake_case to camelCase
 */
export function toCamelCase<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map((item) => toCamelCase(item)) as T;
  }

  if (obj !== null && typeof obj === "object") {
    const record = obj as Record<string, unknown>;
    return Object.keys(record).reduce<Record<string, unknown>>((acc, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
      acc[camelKey] = toCamelCase(record[key]);
      return acc;
    }, {}) as T;
  }

  return obj;
}

/**
 * Helper: Convert camelCase to snake_case for DB insert/update
 */
export function toSnakeCase<T>(obj: T): Record<string, unknown> {
  if (Array.isArray(obj)) {
    return obj.map((item) => toSnakeCase(item)) as unknown as Record<string, unknown>;
  }

  if (obj !== null && typeof obj === "object") {
    const record = obj as Record<string, unknown>;
    return Object.keys(record).reduce<Record<string, unknown>>((acc, key) => {
      const snakeKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
      acc[snakeKey] = toSnakeCase(record[key]);
      return acc;
    }, {});
  }

  return obj as unknown as Record<string, unknown>;
}

/**
 * Helper: Parse list query parameters
 */
export function parseListParams(params?: ListQueryParams) {
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 10;
  const search = params?.q || "";
  const offset = (page - 1) * pageSize;

  return { page, pageSize, search, offset };
}

/**
 * Helper: Paginate response
 */
export function createPaginatedResponse<T>(
  data: T[],
  count: number | null,
  page: number,
  pageSize: number,
): PaginatedData<T> {
  const total = count || 0;
  const totalPages = Math.ceil(total / pageSize);

  return {
    items: data,
    meta: {
      page,
      pageSize,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

/**
 * Helper: Get current user ID from session
 */
async function getCurrentUserId(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) {
    throw new SupabaseError("Not authenticated");
  }
  return session.user.id;
}

/**
 * Helper: Throw SupabaseError if a Supabase operation returned an error
 */
export function throwIfError(error: { message: string; code?: string } | null): void {
  if (error) {
    throw new SupabaseError(error.message, {
      statusCode: Number(error.code) || undefined,
    });
  }
}

/**
 * Helper: Wrap an authenticated query with error boundary
 * Handles getCurrentUserId + catch/rethrow boilerplate
 */
export async function withAuth<T>(
  fallbackMessage: string,
  fn: (userId: string) => Promise<T>,
): Promise<T> {
  try {
    const userId = await getCurrentUserId();
    return await fn(userId);
  } catch (error) {
    if (error instanceof SupabaseError) throw error;
    throw new SupabaseError(fallbackMessage);
  }
}
