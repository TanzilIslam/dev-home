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
  SupabaseError,
  toCamelCase,
  toSnakeCase,
  parseListParams,
  createPaginatedResponse,
  getCurrentUserId,
} from "./utils";

export async function listCodebases(params?: CodebaseListQueryParams): Promise<CodebaseListData> {
  try {
    const userId = await getCurrentUserId();
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

    if (error) throw new SupabaseError(error.message);

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
  } catch (error) {
    if (error instanceof SupabaseError) throw error;
    throw new SupabaseError("Failed to fetch codebases");
  }
}

export async function listCodebaseDropdown(
  params?: CodebaseListQueryParams,
): Promise<DropdownListData> {
  try {
    const userId = await getCurrentUserId();
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

    if (error) throw new SupabaseError(error.message);

    const camelData = toCamelCase(data || []);
    return createPaginatedResponse(camelData, count, page, pageSize);
  } catch (error) {
    if (error instanceof SupabaseError) throw error;
    throw new SupabaseError("Failed to fetch codebases");
  }
}

export async function createCodebase(payload: CodebasePayload): Promise<CodebaseItem> {
  try {
    const userId = await getCurrentUserId();
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

    if (error) throw new SupabaseError(error.message);

    const project = data[TABLES.projects] as Record<string, unknown> | null;
    const client = project?.[TABLES.clients] as Record<string, unknown> | null;
    return {
      ...toCamelCase(data),
      projectName: (project?.name as string) || "",
      clientId: (project?.client_id as string) || "",
      clientName: (client?.name as string) || "",
    };
  } catch (error) {
    if (error instanceof SupabaseError) throw error;
    throw new SupabaseError("Failed to create codebase");
  }
}

export async function updateCodebase(id: string, payload: CodebasePayload): Promise<CodebaseItem> {
  try {
    const userId = await getCurrentUserId();
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

    if (error) throw new SupabaseError(error.message);

    const project = data[TABLES.projects] as Record<string, unknown> | null;
    const client = project?.[TABLES.clients] as Record<string, unknown> | null;
    return {
      ...toCamelCase(data),
      projectName: (project?.name as string) || "",
      clientId: (project?.client_id as string) || "",
      clientName: (client?.name as string) || "",
    };
  } catch (error) {
    if (error instanceof SupabaseError) throw error;
    throw new SupabaseError("Failed to update codebase");
  }
}

export async function deleteCodebase(id: string): Promise<void> {
  try {
    const userId = await getCurrentUserId();

    const { error } = await supabase
      .from(TABLES.codebases)
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw new SupabaseError(error.message);
  } catch (error) {
    if (error instanceof SupabaseError) throw error;
    throw new SupabaseError("Failed to delete codebase");
  }
}
