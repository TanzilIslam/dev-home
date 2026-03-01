import { supabase } from "../client";
import { TABLES } from "@/lib/config/tables";
import type {
  ClientItem,
  ClientPayload,
  ClientListData,
  DropdownListData,
  ListQueryParams,
} from "@/types/domain";
import {
  toCamelCase,
  toSnakeCase,
  parseListParams,
  createPaginatedResponse,
  throwIfError,
  withAuth,
} from "./utils";

export function listClients(params?: ListQueryParams): Promise<ClientListData> {
  return withAuth("Failed to fetch clients", async (userId) => {
    const { page, pageSize, search, offset } = parseListParams(params);

    let query = supabase
      .from(TABLES.clients)
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    if (!params?.all) {
      query = query.range(offset, offset + pageSize - 1);
    }

    const { data, count, error } = await query;
    throwIfError(error);

    return createPaginatedResponse(toCamelCase(data || []), count, page, pageSize);
  });
}

export function listClientDropdown(params?: ListQueryParams): Promise<DropdownListData> {
  return withAuth("Failed to fetch clients", async (userId) => {
    const { page, pageSize, search } = parseListParams(params);

    let query = supabase
      .from(TABLES.clients)
      .select("id, name", { count: "exact" })
      .eq("user_id", userId)
      .order("name", { ascending: true });

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    query = query.limit(pageSize);

    const { data, count, error } = await query;
    throwIfError(error);

    return createPaginatedResponse(toCamelCase(data || []), count, page, pageSize);
  });
}

export function createClient(payload: ClientPayload): Promise<ClientItem> {
  return withAuth("Failed to create client", async (userId) => {
    const snakePayload = toSnakeCase(payload);

    const { data, error } = await supabase
      .from(TABLES.clients)
      .insert([{ user_id: userId, ...snakePayload }])
      .select()
      .single();

    throwIfError(error);
    return toCamelCase(data);
  });
}

export function updateClient(id: string, payload: ClientPayload): Promise<ClientItem> {
  return withAuth("Failed to update client", async (userId) => {
    const snakePayload = toSnakeCase(payload);

    const { data, error } = await supabase
      .from(TABLES.clients)
      .update(snakePayload)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    throwIfError(error);
    return toCamelCase(data);
  });
}

export function deleteClient(id: string): Promise<void> {
  return withAuth("Failed to delete client", async (userId) => {
    const { error } = await supabase
      .from(TABLES.clients)
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    throwIfError(error);
  });
}
