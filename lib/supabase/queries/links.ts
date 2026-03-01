import { supabase } from "../client";
import { TABLES } from "@/lib/config/tables";
import type { LinkItem, LinkPayload, LinkListData, LinkListQueryParams } from "@/types/domain";
import {
  toCamelCase,
  toSnakeCase,
  parseListParams,
  createPaginatedResponse,
  throwIfError,
  withAuth,
} from "./utils";

export function listLinks(params?: LinkListQueryParams): Promise<LinkListData> {
  return withAuth("Failed to fetch links", async (userId) => {
    const { page, pageSize, search, offset } = parseListParams(params);

    let query = supabase
      .from(TABLES.links)
      .select(
        `
        *,
        client:client_id (id, name),
        project:project_id (id, name),
        codebase:codebase_id (id, name)
      `,
        { count: "exact" },
      )
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
      query = query.ilike("title", `%${search}%`);
    }

    if (!params?.all) {
      query = query.range(offset, offset + pageSize - 1);
    }

    const { data, count, error } = await query;
    throwIfError(error);

    const mapped = (data?.map((l: Record<string, unknown>) => ({
      ...toCamelCase(l),
      clientName: ((l.client as Record<string, unknown> | null)?.name as string) || null,
      projectName: ((l.project as Record<string, unknown> | null)?.name as string) || null,
      codebaseName: ((l.codebase as Record<string, unknown> | null)?.name as string) || null,
    })) || []) as LinkItem[];

    return createPaginatedResponse(mapped, count, page, pageSize);
  });
}

export function createLink(payload: LinkPayload): Promise<LinkItem> {
  return withAuth("Failed to create link", async (userId) => {
    const snakePayload = toSnakeCase(payload);

    const { data, error } = await supabase
      .from(TABLES.links)
      .insert([{ user_id: userId, ...snakePayload }])
      .select(
        `
        *,
        client:client_id (id, name),
        project:project_id (id, name),
        codebase:codebase_id (id, name)
      `,
      )
      .single();

    throwIfError(error);

    const row = data as Record<string, unknown>;
    return {
      ...toCamelCase(row),
      clientName: ((row.client as Record<string, unknown> | null)?.name as string) || null,
      projectName: ((row.project as Record<string, unknown> | null)?.name as string) || null,
      codebaseName: ((row.codebase as Record<string, unknown> | null)?.name as string) || null,
    } as LinkItem;
  });
}

export function updateLink(id: string, payload: LinkPayload): Promise<LinkItem> {
  return withAuth("Failed to update link", async (userId) => {
    const snakePayload = toSnakeCase(payload);

    const { data, error } = await supabase
      .from(TABLES.links)
      .update(snakePayload)
      .eq("id", id)
      .eq("user_id", userId)
      .select(
        `
        *,
        client:client_id (id, name),
        project:project_id (id, name),
        codebase:codebase_id (id, name)
      `,
      )
      .single();

    throwIfError(error);

    const row = data as Record<string, unknown>;
    return {
      ...toCamelCase(row),
      clientName: ((row.client as Record<string, unknown> | null)?.name as string) || null,
      projectName: ((row.project as Record<string, unknown> | null)?.name as string) || null,
      codebaseName: ((row.codebase as Record<string, unknown> | null)?.name as string) || null,
    } as LinkItem;
  });
}

export function deleteLink(id: string): Promise<void> {
  return withAuth("Failed to delete link", async (userId) => {
    const { error } = await supabase.from(TABLES.links).delete().eq("id", id).eq("user_id", userId);

    throwIfError(error);
  });
}
