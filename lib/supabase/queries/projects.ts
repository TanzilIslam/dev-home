import { supabase } from "../client";
import { TABLES } from "@/lib/config/tables";
import type {
  ProjectItem,
  ProjectPayload,
  ProjectListData,
  DropdownListData,
  ProjectListQueryParams,
} from "@/types/domain";
import {
  SupabaseError,
  toCamelCase,
  toSnakeCase,
  parseListParams,
  createPaginatedResponse,
  getCurrentUserId,
} from "./utils";

export async function listProjects(params?: ProjectListQueryParams): Promise<ProjectListData> {
  try {
    const userId = await getCurrentUserId();
    const { page, pageSize, search, offset } = parseListParams(params);

    let query = supabase
      .from(TABLES.projects)
      .select(
        `
        *,
        "${TABLES.clients}" (id, name)
      `,
        { count: "exact" },
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (params?.clientId) {
      query = query.eq("client_id", params.clientId);
    }

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    if (!params?.all) {
      query = query.range(offset, offset + pageSize - 1);
    }

    const { data, count, error } = await query;

    if (error) throw new SupabaseError(error.message);

    const mapped = (data?.map((p: Record<string, unknown>) => ({
      ...toCamelCase(p),
      clientName: ((p[TABLES.clients] as Record<string, unknown> | null)?.name as string) || "",
    })) || []) as ProjectItem[];

    return createPaginatedResponse(mapped, count, page, pageSize);
  } catch (error) {
    if (error instanceof SupabaseError) throw error;
    throw new SupabaseError("Failed to fetch projects");
  }
}

export async function listProjectDropdown(
  params?: ProjectListQueryParams,
): Promise<DropdownListData> {
  try {
    const userId = await getCurrentUserId();
    const { page, pageSize, search } = parseListParams(params);

    let query = supabase
      .from(TABLES.projects)
      .select("id, name", { count: "exact" })
      .eq("user_id", userId)
      .order("name", { ascending: true });

    if (params?.clientId) {
      query = query.eq("client_id", params.clientId);
    }

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    query = query.limit(pageSize);

    const { data, count, error } = await query;

    if (error) throw new SupabaseError(error.message);

    const camelData = toCamelCase(data || []);
    return createPaginatedResponse(camelData, count, page, pageSize);
  } catch (error) {
    if (error instanceof SupabaseError) throw error;
    throw new SupabaseError("Failed to fetch projects");
  }
}

export async function createProject(payload: ProjectPayload): Promise<ProjectItem> {
  try {
    const userId = await getCurrentUserId();
    const snakePayload = toSnakeCase(payload);

    const { data, error } = await supabase
      .from(TABLES.projects)
      .insert([{ user_id: userId, ...snakePayload }])
      .select(
        `
        *,
        "${TABLES.clients}" (id, name)
      `,
      )
      .single();

    if (error) throw new SupabaseError(error.message);

    return {
      ...toCamelCase(data),
      clientName: (data[TABLES.clients] as Record<string, unknown> | null)?.name || "",
    };
  } catch (error) {
    if (error instanceof SupabaseError) throw error;
    throw new SupabaseError("Failed to create project");
  }
}

export async function updateProject(id: string, payload: ProjectPayload): Promise<ProjectItem> {
  try {
    const userId = await getCurrentUserId();
    const snakePayload = toSnakeCase(payload);

    const { data, error } = await supabase
      .from(TABLES.projects)
      .update(snakePayload)
      .eq("id", id)
      .eq("user_id", userId)
      .select(
        `
        *,
        "${TABLES.clients}" (id, name)
      `,
      )
      .single();

    if (error) throw new SupabaseError(error.message);

    return {
      ...toCamelCase(data),
      clientName: (data[TABLES.clients] as Record<string, unknown> | null)?.name || "",
    };
  } catch (error) {
    if (error instanceof SupabaseError) throw error;
    throw new SupabaseError("Failed to update project");
  }
}

export async function deleteProject(id: string): Promise<void> {
  try {
    const userId = await getCurrentUserId();

    const { error } = await supabase
      .from(TABLES.projects)
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw new SupabaseError(error.message);
  } catch (error) {
    if (error instanceof SupabaseError) throw error;
    throw new SupabaseError("Failed to delete project");
  }
}
