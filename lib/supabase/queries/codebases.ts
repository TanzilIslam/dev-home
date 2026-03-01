import { supabase } from "../client";
import { TABLES } from "@/lib/config/tables";
import type {
  CodebaseItem,
  CodebasePayload,
  CodebaseListData,
  DropdownListData,
  CodebaseListQueryParams,
} from "@/types/domain";
import {
  toCamelCase,
  toSnakeCase,
  parseListParams,
  createPaginatedResponse,
  throwIfError,
  withAuth,
} from "./utils";

export function listCodebases(params?: CodebaseListQueryParams): Promise<CodebaseListData> {
  return withAuth("Failed to fetch codebases", async (userId) => {
    const { page, pageSize, search, offset } = parseListParams(params);

    let query = supabase
      .from(TABLES.codebases)
      .select(
        `
        *,
        "${TABLES.projects}"!inner (id, name, client_id, "${TABLES.clients}" (id, name))
      `,
        { count: "exact" },
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (params?.projectId) {
      query = query.eq("project_id", params.projectId);
    }

    if (params?.clientId) {
      query = query.eq(`${TABLES.projects}.client_id`, params.clientId);
    }

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    if (!params?.all) {
      query = query.range(offset, offset + pageSize - 1);
    }

    const { data, count, error } = await query;
    throwIfError(error);

    const mapped = (data?.map((c: Record<string, unknown>) => {
      const project = c[TABLES.projects] as Record<string, unknown> | null;
      const client = project?.[TABLES.clients] as Record<string, unknown> | null;
      return {
        ...toCamelCase(c),
        projectName: (project?.name as string) || "",
        clientId: (project?.client_id as string) || "",
        clientName: (client?.name as string) || "",
      };
    }) || []) as CodebaseItem[];

    return createPaginatedResponse(mapped, count, page, pageSize);
  });
}

export function listCodebaseDropdown(params?: CodebaseListQueryParams): Promise<DropdownListData> {
  return withAuth("Failed to fetch codebases", async (userId) => {
    const { page, pageSize, search } = parseListParams(params);

    let query = supabase
      .from(TABLES.codebases)
      .select("id, name", { count: "exact" })
      .eq("user_id", userId)
      .order("name", { ascending: true });

    if (params?.projectId) {
      query = query.eq("project_id", params.projectId);
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

export function createCodebase(payload: CodebasePayload): Promise<CodebaseItem> {
  return withAuth("Failed to create codebase", async (userId) => {
    const snakePayload = toSnakeCase(payload);

    const { data, error } = await supabase
      .from(TABLES.codebases)
      .insert([{ user_id: userId, ...snakePayload }])
      .select(
        `
        *,
        "${TABLES.projects}" (id, name, client_id, "${TABLES.clients}" (id, name))
      `,
      )
      .single();

    throwIfError(error);

    const project = data[TABLES.projects] as Record<string, unknown> | null;
    const client = project?.[TABLES.clients] as Record<string, unknown> | null;
    return {
      ...toCamelCase(data),
      projectName: (project?.name as string) || "",
      clientId: (project?.client_id as string) || "",
      clientName: (client?.name as string) || "",
    };
  });
}

export function updateCodebase(id: string, payload: CodebasePayload): Promise<CodebaseItem> {
  return withAuth("Failed to update codebase", async (userId) => {
    const snakePayload = toSnakeCase(payload);

    const { data, error } = await supabase
      .from(TABLES.codebases)
      .update(snakePayload)
      .eq("id", id)
      .eq("user_id", userId)
      .select(
        `
        *,
        "${TABLES.projects}" (id, name, client_id, "${TABLES.clients}" (id, name))
      `,
      )
      .single();

    throwIfError(error);

    const project = data[TABLES.projects] as Record<string, unknown> | null;
    const client = project?.[TABLES.clients] as Record<string, unknown> | null;
    return {
      ...toCamelCase(data),
      projectName: (project?.name as string) || "",
      clientId: (project?.client_id as string) || "",
      clientName: (client?.name as string) || "",
    };
  });
}

export function deleteCodebase(id: string): Promise<void> {
  return withAuth("Failed to delete codebase", async (userId) => {
    const { error } = await supabase
      .from(TABLES.codebases)
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    throwIfError(error);
  });
}
