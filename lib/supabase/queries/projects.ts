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
  toCamelCase,
  toSnakeCase,
  parseListParams,
  createPaginatedResponse,
  throwIfError,
  withAuth,
} from "./utils";

export function listProjects(params?: ProjectListQueryParams): Promise<ProjectListData> {
  return withAuth("Failed to fetch projects", async (userId) => {
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
    throwIfError(error);

    const mapped = (data?.map((p: Record<string, unknown>) => ({
      ...toCamelCase(p),
      clientName: ((p[TABLES.clients] as Record<string, unknown> | null)?.name as string) || "",
    })) || []) as ProjectItem[];

    return createPaginatedResponse(mapped, count, page, pageSize);
  });
}

export function listProjectDropdown(params?: ProjectListQueryParams): Promise<DropdownListData> {
  return withAuth("Failed to fetch projects", async (userId) => {
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
    throwIfError(error);

    return createPaginatedResponse(toCamelCase(data || []), count, page, pageSize);
  });
}

export function createProject(payload: ProjectPayload): Promise<ProjectItem> {
  return withAuth("Failed to create project", async (userId) => {
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

    throwIfError(error);

    return {
      ...toCamelCase(data),
      clientName: (data[TABLES.clients] as Record<string, unknown> | null)?.name || "",
    };
  });
}

export function updateProject(id: string, payload: ProjectPayload): Promise<ProjectItem> {
  return withAuth("Failed to update project", async (userId) => {
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

    throwIfError(error);

    return {
      ...toCamelCase(data),
      clientName: (data[TABLES.clients] as Record<string, unknown> | null)?.name || "",
    };
  });
}

export function deleteProject(id: string): Promise<void> {
  return withAuth("Failed to delete project", async (userId) => {
    const { error } = await supabase
      .from(TABLES.projects)
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    throwIfError(error);
  });
}
